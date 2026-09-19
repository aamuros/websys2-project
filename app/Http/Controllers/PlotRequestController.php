<?php

namespace App\Http\Controllers;

use App\Enums\PlotRequestStatus;
use App\Http\Requests\StorePlotRequest;
use Illuminate\Http\JsonResponse;

class PlotRequestController extends Controller
{
    public function store(StorePlotRequest $request): JsonResponse
    {
        $plotRequest = $request->user()->plotRequests()->create([
            'garden_plot_id' => $request->integer('garden_plot_id'),
            'status' => PlotRequestStatus::Pending,
            'notes' => $request->string('notes')->trim()->toString(),
        ]);

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
}
