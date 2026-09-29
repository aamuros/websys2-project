<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plot_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('garden_plot_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])
                ->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('garden_plot_id');
            $table->index(['status', 'created_at']);
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE plot_requests ENABLE ROW LEVEL SECURITY');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('plot_requests');
    }
};
