<?php

namespace App\Http\Controllers;

use App\Models\GardenPlot;
use App\Models\PlotAssignment;
use App\Models\User;
use App\Notifications\GardenNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AssignmentController extends Controller
{
    public function index(Request $request): Response
    {
        $query = PlotAssignment::with(['user:id,name,email', 'gardenPlot:id,plot_code,location'])->latest('start_date');
        if ($request->user()->role->value === 'member') {
            $query->where('user_id', $request->user()->id);
        }
        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(fn ($q) => $q->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"))->orWhereHas('gardenPlot', fn ($p) => $p->where('plot_code', 'like', "%{$search}%")));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return Inertia::render('assignments', [
            'assignments' => $query->paginate(10)->withQueryString(), 'filters' => $request->only('search', 'status'),
            'members' => User::where('role', 'member')->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'availablePlots' => GardenPlot::where('status', 'available')->whereNull('archived_at')->orderBy('plot_code')->get(['id', 'plot_code']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireOperations($request);
        $data = $this->validated($request);
        DB::transaction(function () use ($request, $data) {
            $plot = GardenPlot::lockForUpdate()->findOrFail($data['garden_plot_id']);
            abort_unless($plot->status->value === 'available', 422, 'Plot is unavailable.');
            abort_if(PlotAssignment::where('user_id', $data['user_id'])->where('status', 'active')->exists(), 422, 'Member already has an active assignment.');
            $assignment = PlotAssignment::create([...$data, 'status' => 'active', 'assigned_by' => $request->user()->id]);
            $plot->update(['status' => 'occupied']);
            $assignment->user->notify(new GardenNotification("You were assigned plot {$plot->plot_code}.", '/assignments'));
        });

        return back()->with('success', 'Assignment created.');
    }

    public function update(Request $request, PlotAssignment $assignment): RedirectResponse
    {
        $this->requireOperations($request);
        abort_unless($assignment->status->value === 'active', 422);
        $assignment->update($request->validate(['start_date' => ['required', 'date'], 'end_date' => ['nullable', 'date', 'after_or_equal:start_date']]));

        return back()->with('success', 'Assignment dates updated.');
    }

    public function close(Request $request, PlotAssignment $assignment): RedirectResponse
    {
        $this->requireOperations($request);
        $data = $request->validate(['status' => ['required', Rule::in(['ended', 'cancelled'])], 'end_date' => ['required', 'date', 'after_or_equal:'.$assignment->start_date->toDateString()]]);
        DB::transaction(function () use ($assignment, $data) {
            abort_unless($assignment->status->value === 'active', 422);
            $assignment->update($data);
            $assignment->gardenPlot()->where('status', 'occupied')->update(['status' => 'available']);
            $assignment->user->notify(new GardenNotification('Your plot assignment has ended.', '/assignments'));
        });

        return back()->with('success', 'Assignment closed and plot released.');
    }

    private function validated(Request $request): array
    {
        return $request->validate(['user_id' => ['required', Rule::exists('users', 'id')->where('role', 'member')->where('is_active', true)], 'garden_plot_id' => ['required', Rule::exists('garden_plots', 'id')->where(fn ($query) => $query->where('status', 'available')->whereNull('archived_at'))], 'start_date' => ['required', 'date'], 'end_date' => ['nullable', 'date', 'after_or_equal:start_date']]);
    }
}
