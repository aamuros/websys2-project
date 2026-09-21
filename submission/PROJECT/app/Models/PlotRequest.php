<?php

namespace App\Models;

use App\Enums\PlotRequestStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlotRequest extends Model
{
    use HasFactory;

    /** @var list<string> */
    protected $fillable = ['user_id', 'garden_plot_id', 'status', 'notes', 'reviewed_by', 'reviewed_at', 'decision_notes'];

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
        return ['status' => PlotRequestStatus::class, 'reviewed_at' => 'datetime'];
    }
}
