<?php

use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $now = now();

    DB::table('tokopedia_products')->insert([
        [
            'id' => 101, 'name' => 'Masker Anak', 'category' => 'Kesehatan',
            'price' => 10000, 'sold_count' => 100, 'shop_id' => 1,
            'avg_rating' => 1.5, 'review_count' => 2, 'created_at' => $now, 'updated_at' => $now,
        ],
        [
            'id' => 102, 'name' => 'Kulkas', 'category' => 'Elektronik',
            'price' => 5000000, 'sold_count' => 50, 'shop_id' => 2,
            'avg_rating' => 5, 'review_count' => 1, 'created_at' => $now, 'updated_at' => $now,
        ],
    ]);

    DB::table('tokopedia_reviews')->insert([
        [
            'id' => 1, 'review_date' => '2022-01-01', 'review_year' => 2022, 'review_month' => '2022-01',
            'product_id' => 101, 'product_category' => 'Kesehatan', 'product_variant' => null,
            'rating' => 1, 'rating_group' => 'Rendah (1-2)', 'sentiment' => 'negative',
            'rating_sentiment_consistent' => true, 'review_text' => 'Barang rusak parah dan tidak dapat digunakan.',
            'review_text_clean' => 'barang rusak parah', 'clean_text_available' => true,
            'review_char_count' => 45, 'review_word_count' => 100, 'has_url' => false,
            'created_at' => $now, 'updated_at' => $now,
        ],
        [
            'id' => 2, 'review_date' => '2022-01-02', 'review_year' => 2022, 'review_month' => '2022-01',
            'product_id' => 101, 'product_category' => 'Kesehatan', 'product_variant' => null,
            'rating' => 2, 'rating_group' => 'Rendah (1-2)', 'sentiment' => 'negative',
            'rating_sentiment_consistent' => true, 'review_text' => 'Kemasan penyok.',
            'review_text_clean' => 'kemasan penyok', 'clean_text_available' => true,
            'review_char_count' => 15, 'review_word_count' => 50, 'has_url' => false,
            'created_at' => $now, 'updated_at' => $now,
        ],
        [
            'id' => 3, 'review_date' => '2023-02-01', 'review_year' => 2023, 'review_month' => '2023-02',
            'product_id' => 102, 'product_category' => 'Elektronik', 'product_variant' => null,
            'rating' => 5, 'rating_group' => 'Tinggi (4-5)', 'sentiment' => 'positive',
            'rating_sentiment_consistent' => true, 'review_text' => 'Produk sangat baik.',
            'review_text_clean' => 'produk sangat baik', 'clean_text_available' => true,
            'review_char_count' => 18, 'review_word_count' => 5, 'has_url' => false,
            'created_at' => $now, 'updated_at' => $now,
        ],
    ]);

    DB::table('tokopedia_review_monthly_summaries')->insert([
        ['review_month' => '2022-01', 'review_year' => 2022, 'product_category' => 'Kesehatan', 'sentiment' => 'negative', 'rating' => 1, 'review_count' => 1, 'word_count_sum' => 100],
        ['review_month' => '2022-01', 'review_year' => 2022, 'product_category' => 'Kesehatan', 'sentiment' => 'negative', 'rating' => 2, 'review_count' => 1, 'word_count_sum' => 50],
        ['review_month' => '2023-02', 'review_year' => 2023, 'product_category' => 'Elektronik', 'sentiment' => 'positive', 'rating' => 5, 'review_count' => 1, 'word_count_sum' => 5],
    ]);

    DB::table('dashboard_imports')->insert([
        'source_name' => 'fixture.csv', 'source_fingerprint' => str_repeat('a', 40),
        'total_reviews' => 3, 'total_products' => 2, 'total_shops' => 2,
        'category_count' => 2, 'min_date' => '2022-01-01', 'max_date' => '2023-02-01',
        'imported_at' => $now,
    ]);
});

test('business intelligence dashboard uses database-backed initial data', function () {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('dashboard.meta.totalReviews', 3)
            ->where('dashboard.meta.totalProducts', 2)
            ->where('dashboard.meta.storage', 'MariaDB dengan agregasi bulanan dan cache aplikasi.')
            ->has('dashboard.filters.years', 2)
            ->has('dashboard.analytics.scatterPoints', 2)
            ->where('dashboard.analytics.metrics.filteredProductCount', 2)
            ->where('dashboard.priorityReviews.total', 2)
            ->has('dashboard.priorityReviews.data', 2)
        );
});

test('dashboard analytics endpoint applies global filters on the server', function () {
    $this->getJson('/dashboard/data?years[]=2022&sentiments[]=negative')
        ->assertOk()
        ->assertJsonPath('metrics.totalSelectedReviews', 2)
        ->assertJsonPath('metrics.filteredProductCount', 1)
        ->assertJsonCount(1, 'scatterPoints');
});

test('negative review endpoint filters and paginates on the server', function () {
    $this->getJson('/dashboard/reviews?rating=1&min_words=50&page=1&per_page=7')
        ->assertOk()
        ->assertJsonPath('total', 1)
        ->assertJsonPath('data.0.id', 1)
        ->assertJsonPath('data.0.product', 'Masker Anak');
});

test('dashboard alias renders the same experience', function () {
    $this->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Dashboard'));
});
