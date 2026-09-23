<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE crops DROP CONSTRAINT crops_type_check');
            DB::statement("ALTER TABLE crops ADD CONSTRAINT crops_type_check CHECK (type IN ('fruit', 'vegetable', 'herb', 'flower'))");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE crops DROP CONSTRAINT crops_type_check');
            DB::statement("ALTER TABLE crops ADD CONSTRAINT crops_type_check CHECK (type IN ('fruit', 'vegetable', 'herb', 'flower', 'grain'))");
        }
    }
};
