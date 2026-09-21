<?php

namespace Database\Seeders;

use App\Enums\GardenPlotStatus;
use App\Enums\UserRole;
use App\Models\CalendarEvent;
use App\Models\CommunityUpdate;
use App\Models\GardenPlot;
use App\Models\PlotAssignment;
use App\Models\PlotRequest;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DevelopmentSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            ['name' => 'Garden Administrator', 'email' => 'admin@garden.test', 'role' => UserRole::Admin],
            ['name' => 'Garden Staff', 'email' => 'staff@garden.test', 'role' => UserRole::Staff],
            ['name' => 'Garden Member', 'email' => 'member@garden.test', 'role' => UserRole::Member],
        ];

        foreach ($accounts as $account) {
            User::updateOrCreate(
                ['email' => $account['email']],
                [...$account, 'password' => Hash::make('Garden123!')],
            );
        }

        $plots = [
            ['plot_code' => 'A-01', 'location' => 'North Garden', 'size' => 12.00, 'status' => GardenPlotStatus::Available],
            ['plot_code' => 'A-02', 'location' => 'North Garden', 'size' => 12.00, 'status' => GardenPlotStatus::Occupied],
            ['plot_code' => 'B-01', 'location' => 'Orchard Edge', 'size' => 18.50, 'status' => GardenPlotStatus::Reserved],
            ['plot_code' => 'B-02', 'location' => 'Orchard Edge', 'size' => 18.50, 'status' => GardenPlotStatus::Available],
            ['plot_code' => 'C-01', 'location' => 'Greenhouse Row', 'size' => 8.25, 'status' => GardenPlotStatus::Maintenance],
        ];

        foreach ($plots as $plot) {
            GardenPlot::updateOrCreate(['plot_code' => $plot['plot_code']], $plot);
        }

        $member = User::where('email', 'member@garden.test')->firstOrFail();
        $admin = User::where('email', 'admin@garden.test')->firstOrFail();
        $staff = User::where('email', 'staff@garden.test')->firstOrFail();
        $requestedPlot = GardenPlot::where('plot_code', 'A-01')->firstOrFail();
        $assignedPlot = GardenPlot::where('plot_code', 'A-02')->firstOrFail();

        PlotRequest::updateOrCreate(
            ['user_id' => $member->id, 'garden_plot_id' => $requestedPlot->id],
            ['status' => 'pending', 'notes' => 'I would like to grow herbs and seasonal vegetables.'],
        );
        PlotAssignment::updateOrCreate(
            ['user_id' => $member->id, 'garden_plot_id' => $assignedPlot->id],
            ['start_date' => '2026-09-01', 'end_date' => null, 'status' => 'active', 'assigned_by' => $staff->id],
        );
        CalendarEvent::updateOrCreate(
            ['title' => 'September community work day'],
            ['description' => 'Help tidy shared paths and prepare compost beds.', 'location' => 'Main tool shed', 'starts_at' => '2026-09-26 08:00:00', 'ends_at' => '2026-09-26 11:00:00', 'status' => 'published', 'created_by' => $staff->id, 'published_at' => now()],
        );
        CommunityUpdate::updateOrCreate(
            ['title' => 'Welcome to the new garden workspace'],
            ['body' => 'Plot requests, assignments, events, and garden announcements are now available in one place.', 'status' => 'published', 'created_by' => $admin->id, 'published_at' => now()],
        );
    }
}
