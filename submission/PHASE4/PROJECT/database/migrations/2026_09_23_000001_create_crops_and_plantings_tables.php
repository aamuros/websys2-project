<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crops', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->enum('type', ['fruit', 'vegetable', 'herb', 'flower']);
            $table->timestamps();
        });

        Schema::create('plantings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plot_assignment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('crop_id')->constrained()->restrictOnDelete();
            $table->date('planted_at');
            $table->timestamps();

            $table->index(['plot_assignment_id', 'planted_at']);
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE crops ENABLE ROW LEVEL SECURITY');
            DB::statement('ALTER TABLE plantings ENABLE ROW LEVEL SECURITY');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('plantings');
        Schema::dropIfExists('crops');
    }
};
