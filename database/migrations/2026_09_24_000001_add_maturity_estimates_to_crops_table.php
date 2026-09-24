<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('crops', function (Blueprint $table) {
            $table->unsignedSmallInteger('maturity_days_min')->nullable();
            $table->unsignedSmallInteger('maturity_days_max')->nullable();
            $table->unsignedSmallInteger('harvest_window_days')->nullable();
            $table->string('maturity_source', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('crops', function (Blueprint $table) {
            $table->dropColumn(['maturity_days_min', 'maturity_days_max', 'harvest_window_days', 'maturity_source']);
        });
    }
};
