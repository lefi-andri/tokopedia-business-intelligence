<?php

namespace App\Http\Controllers;

use App\Services\TokopediaDashboardService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(TokopediaDashboardService $dashboard): Response
    {
        return Inertia::render('Dashboard', [
            'dashboard' => $dashboard->getInitialData(),
        ]);
    }
}
