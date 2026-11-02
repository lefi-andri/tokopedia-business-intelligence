<?php

it('returns a successful response', function () {
    $this->artisan('dashboard:import', [
        'path' => base_path('tests/Fixtures/tokopedia-mini.csv'),
        '--force' => true,
    ])->assertSuccessful();

    $response = $this->get('/');

    $response->assertStatus(200);
});
