<?php

namespace App\Models;

use App\Enums\PlotAssignmentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlotAssignment extends Model
{
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'user_id',
        'garden_plot_id',
        'start_date',
        'end_date',
        'status',
        'assigned_by',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function gardenPlot(): BelongsTo
    {
        return $this->belongsTo(GardenPlot::class);
    }

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'status' => PlotAssignmentStatus::class,
        ];
    }
}
