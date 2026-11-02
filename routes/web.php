<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DashboardDataController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/', DashboardController::class)->name('home');
Route::get('/dashboard', DashboardController::class)->name('dashboard');
Route::get('/dashboard/data', [DashboardDataController::class, 'analytics'])->name('dashboard.data');
Route::get('/dashboard/reviews', [DashboardDataController::class, 'reviews'])->name('dashboard.reviews');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
