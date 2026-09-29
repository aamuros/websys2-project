<?php

namespace App\Http\Controllers;

use App\Models\PlotAssignment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PlantingController extends Controller
{
    public function store(Request $request, PlotAssignment $assignment): RedirectResponse
    {
        abort_unless($request->user()->role->value === 'member' && $assignment->user_id === $request->user()->id, 403);
        DB::transaction(function () use ($request, $assignment) {
            $assignment = PlotAssignment::lockForUpdate()->findOrFail($assignment->id);
            abort_unless($assignment->status->value === 'active', 422, 'This assignment is no longer active.');
            $lastPlantingDate = $assignment->end_date && $assignment->end_date->isBefore(today())
                ? $assignment->end_date->toDateString()
                : today()->toDateString();

            $data = $request->validate([
                'crop_id' => ['required', 'integer', Rule::exists('crops', 'id')],
                'planted_at' => ['required', 'date', 'after_or_equal:'.$assignment->start_date->toDateString(), 'before_or_equal:'.$lastPlantingDate],
            ]);
            $assignment->plantings()->create($data);
        });

        return back()->with('success', 'Planting added.');
    }
}
