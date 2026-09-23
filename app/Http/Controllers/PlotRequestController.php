<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePlotRequest;
use App\Models\GardenPlot;
use App\Models\PlotAssignment;
use App\Models\PlotRequest;
use App\Models\User;
use App\Notifications\GardenNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PlotRequestController extends Controller
{
    public function index(Request $request): Response
    {
        if ($request->user()->role->value === 'member') {
            $plotRequests = $request->user()->plotRequests()
                ->with('gardenPlot:id,plot_code,location,size,status')
                ->latest()
                ->get()
                ->map(fn (PlotRequest $plotRequest): array => [
                    'id' => $plotRequest->id,
                    'status' => $plotRequest->status->value,
                    'notes' => $plotRequest->notes,
                    'submitted_at' => $plotRequest->created_at->toIso8601String(),
                    'updated_at' => $plotRequest->updated_at->toIso8601String(),
                    'plot' => $plotRequest->gardenPlot ? [
                        'plot_code' => $plotRequest->gardenPlot->plot_code,
                        'location' => $plotRequest->gardenPlot->location,
                        'size' => (float) $plotRequest->gardenPlot->size,
                        'status' => $plotRequest->gardenPlot->status->value,
                    ] : null,
                ]);

            return Inertia::render('workspace-page', [
                'page' => 'plot-requests',
                'title' => 'My plot requests',
                'description' => 'Submit and track your requests for a community garden plot.',
                'plotRequests' => $plotRequests,
            ]);
        }

        $query = PlotRequest::with(['user:id,name,email', 'gardenPlot:id,plot_code,location'])->latest();
        if ($request->user()->role->value === 'member') {
            $query->where('user_id', $request->user()->id);
        }
        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(fn ($q) => $q->where('notes', 'like', "%{$search}%")->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"))->orWhereHas('gardenPlot', fn ($p) => $p->where('plot_code', 'like', "%{$search}%")));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return Inertia::render('plot-requests', [
            'requests' => $query->paginate(10)->withQueryString(),
            'availablePlots' => GardenPlot::where('status', 'available')->whereNull('archived_at')->orderBy('plot_code')->get(['id', 'plot_code', 'location']),
            'filters' => $request->only('search', 'status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->role->value === 'member', 403);
        $data = $request->validate(['garden_plot_id' => ['required', Rule::exists('garden_plots', 'id')->where(fn ($query) => $query->where('status', 'available')->whereNull('archived_at'))], 'notes' => ['nullable', 'string', 'max:1000']]);
        abort_if($request->user()->plotRequests()->where('status', 'pending')->where('garden_plot_id', $data['garden_plot_id'])->exists(), 422, 'You already have a pending request for this plot.');
        $this->createRequest($request, $data);

        return back()->with('success', 'Plot request submitted.');
    }

    public function storeApi(StorePlotRequest $request): JsonResponse
    {
        $plotRequest = $this->createRequest($request, $request->validated());
        $plotRequest->load('gardenPlot:id,plot_code,location');

        return response()->json([
            'message' => "Your request for plot {$plotRequest->gardenPlot->plot_code} was submitted.",
            'data' => [
                'id' => $plotRequest->id,
                'status' => $plotRequest->status->value,
                'plot' => [
                    'id' => $plotRequest->gardenPlot->id,
                    'plot_code' => $plotRequest->gardenPlot->plot_code,
                    'location' => $plotRequest->gardenPlot->location,
                ],
                'submitted_at' => $plotRequest->created_at->toIso8601String(),
            ],
        ], 201);
    }

    private function createRequest(Request $request, array $data): PlotRequest
    {
        $plotRequest = $request->user()->plotRequests()->create([...$data, 'status' => 'pending']);
        User::where('role', 'staff')->where('is_active', true)->get()
            ->each->notify(new GardenNotification("New plot request from {$request->user()->name}.", '/plot-requests'));

        return $plotRequest;
    }

    public function cancel(Request $request, PlotRequest $plotRequest): RedirectResponse
    {
        abort_unless($request->user()->id === $plotRequest->user_id && $plotRequest->status->value === 'pending', 403);
        $plotRequest->update(['status' => 'cancelled']);

        return back()->with('success', 'Request cancelled.');
    }

    public function approve(Request $request, PlotRequest $plotRequest): RedirectResponse
    {
        $this->requireStaff($request);
        $data = $request->validate(['start_date' => ['required', 'date'], 'end_date' => ['nullable', 'date', 'after_or_equal:start_date'], 'decision_notes' => ['nullable', 'string', 'max:1000']]);
        DB::transaction(function () use ($request, $plotRequest, $data) {
            $plotRequest = PlotRequest::lockForUpdate()->findOrFail($plotRequest->id);
            $plot = GardenPlot::lockForUpdate()->findOrFail($plotRequest->garden_plot_id);
            abort_unless($plotRequest->status->value === 'pending' && $plot->status->value === 'available', 422, 'This request or plot is no longer available.');
            abort_if(PlotAssignment::where('user_id', $plotRequest->user_id)->where('status', 'active')->exists(), 422, 'This member already has an active assignment.');
            PlotAssignment::create([...$data, 'user_id' => $plotRequest->user_id, 'garden_plot_id' => $plot->id, 'status' => 'active', 'assigned_by' => $request->user()->id]);
            $plotRequest->update(['status' => 'approved', 'reviewed_by' => $request->user()->id, 'reviewed_at' => now(), 'decision_notes' => $data['decision_notes'] ?? null]);
            $plot->update(['status' => 'occupied']);
            PlotRequest::where('garden_plot_id', $plot->id)->where('id', '!=', $plotRequest->id)->where('status', 'pending')->update(['status' => 'rejected', 'reviewed_by' => $request->user()->id, 'reviewed_at' => now(), 'decision_notes' => 'Another request was approved for this plot.']);
            $plotRequest->user->notify(new GardenNotification("Your request for plot {$plot->plot_code} was approved.", '/assignments'));
        });

        return back()->with('success', 'Request approved and assignment created.');
    }

    public function reject(Request $request, PlotRequest $plotRequest): RedirectResponse
    {
        $this->requireStaff($request);
        $data = $request->validate(['decision_notes' => ['required', 'string', 'max:1000']]);
        abort_unless($plotRequest->status->value === 'pending', 422);
        $plotRequest->update([...$data, 'status' => 'rejected', 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()]);
        $plotRequest->user->notify(new GardenNotification('Your plot request was not approved.', '/plot-requests'));

        return back()->with('success', 'Request rejected.');
    }
}
