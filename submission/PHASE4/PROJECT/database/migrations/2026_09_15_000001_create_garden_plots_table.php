<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('garden_plots', function (Blueprint $table) {
            $table->id();
            $table->string('plot_code')->unique();
            $table->string('location');
            $table->decimal('size', 8, 2);
            $table->enum('status', ['available', 'reserved', 'occupied', 'maintenance'])
                ->default('available')
                ->index();
            $table->timestamps();
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE garden_plots ENABLE ROW LEVEL SECURITY');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('garden_plots');
    }
};
