<?php

use Illuminate\Support\Facades\DB;

test('csv import command loads normalized and aggregate dashboard tables', function () {
    $this->artisan('dashboard:import', [
        'path' => base_path('tests/Fixtures/tokopedia-mini.csv'),
        '--force' => true,
    ])->assertSuccessful();

    expect(DB::table('tokopedia_reviews')->count())->toBe(2)
        ->and(DB::table('tokopedia_products')->count())->toBe(2)
        ->and(DB::table('tokopedia_review_monthly_summaries')->count())->toBe(2)
        ->and(DB::table('dashboard_imports')->value('total_reviews'))->toBe(2);
});
