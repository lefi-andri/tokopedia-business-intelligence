<?php

namespace App\Services;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class TokopediaDashboardService
{
    private const SENTIMENTS = ['positive', 'neutral', 'negative'];

    private const SENTIMENT_META = [
        'positive' => ['name' => 'Positif', 'color' => '#03ac0e'],
        'neutral' => ['name' => 'Netral', 'color' => '#f59e0b'],
        'negative' => ['name' => 'Negatif', 'color' => '#e25555'],
    ];

    public function getInitialData(): array
    {
        return [
            ...$this->getBootstrapData(),
            'analytics' => $this->getAnalytics([]),
            'priorityReviews' => $this->getPriorityReviews([], 1, 7),
        ];
    }

    public function getAnalytics(array $filters): array
    {
        $filters = $this->normalizeFilters($filters);
        $cacheKey = 'tokopedia-dashboard:analytics:'.$this->dataVersion().':'.sha1(json_encode($filters));

        return Cache::remember($cacheKey, now()->addMinutes(10), function () use ($filters): array {
            $summaryRows = DB::table('tokopedia_review_monthly_summaries')
                ->when($filters['years'], fn (Builder $query) => $query->whereIn('review_year', $filters['years']))
                ->when($filters['categories'], fn (Builder $query) => $query->whereIn('product_category', $filters['categories']))
                ->orderBy('review_month')
                ->get();
            $selectedRows = $filters['sentiments']
                ? $summaryRows->whereIn('sentiment', $filters['sentiments'])
                : $summaryRows;
            $totalBaseReviews = $this->sumRows($summaryRows);
            $totalSelectedReviews = $this->sumRows($selectedRows);

            $distribution = collect(self::SENTIMENTS)->map(function (string $sentiment) use ($summaryRows): array {
                $meta = self::SENTIMENT_META[$sentiment];

                return [
                    'key' => $sentiment,
                    'name' => $meta['name'],
                    'value' => $this->sumRows($summaryRows->where('sentiment', $sentiment)),
                    'color' => $meta['color'],
                ];
            })->values()->all();

            $averageRating = $totalSelectedReviews
                ? $selectedRows->sum(fn (object $row): int => (int) $row->rating * (int) $row->review_count) / $totalSelectedReviews
                : 0;
            $positiveCount = collect($distribution)->firstWhere('key', 'positive')['value'] ?? 0;
            $selectedShare = $totalBaseReviews
                ? (($filters['sentiments'] ? $totalSelectedReviews : $positiveCount) / $totalBaseReviews) * 100
                : 0;
            $negativeCount = collect($distribution)->firstWhere('key', 'negative')['value'] ?? 0;
            $negativeRate = $totalBaseReviews ? ($negativeCount / $totalBaseReviews) * 100 : 0;

            $trendData = $summaryRows
                ->groupBy('review_month')
                ->map(function (Collection $monthRows, string $month) use ($filters): array {
                    $monthSelected = $filters['sentiments']
                        ? $monthRows->whereIn('sentiment', $filters['sentiments'])
                        : $monthRows;
                    $baseTotal = $this->sumRows($monthRows);
                    $negative = $this->sumRows($monthRows->where('sentiment', 'negative'));

                    return [
                        'month' => $month,
                        'volume' => $this->sumRows($monthSelected),
                        'negativeRate' => $baseTotal ? ($negative / $baseTotal) * 100 : 0,
                    ];
                })
                ->values()
                ->all();

            $products = $this->filteredProducts($filters);
            $soldValues = $products->pluck('sold')->map(fn (mixed $value): float => (float) $value)->all();
            $categoryData = $products
                ->groupBy('category')
                ->map(function (Collection $categoryProducts, string $category): array {
                    return [
                        'category' => $category,
                        'shortCategory' => str_replace('Handphone & Tablet', 'Handphone', $category),
                        'medianSold' => $this->median($categoryProducts->pluck('sold')->map(fn (mixed $value): float => (float) $value)->all()),
                        'products' => $categoryProducts->count(),
                        'avgRating' => (float) $categoryProducts->avg('avgRating'),
                    ];
                })
                ->sortByDesc('medianSold')
                ->values()
                ->all();

            return [
                'metrics' => [
                    'totalBaseReviews' => $totalBaseReviews,
                    'totalSelectedReviews' => $totalSelectedReviews,
                    'filteredProductCount' => $products->count(),
                    'averageRating' => $averageRating,
                    'selectedShare' => $selectedShare,
                    'medianSold' => $this->median($soldValues),
                    'negativeRate' => $negativeRate,
                    'correlation' => $this->pearson($products),
                ],
                'distribution' => $distribution,
                'trendData' => $trendData,
                'categoryData' => $categoryData,
                'scatterPoints' => $this->sampleProducts($products, 600),
                'regressionData' => $this->linearRegressionLine($products),
            ];
        });
    }

