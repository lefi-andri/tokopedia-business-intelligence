<?php

namespace App\Http\Controllers;

use App\Services\TokopediaDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DashboardDataController extends Controller
{
    public function analytics(Request $request, TokopediaDashboardService $dashboard): JsonResponse
    {
        $validated = $request->validate($this->globalFilterRules());

        return response()->json($dashboard->getAnalytics($this->filters($validated)));
    }

    public function reviews(Request $request, TokopediaDashboardService $dashboard): JsonResponse
    {
        $validated = $request->validate([
            ...$this->globalFilterRules(),
            'review_category' => ['nullable', 'string', 'max:100'],
            'rating' => ['nullable', 'integer', 'between:1,5'],
            'min_words' => ['nullable', 'integer', Rule::in([20, 50, 100])],
            'search' => ['nullable', 'string', 'max:200'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', Rule::in([7, 10, 20])],
        ]);

        return response()->json($dashboard->getPriorityReviews(
            $this->filters($validated),
            (int) ($validated['page'] ?? 1),
            (int) ($validated['per_page'] ?? 7),
        ));
    }

    private function globalFilterRules(): array
    {
        return [
            'years' => ['nullable', 'array'],
            'years.*' => ['integer', 'between:2000,2100'],
            'categories' => ['nullable', 'array'],
            'categories.*' => ['string', 'max:100'],
            'sentiments' => ['nullable', 'array'],
            'sentiments.*' => ['string', Rule::in(['positive', 'neutral', 'negative'])],
        ];
    }

    private function filters(array $validated): array
    {
        return [
            'years' => $validated['years'] ?? [],
            'categories' => $validated['categories'] ?? [],
            'sentiments' => $validated['sentiments'] ?? [],
            'review_category' => $validated['review_category'] ?? '',
            'rating' => $validated['rating'] ?? 0,
            'min_words' => $validated['min_words'] ?? 0,
            'search' => $validated['search'] ?? '',
        ];
    }
}
