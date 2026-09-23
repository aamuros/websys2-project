<?php

namespace App\Http\Controllers;

use App\Models\GardenPlot;
use App\Models\PlotAssignment;
use App\Models\PlotRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        [$from, $to] = $this->range($request);

        return Inertia::render('reports', [
            'filters' => ['from' => $from, 'to' => $to],
            'metrics' => [
                'totalPlots' => GardenPlot::whereNull('archived_at')->count(), 'occupiedPlots' => GardenPlot::whereNull('archived_at')->where('status', 'occupied')->count(),
                'pendingRequests' => PlotRequest::where('status', 'pending')->count(), 'activeAssignments' => PlotAssignment::where('status', 'active')->count(),
                'activeMembers' => User::where('role', 'member')->where('is_active', true)->count(),
            ],
            'requestBreakdown' => PlotRequest::whereBetween('created_at', [$from, $to.' 23:59:59'])->selectRaw('status, count(*) as total')->groupBy('status')->get(),
            'assignmentBreakdown' => PlotAssignment::whereBetween('created_at', [$from, $to.' 23:59:59'])->selectRaw('status, count(*) as total')->groupBy('status')->get(),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $this->requireAdmin($request);
        [$from, $to] = $this->range($request);

        return response()->streamDownload(function () use ($from, $to) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Request ID', 'Member', 'Plot', 'Status', 'Submitted']);
            PlotRequest::with(['user', 'gardenPlot'])->whereBetween('created_at', [$from, $to.' 23:59:59'])->orderBy('id')->each(fn ($item) => fputcsv($out, [$item->id, $item->user->name, $item->gardenPlot?->plot_code, $item->status->value, $item->created_at->toDateString()]));
            fputcsv($out, []);
            fputcsv($out, ['Assignment ID', 'Member', 'Plot', 'Status', 'Start date', 'End date']);
            PlotAssignment::with(['user', 'gardenPlot'])->whereBetween('created_at', [$from, $to.' 23:59:59'])->orderBy('id')->each(fn ($item) => fputcsv($out, [$item->id, $item->user->name, $item->gardenPlot->plot_code, $item->status->value, $item->start_date->toDateString(), $item->end_date?->toDateString()]));
            fclose($out);
        }, "garden-report-{$from}-{$to}.csv", ['Content-Type' => 'text/csv']);
    }

    private function range(Request $request): array
    {
        $data = $request->validate(['from' => ['nullable', 'date'], 'to' => ['nullable', 'date', 'after_or_equal:from']]);

        return [$data['from'] ?? now()->subDays(29)->toDateString(), $data['to'] ?? now()->toDateString()];
    }
}
