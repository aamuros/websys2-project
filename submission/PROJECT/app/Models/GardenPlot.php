<?php

namespace App\Models;

use App\Enums\GardenPlotStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GardenPlot extends Model
{
    use HasFactory;

    /** @var list<string> */
    protected $fillable = ['plot_code', 'location', 'size', 'status', 'archived_at'];

    public function requests(): HasMany
    {
        return $this->hasMany(PlotRequest::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(PlotAssignment::class);
    }

    protected function casts(): array
    {
        return [
            'size' => 'decimal:2',
            'status' => GardenPlotStatus::class,
            'archived_at' => 'datetime',
        ];
    }
}
