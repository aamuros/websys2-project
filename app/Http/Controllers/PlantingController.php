<?php

namespace App\Http\Controllers;

use App\Models\PlotAssignment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlantingController extends Controller
{
    public function store(Request $request, PlotAssignment $assignment): RedirectResponse
    {
        abort_unless($request->user()->role->value === 'member' && $assignment->user_id === $request->user()->id, 403);
        abort_unless($assignment->status->value === 'active', 422, 'This assignment is no longer active.');

        $data = $request->validate([
            'crop_id' => ['required', Rule::exists('crops', 'id')],
            'planted_at' => ['required', 'date', 'after_or_equal:'.$assignment->start_date->toDateString(), 'before_or_equal:today'],
        ]);
        $assignment->plantings()->create($data);

        return back()->with('success', 'Planting added.');
    }
}
