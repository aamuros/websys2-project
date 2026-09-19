<?php

namespace App\Http\Controllers;

use App\Enums\PlotRequestStatus;
use App\Models\GardenPlot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GardenPlotController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $pendingPlotIds = $request->user()
            ->plotRequests()
            ->where('status', PlotRequestStatus::Pending)
            ->whereNotNull('garden_plot_id')
            ->pluck('garden_plot_id')
            ->all();

        $pendingPlotLookup = array_fill_keys($pendingPlotIds, true);

        $plots = GardenPlot::query()
            ->orderBy('plot_code')
            ->get()
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
            'meta' => [
                'total' => $plots->count(),
                'generated_at' => now()->toIso8601String(),
            ],
        ]);
    }
}
