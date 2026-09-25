<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Crop extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'type', 'maturity_days_min', 'maturity_days_max', 'harvest_window_days', 'maturity_source'];

    protected function casts(): array
    {
        return [
            'maturity_days_min' => 'integer',
            'maturity_days_max' => 'integer',
            'harvest_window_days' => 'integer',
        ];
    }

    public function plantings(): HasMany
    {
        return $this->hasMany(Planting::class);
    }
}
