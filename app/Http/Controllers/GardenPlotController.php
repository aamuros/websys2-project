<?php

namespace App\Http\Controllers;

use App\Models\GardenPlot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class GardenPlotController extends Controller
{
    public function index(Request $request): Response
    {
        if ($request->user()->role->value === 'member') {
            return Inertia::render('workspace-page', [
                'page' => 'garden-plots',
                'title' => 'Garden plots',
                'description' => 'Browse available plots and view how they are currently used.',
            ]);
        }

        $query = GardenPlot::query()->withCount('assignments')->orderBy('plot_code');
        if ($request->string('status')->toString() === 'archived') {
            $query->whereNotNull('archived_at');
        } else {
            $query->whereNull('archived_at');
        }
        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(fn ($q) => $q->where('plot_code', 'like', "%{$search}%")->orWhere('location', 'like', "%{$search}%"));
        }
        if ($request->filled('status') && $request->string('status')->toString() !== 'archived') {
            $query->where('status', $request->string('status'));
        }

        return Inertia::render('garden-plots', ['plots' => $query->paginate(10)->withQueryString(), 'filters' => $request->only('search', 'status')]);
    }

    public function apiIndex(Request $request): JsonResponse
    {
        $pendingPlotIds = $request->user()->plotRequests()
            ->where('status', 'pending')
            ->whereNotNull('garden_plot_id')
            ->pluck('garden_plot_id')
            ->all();
        $pendingPlotLookup = array_fill_keys($pendingPlotIds, true);

        $plots = GardenPlot::query()->whereNull('archived_at')->orderBy('plot_code')->get()
            ->map(fn (GardenPlot $plot): array => [
                'id' => $plot->id,
                'plot_code' => $plot->plot_code,
                'location' => $plot->location,
                'size' => (float) $plot->size,
                'status' => $plot->status->value,
                'has_pending_request' => isset($pendingPlotLookup[$plot->id]),
            ]);

        return response()->json([
            'data' => $plots,
            'meta' => ['total' => $plots->count(), 'generated_at' => now()->toIso8601String()],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireOperations($request);
        $data = $this->validated($request);
        abort_if($data['status'] === 'occupied', 422, 'Occupied status is managed through assignments.');
        GardenPlot::create($data);

        return back()->with('success', 'Garden plot created.');
    }

    public function update(Request $request, GardenPlot $gardenPlot): RedirectResponse
    {
        $this->requireOperations($request);
        $data = $this->validated($request, $gardenPlot);
        abort_if($data['status'] === 'occupied' && ! $gardenPlot->assignments()->where('status', 'active')->exists(), 422, 'Occupied status is managed through assignments.');
        abort_if($gardenPlot->assignments()->where('status', 'active')->exists() && $data['status'] !== 'occupied', 422, 'End the active assignment before changing this plot status.');
        $gardenPlot->update($data);

        return back()->with('success', 'Garden plot updated.');
    }

    public function archive(Request $request, GardenPlot $gardenPlot): RedirectResponse
    {
        $this->requireOperations($request);
        abort_if($gardenPlot->assignments()->where('status', 'active')->exists(), 422, 'An occupied plot cannot be archived.');
        $gardenPlot->update(['archived_at' => now()]);

        return back()->with('success', 'Plot archived as maintenance.');
    }

    private function validated(Request $request, ?GardenPlot $plot = null): array
    {
        return $request->validate([
            'plot_code' => ['required', 'string', 'max:30', Rule::unique('garden_plots')->ignore($plot)],
            'location' => ['required', 'string', 'max:120'],
            'size' => ['required', 'numeric', 'min:0.01', 'max:999999.99'],
            'status' => ['required', Rule::in(['available', 'reserved', 'occupied', 'maintenance'])],
        ]);
    }
}
