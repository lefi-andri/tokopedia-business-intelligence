<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tokopedia_products', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->string('name', 500);
            $table->string('category', 100)->index();
            $table->decimal('price', 15, 2);
            $table->unsignedBigInteger('sold_count')->default(0);
            $table->unsignedBigInteger('shop_id')->index();
            $table->decimal('avg_rating', 5, 3)->default(0);
            $table->unsignedInteger('review_count')->default(0);
            $table->timestamps();
        });

        Schema::create('tokopedia_reviews', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->date('review_date');
            $table->unsignedSmallInteger('review_year');
            $table->char('review_month', 7);
            $table->unsignedBigInteger('product_id');
            $table->string('product_category', 100);
            $table->string('product_variant', 255)->nullable();
            $table->unsignedTinyInteger('rating');
            $table->string('rating_group', 32)->nullable();
            $table->string('sentiment', 16);
            $table->boolean('rating_sentiment_consistent')->default(true);
            $table->text('review_text');
            $table->text('review_text_clean')->nullable();
            $table->boolean('clean_text_available')->default(false);
            $table->unsignedInteger('review_char_count')->default(0);
            $table->unsignedInteger('review_word_count')->default(0);
            $table->boolean('has_url')->default(false);
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('tokopedia_products')->cascadeOnDelete();
            $table->index(['review_year', 'product_category', 'sentiment'], 'reviews_year_category_sentiment_index');
            $table->index(['sentiment', 'review_word_count'], 'reviews_sentiment_words_index');
            $table->index(['review_month', 'sentiment'], 'reviews_month_sentiment_index');
            $table->index(['product_id', 'review_year', 'sentiment'], 'reviews_product_year_sentiment_index');
            $table->index(['rating', 'sentiment'], 'reviews_rating_sentiment_index');
        });

        Schema::create('tokopedia_review_monthly_summaries', function (Blueprint $table) {
            $table->id();
            $table->char('review_month', 7);
            $table->unsignedSmallInteger('review_year');
            $table->string('product_category', 100);
            $table->string('sentiment', 16);
            $table->unsignedTinyInteger('rating');
            $table->unsignedInteger('review_count');
            $table->unsignedBigInteger('word_count_sum');

            $table->unique(
                ['review_month', 'product_category', 'sentiment', 'rating'],
                'review_month_category_sentiment_rating_unique',
            );
            $table->index(['review_year', 'product_category', 'sentiment'], 'summary_year_category_sentiment_index');
        });

        Schema::create('dashboard_imports', function (Blueprint $table) {
            $table->id();
            $table->string('source_name');
            $table->char('source_fingerprint', 40)->index();
            $table->unsignedInteger('total_reviews');
            $table->unsignedInteger('total_products');
            $table->unsignedInteger('total_shops');
            $table->unsignedSmallInteger('category_count');
            $table->date('min_date')->nullable();
            $table->date('max_date')->nullable();
            $table->timestamp('imported_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dashboard_imports');
        Schema::dropIfExists('tokopedia_review_monthly_summaries');
        Schema::dropIfExists('tokopedia_reviews');
        Schema::dropIfExists('tokopedia_products');
    }
};
