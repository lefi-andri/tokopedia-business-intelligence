<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use RuntimeException;
use SplFileObject;
use Throwable;

class ImportTokopediaDashboard extends Command
{
    protected $signature = 'dashboard:import
        {path? : Lokasi CSV; menggunakan BI_DATASET_PATH jika dikosongkan}
        {--force : Impor ulang walaupun fingerprint sumber belum berubah}';

    protected $description = 'Mengimpor dataset Tokopedia dari CSV ke tabel dashboard dan membangun agregasi bulanan';

    private const REQUIRED_COLUMNS = [
        'review_id', 'review_date', 'review_year', 'review_month', 'product_id',
        'product_name', 'product_category', 'product_variant', 'product_price',
        'rating', 'rating_group', 'sold_count', 'shop_id', 'sentiment_label',
        'rating_sentiment_consistent', 'review_text', 'review_text_clean',
        'clean_text_available', 'review_char_count', 'review_word_count', 'has_url',
    ];

    public function handle(): int
    {
        $path = (string) ($this->argument('path') ?: config('dashboard.dataset'));

        if (! File::isFile($path)) {
            $this->error("Dataset tidak ditemukan: {$path}");

            return self::FAILURE;
        }

        $fingerprint = sha1($path.'|'.File::lastModified($path).'|'.File::size($path));
        $latestFingerprint = DB::table('dashboard_imports')->latest('id')->value('source_fingerprint');

        if (! $this->option('force')
            && $latestFingerprint === $fingerprint
            && DB::table('tokopedia_reviews')->exists()) {
            $this->info('Dataset belum berubah. Impor dilewati. Gunakan --force untuk mengimpor ulang.');

            return self::SUCCESS;
        }

        $startedAt = microtime(true);
        $this->info('Membaca produk dan memvalidasi CSV...');

        try {
            [$products, $sourceMeta] = $this->scanProducts($path);

            DB::disableQueryLog();
            DB::transaction(function () use ($path, $products, $sourceMeta, $fingerprint): void {
                DB::table('tokopedia_review_monthly_summaries')->delete();
                DB::table('tokopedia_reviews')->delete();
                DB::table('tokopedia_products')->delete();

                $now = now();
                $productRows = array_map(static fn (array $product): array => [
                    'id' => $product['id'],
                    'name' => $product['name'],
                    'category' => $product['category'],
                    'price' => $product['price'],
                    'sold_count' => $product['sold_count'],
                    'shop_id' => $product['shop_id'],
                    'avg_rating' => $product['review_count']
                        ? round($product['rating_sum'] / $product['review_count'], 3)
                        : 0,
                    'review_count' => $product['review_count'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ], array_values($products));

                foreach (array_chunk($productRows, 750) as $chunk) {
                    DB::table('tokopedia_products')->insert($chunk);
                }

                $this->info('Mengimpor ulasan...');
                $reviewCount = $this->insertReviews($path, $now);

                if ($reviewCount !== $sourceMeta['total_reviews']) {
                    throw new RuntimeException("Jumlah ulasan tidak konsisten: {$reviewCount} dari {$sourceMeta['total_reviews']} baris.");
                }

                DB::table('tokopedia_review_monthly_summaries')->insertUsing(
                    [
                        'review_month', 'review_year', 'product_category', 'sentiment',
                        'rating', 'review_count', 'word_count_sum',
                    ],
                    DB::table('tokopedia_reviews')
                        ->select([
                            'review_month',
                            'review_year',
                            'product_category',
                            'sentiment',
                            'rating',
                            DB::raw('COUNT(*) as review_count'),
                            DB::raw('SUM(review_word_count) as word_count_sum'),
                        ])
                        ->groupBy('review_month', 'review_year', 'product_category', 'sentiment', 'rating'),
                );

                DB::table('dashboard_imports')->insert([
                    'source_name' => basename($path),
                    'source_fingerprint' => $fingerprint,
                    'total_reviews' => $sourceMeta['total_reviews'],
                    'total_products' => count($products),
                    'total_shops' => count($sourceMeta['shops']),
                    'category_count' => count($sourceMeta['categories']),
                    'min_date' => $sourceMeta['min_date'],
                    'max_date' => $sourceMeta['max_date'],
                    'imported_at' => now(),
                ]);
            }, 3);
        } catch (Throwable $exception) {
            report($exception);
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $seconds = number_format(microtime(true) - $startedAt, 2, ',', '.');
        $this->info(sprintf(
            'Impor selesai: %s ulasan, %s produk, dan %s kategori dalam %s detik.',
            number_format($sourceMeta['total_reviews'], 0, ',', '.'),
            number_format(count($products), 0, ',', '.'),
            number_format(count($sourceMeta['categories']), 0, ',', '.'),
            $seconds,
        ));

        return self::SUCCESS;
    }

    private function scanProducts(string $path): array
    {
        [$file, $columns, $columnCount] = $this->openCsv($path);
        $products = [];
        $categories = [];
        $shops = [];
        $totalReviews = 0;
        $minDate = null;
        $maxDate = null;

        while (! $file->eof()) {
            $row = $file->fgetcsv();

            if (! $this->validRow($row, $columnCount)) {
                continue;
            }

            $reviewId = (string) $row[$columns['review_id']];
            if ($reviewId === '') {
                continue;
            }

            $productId = (int) $row[$columns['product_id']];
            $category = (string) $row[$columns['product_category']];
            $shopId = (int) $row[$columns['shop_id']];
            $date = (string) $row[$columns['review_date']];

            if (! isset($products[$productId])) {
                $products[$productId] = [
                    'id' => $productId,
                    'name' => (string) $row[$columns['product_name']],
                    'category' => $category,
                    'price' => (float) $row[$columns['product_price']],
                    'sold_count' => (int) $row[$columns['sold_count']],
                    'shop_id' => $shopId,
                    'rating_sum' => 0,
                    'review_count' => 0,
                ];
            }

            $products[$productId]['rating_sum'] += (int) $row[$columns['rating']];
            $products[$productId]['review_count']++;
            $categories[$category] = true;
            $shops[$shopId] = true;
            $totalReviews++;
            $minDate = $minDate === null || $date < $minDate ? $date : $minDate;
            $maxDate = $maxDate === null || $date > $maxDate ? $date : $maxDate;
        }

        return [$products, [
            'categories' => $categories,
            'shops' => $shops,
            'total_reviews' => $totalReviews,
            'min_date' => $minDate,
            'max_date' => $maxDate,
        ]];
    }

    private function insertReviews(string $path, mixed $now): int
    {
        [$file, $columns, $columnCount] = $this->openCsv($path);
        $chunk = [];
        $count = 0;

        while (! $file->eof()) {
            $row = $file->fgetcsv();

            if (! $this->validRow($row, $columnCount) || (string) $row[$columns['review_id']] === '') {
                continue;
            }

            $chunk[] = [
                'id' => (int) $row[$columns['review_id']],
                'review_date' => (string) $row[$columns['review_date']],
                'review_year' => (int) $row[$columns['review_year']],
                'review_month' => (string) $row[$columns['review_month']],
                'product_id' => (int) $row[$columns['product_id']],
                'product_category' => (string) $row[$columns['product_category']],
                'product_variant' => $this->nullableString($row[$columns['product_variant']]),
                'rating' => (int) $row[$columns['rating']],
                'rating_group' => $this->nullableString($row[$columns['rating_group']]),
                'sentiment' => (string) $row[$columns['sentiment_label']],
                'rating_sentiment_consistent' => $this->toBoolean($row[$columns['rating_sentiment_consistent']]),
                'review_text' => (string) $row[$columns['review_text']],
                'review_text_clean' => $this->nullableString($row[$columns['review_text_clean']]),
                'clean_text_available' => $this->toBoolean($row[$columns['clean_text_available']]),
                'review_char_count' => (int) $row[$columns['review_char_count']],
                'review_word_count' => (int) $row[$columns['review_word_count']],
                'has_url' => $this->toBoolean($row[$columns['has_url']]),
                'created_at' => $now,
                'updated_at' => $now,
            ];
            $count++;

            if (count($chunk) === 750) {
                DB::table('tokopedia_reviews')->insert($chunk);
                $chunk = [];
            }
        }

        if ($chunk !== []) {
            DB::table('tokopedia_reviews')->insert($chunk);
        }

        return $count;
    }

    private function openCsv(string $path): array
    {
        $file = new SplFileObject($path, 'r');
        $file->setFlags(SplFileObject::READ_CSV | SplFileObject::SKIP_EMPTY | SplFileObject::DROP_NEW_LINE);
        $file->setCsvControl(',', '"', '');

        $headers = $file->fgetcsv();
        $headers[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string) $headers[0]);
        $columns = array_flip($headers);

        foreach (self::REQUIRED_COLUMNS as $column) {
            if (! array_key_exists($column, $columns)) {
                throw new RuntimeException("Kolom wajib tidak ditemukan: {$column}");
            }
        }

        return [$file, $columns, count($headers)];
    }

    private function validRow(array|false $row, int $columnCount): bool
    {
        return $row !== false && $row !== [null] && count($row) >= $columnCount;
    }

    private function toBoolean(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    private function nullableString(mixed $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