    public function getPriorityReviews(array $filters, int $page = 1, int $perPage = 7): array
    {
        $filters = $this->normalizeFilters($filters);
        $page = max(1, $page);
        $perPage = in_array($perPage, [7, 10, 20], true) ? $perPage : 7;

        if ($filters['sentiments'] && ! in_array('negative', $filters['sentiments'], true)) {
            return $this->emptyPagination($page, $perPage);
        }

        $query = DB::table('tokopedia_reviews as reviews')
            ->join('tokopedia_products as products', 'products.id', '=', 'reviews.product_id')
            ->where('reviews.sentiment', 'negative')
            ->when($filters['years'], fn (Builder $builder) => $builder->whereIn('reviews.review_year', $filters['years']))
            ->when($filters['categories'], fn (Builder $builder) => $builder->whereIn('reviews.product_category', $filters['categories']))
            ->when($filters['review_category'], fn (Builder $builder, string $category) => $builder->where('reviews.product_category', $category))
            ->when($filters['rating'], fn (Builder $builder, int $rating) => $builder->where('reviews.rating', $rating))
            ->when($filters['min_words'], fn (Builder $builder, int $words) => $builder->where('reviews.review_word_count', '>=', $words))
            ->when($filters['search'], function (Builder $builder, string $search): void {
                $builder->where(function (Builder $searchQuery) use ($search): void {
                    $searchQuery
                        ->where('products.name', 'like', "%{$search}%")
                        ->orWhere('reviews.review_text', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('reviews.review_word_count')
            ->orderBy('reviews.id');

        $paginator = $query->paginate(
            $perPage,
            [
                'reviews.id', 'reviews.review_date', 'reviews.review_year',
                'reviews.product_category', 'reviews.rating', 'reviews.review_word_count',
                'reviews.review_text', 'products.name as product_name',
            ],
            'page',
            $page,
        );

        return [
            'data' => $paginator->getCollection()->map(static fn (object $review): array => [
                'id' => (int) $review->id,
                'date' => (string) $review->review_date,
                'year' => (string) $review->review_year,
                'product' => $review->product_name,
                'category' => $review->product_category,
                'rating' => (int) $review->rating,
                'words' => (int) $review->review_word_count,
                'text' => $review->review_text,
            ])->all(),
            'total' => $paginator->total(),
            'currentPage' => $paginator->currentPage(),
            'lastPage' => max(1, $paginator->lastPage()),
            'perPage' => $paginator->perPage(),
            'from' => $paginator->firstItem() ?? 0,
            'to' => $paginator->lastItem() ?? 0,
        ];
    }

    private function getBootstrapData(): array
    {
        $version = $this->dataVersion();

        return Cache::remember('tokopedia-dashboard:bootstrap:'.$version, now()->addHour(), function (): array {
            $import = DB::table('dashboard_imports')->latest('id')->first();
            $years = DB::table('tokopedia_review_monthly_summaries')->distinct()->orderBy('review_year')->pluck('review_year')->map(fn (mixed $year): string => (string) $year)->all();
            $months = DB::table('tokopedia_review_monthly_summaries')->distinct()->orderBy('review_month')->pluck('review_month')->all();
            $categories = DB::table('tokopedia_products')->distinct()->orderBy('category')->pluck('category')->all();

            return [
                'meta' => [
                    'source' => $import->source_name,
                    'sourceFingerprint' => $import->source_fingerprint,
                    'generatedAt' => now()->toIso8601String(),
                    'dataUpdatedAt' => $import->imported_at,
                    'totalReviews' => (int) $import->total_reviews,
                    'totalProducts' => (int) $import->total_products,
                    'totalShops' => (int) $import->total_shops,
                    'categoryCount' => (int) $import->category_count,
                    'minDate' => (string) $import->min_date,
                    'maxDate' => (string) $import->max_date,
                    'grain' => 'Satu baris per ulasan; metrik penjualan dihitung pada level produk unik.',
                    'storage' => 'MariaDB dengan agregasi bulanan dan cache aplikasi.',
                ],
                'filters' => [
                    'years' => $years,
                    'months' => $months,
                    'categories' => $categories,
                    'sentiments' => self::SENTIMENTS,
                ],
                'analysis' => [
                    'priceElasticity' => -0.392,
                    'priceSalesCorrelation' => -0.453,
                    'priceSalesRSquared' => 0.205,
                    'categoryEffectSize' => 0.452,
                    'negativeReviewWords' => 24.26,
                    'positiveReviewWords' => 11.89,
                ],
            ];
        });
    }

    private function dataVersion(): string
    {
        $import = DB::table('dashboard_imports')->latest('id')->first(['id', 'source_fingerprint']);

        if (! $import) {
            throw new RuntimeException('Data dashboard belum diimpor. Jalankan: php artisan dashboard:import');
        }

        return $import->id.'-'.$import->source_fingerprint;
    }

    private function normalizeFilters(array $filters): array
    {
        return [
            'years' => array_values(array_unique(array_map('intval', $filters['years'] ?? []))),
            'categories' => array_values(array_unique(array_filter(array_map('strval', $filters['categories'] ?? [])))),
            'sentiments' => array_values(array_intersect(self::SENTIMENTS, array_map('strval', $filters['sentiments'] ?? []))),
            'review_category' => trim((string) ($filters['review_category'] ?? '')),
            'rating' => (int) ($filters['rating'] ?? 0),
            'min_words' => (int) ($filters['min_words'] ?? 0),
            'search' => trim((string) ($filters['search'] ?? '')),
        ];
    }

    private function filteredProducts(array $filters): Collection
    {
        return DB::table('tokopedia_products as products')
            ->select([
                'products.id', 'products.name', 'products.category', 'products.price',
                'products.sold_count as sold', 'products.avg_rating as avgRating',
            ])
            ->when($filters['categories'], fn (Builder $query) => $query->whereIn('products.category', $filters['categories']))
            ->whereExists(function (Builder $query) use ($filters): void {
                $query->selectRaw('1')
                    ->from('tokopedia_reviews as product_reviews')
                    ->whereColumn('product_reviews.product_id', 'products.id')
                    ->when($filters['years'], fn (Builder $reviews) => $reviews->whereIn('product_reviews.review_year', $filters['years']))
                    ->when($filters['categories'], fn (Builder $reviews) => $reviews->whereIn('product_reviews.product_category', $filters['categories']))
                    ->when($filters['sentiments'], fn (Builder $reviews) => $reviews->whereIn('product_reviews.sentiment', $filters['sentiments']));
            })
            ->orderBy('products.id')
            ->get()
            ->map(static fn (object $product): array => [
                'id' => (int) $product->id,
                'name' => $product->name,
                'category' => $product->category,
                'price' => (float) $product->price,
                'sold' => (float) $product->sold,
                'avgRating' => (float) $product->avgRating,
            ]);
    }

    private function sampleProducts(Collection $products, int $limit): array
    {
        if ($products->count() <= $limit) {
            return $products->values()->all();
        }

        $step = (int) ceil($products->count() / $limit);

        return $products
            ->filter(fn (array $product, int $index): bool => $index % $step === 0)
            ->take($limit)
            ->values()
            ->all();
    }

    private function sumRows(Collection $rows): int
    {
        return (int) $rows->sum(fn (object $row): int => (int) $row->review_count);
    }

    private function median(array $values): float
    {
        if ($values === []) {
            return 0;
        }

        sort($values, SORT_NUMERIC);
        $middle = intdiv(count($values), 2);

        return count($values) % 2
            ? (float) $values[$middle]
            : ((float) $values[$middle - 1] + (float) $values[$middle]) / 2;
    }

    private function pearson(Collection $products): float
    {
        if ($products->count() < 2) {
            return 0;
        }

        $points = $products->map(fn (array $product): array => [log1p($product['price']), log1p($product['sold'])]);
        $meanX = $points->avg(fn (array $point): float => $point[0]);
        $meanY = $points->avg(fn (array $point): float => $point[1]);
        $numerator = 0;
        $denominatorX = 0;
        $denominatorY = 0;

        foreach ($points as [$x, $y]) {
            $numerator += ($x - $meanX) * ($y - $meanY);
            $denominatorX += ($x - $meanX) ** 2;
            $denominatorY += ($y - $meanY) ** 2;
        }

        return $numerator / sqrt(($denominatorX * $denominatorY) ?: 1);
    }

    private function linearRegressionLine(Collection $products): array
    {
        if ($products->count() < 2) {
            return [];
        }

        $points = $products->map(fn (array $product): array => [
            'logPrice' => log1p($product['price']),
            'logSold' => log1p($product['sold']),
        ]);
        $meanX = $points->avg('logPrice');
        $meanY = $points->avg('logSold');
        $numerator = $points->sum(fn (array $point): float => ($point['logPrice'] - $meanX) * ($point['logSold'] - $meanY));
        $denominator = $points->sum(fn (array $point): float => ($point['logPrice'] - $meanX) ** 2);
        $slope = $denominator ? $numerator / $denominator : 0;
        $intercept = $meanY - ($slope * $meanX);
        $minX = $points->min('logPrice');
        $maxX = $points->max('logPrice');

        return [
            ['logPrice' => $minX, 'logSold' => max(0, $intercept + ($slope * $minX))],
            ['logPrice' => $maxX, 'logSold' => max(0, $intercept + ($slope * $maxX))],
        ];
    }

    private function emptyPagination(int $page, int $perPage): array
    {
        return [
            'data' => [], 'total' => 0, 'currentPage' => $page, 'lastPage' => 1,
            'perPage' => $perPage, 'from' => 0, 'to' => 0,
        ];
    }
}
