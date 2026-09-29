<?php

namespace Database\Seeders;

use App\Enums\GardenPlotStatus;
use App\Enums\UserRole;
use App\Models\CalendarEvent;
use App\Models\CommunityUpdate;
use App\Models\Crop;
use App\Models\GardenPlot;
use App\Models\Planting;
use App\Models\PlotAssignment;
use App\Models\PlotRequest;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DevelopmentSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        DB::transaction(fn () => $this->seedDemoData());
    }

    private function seedDemoData(): void
    {
        $today = now()->startOfDay();
        $weekStart = $today->copy()->startOfWeek(CarbonInterface::SUNDAY);
        $accounts = [
            ['name' => 'Garden Administrator', 'email' => 'admin@garden.test', 'role' => UserRole::Admin],
            ['name' => 'Garden Staff', 'email' => 'staff@garden.test', 'role' => UserRole::Staff],
            ['name' => 'Garden Member', 'email' => 'member@garden.test', 'role' => UserRole::Member],
            ['name' => 'Rafael Cruz', 'email' => 'rafael@garden.test', 'role' => UserRole::Staff],
            ['name' => 'Liza Santos', 'email' => 'liza@garden.test', 'role' => UserRole::Member],
            ['name' => 'Marco Reyes', 'email' => 'marco@garden.test', 'role' => UserRole::Member],
            ['name' => 'Ana Garcia', 'email' => 'ana@garden.test', 'role' => UserRole::Member],
            ['name' => 'Paolo Mendoza', 'email' => 'paolo@garden.test', 'role' => UserRole::Member],
            ['name' => 'Rosalie Flores', 'email' => 'rosalie@garden.test', 'role' => UserRole::Member],
            ['name' => 'Eric Bautista', 'email' => 'eric@garden.test', 'role' => UserRole::Member, 'is_active' => false],
        ];

        $users = [];
        foreach ($accounts as $account) {
            $users[$account['email']] = User::firstOrCreate(
                ['email' => $account['email']],
                [...$account, 'password' => Hash::make('Garden123!')],
            );
        }

        $plots = [
            ['plot_code' => 'A-01', 'location' => 'North Garden', 'size' => 12.00, 'status' => GardenPlotStatus::Available],
            ['plot_code' => 'A-02', 'location' => 'North Garden', 'size' => 12.00, 'status' => GardenPlotStatus::Occupied],
            ['plot_code' => 'A-03', 'location' => 'North Garden', 'size' => 15.00, 'status' => GardenPlotStatus::Occupied],
            ['plot_code' => 'A-04', 'location' => 'North Garden', 'size' => 10.00, 'status' => GardenPlotStatus::Available],
            ['plot_code' => 'A-05', 'location' => 'North Garden', 'size' => 14.00, 'status' => GardenPlotStatus::Available],
            ['plot_code' => 'B-01', 'location' => 'Orchard Edge', 'size' => 18.50, 'status' => GardenPlotStatus::Reserved],
            ['plot_code' => 'B-02', 'location' => 'Orchard Edge', 'size' => 18.50, 'status' => GardenPlotStatus::Available],
            ['plot_code' => 'B-03', 'location' => 'Orchard Edge', 'size' => 20.00, 'status' => GardenPlotStatus::Occupied],
            ['plot_code' => 'B-04', 'location' => 'Orchard Edge', 'size' => 16.00, 'status' => GardenPlotStatus::Available],
            ['plot_code' => 'B-05', 'location' => 'Orchard Edge', 'size' => 11.00, 'status' => GardenPlotStatus::Maintenance, 'archived_at' => $today->copy()->subDays(14)],
            ['plot_code' => 'C-01', 'location' => 'Greenhouse Row', 'size' => 8.25, 'status' => GardenPlotStatus::Maintenance],
            ['plot_code' => 'C-02', 'location' => 'Greenhouse Row', 'size' => 9.50, 'status' => GardenPlotStatus::Occupied],
            ['plot_code' => 'C-03', 'location' => 'Greenhouse Row', 'size' => 8.25, 'status' => GardenPlotStatus::Available],
            ['plot_code' => 'C-04', 'location' => 'Greenhouse Row', 'size' => 10.50, 'status' => GardenPlotStatus::Available],
            ['plot_code' => 'C-05', 'location' => 'Greenhouse Row', 'size' => 12.00, 'status' => GardenPlotStatus::Reserved],
        ];

        $gardenPlots = [];
        foreach ($plots as $plot) {
            $gardenPlots[$plot['plot_code']] = GardenPlot::firstOrCreate(['plot_code' => $plot['plot_code']], $plot);
        }

        $staff = $users['staff@garden.test'];
        $admin = $users['admin@garden.test'];
        $requests = [
            ['member', 'A-01', 'pending', 'I would like to grow herbs and seasonal vegetables.', null],
            ['member', 'A-02', 'approved', 'A sunny bed for tomatoes, pechay, and basil.', 'Approved for the current growing season. Please keep the shared path clear.'],
            ['member', 'C-01', 'rejected', 'I would like to grow seedlings near the greenhouse.', 'This plot is undergoing irrigation repairs. Please choose an available plot.'],
            ['member', 'B-01', 'cancelled', 'Planning to start a small fruit and herb garden.', null],
            ['liza', 'A-03', 'approved', 'Leafy greens for our household and the community harvest.', 'Approved. Orientation is scheduled for the next work day.'],
            ['marco', 'B-03', 'approved', 'Growing tomatoes and eggplants along the orchard edge.', 'Approved for seasonal vegetable growing.'],
            ['ana', 'C-02', 'approved', 'A pollinator bed with flowers and culinary herbs.', 'Approved. Use the greenhouse watering schedule.'],
            ['paolo', 'B-02', 'pending', 'I can help with weekend watering and would like to grow vegetables.', null],
            ['rosalie', 'A-04', 'pending', 'I would like to grow pechay and lettuce with my family.', null],
            ['eric', 'C-04', 'rejected', 'Requesting a plot for herbs.', 'Garden access is currently suspended. Contact the garden team before reapplying.'],
        ];
        foreach ($requests as $index => [$account, $plotCode, $status, $notes, $decision]) {
            $daysAgo = $status === 'approved' ? ['A-02' => 32, 'A-03' => 26, 'B-03' => 20, 'C-02' => 16][$plotCode] : 12 - $index;
            $submittedAt = $today->copy()->subDays($daysAgo)->setTime(9 + $index % 5, 0);
            PlotRequest::firstOrCreate(
                ['user_id' => $users["{$account}@garden.test"]->id, 'garden_plot_id' => $gardenPlots[$plotCode]->id],
                [
                    'status' => $status, 'notes' => $notes, 'decision_notes' => $decision,
                    'reviewed_by' => $decision ? $staff->id : null,
                    'reviewed_at' => $decision ? $submittedAt->copy()->addDay() : null,
                    'created_at' => $submittedAt, 'updated_at' => $submittedAt,
                ],
            );
        }

        $assignments = [];
        foreach ([
            ['member', 'A-02', 'active', 30, null],
            ['liza', 'A-03', 'active', 24, 66],
            ['marco', 'B-03', 'active', 18, 72],
            ['ana', 'C-02', 'active', 14, 76],
            ['member', 'B-02', 'ended', 120, -60],
            ['member', 'C-03', 'cancelled', 55, -40],
        ] as [$account, $plotCode, $status, $daysAgo, $endDays]) {
            $assignments[$plotCode] = PlotAssignment::firstOrCreate(
                ['user_id' => $users["{$account}@garden.test"]->id, 'garden_plot_id' => $gardenPlots[$plotCode]->id],
                ['start_date' => $today->copy()->subDays($daysAgo), 'end_date' => $endDays === null ? null : $today->copy()->addDays($endDays), 'status' => $status, 'assigned_by' => $staff->id],
            );
        }

        $crops = [];
        foreach (['Tomato' => 'fruit', 'Eggplant' => 'vegetable', 'Pechay' => 'vegetable', 'Lettuce' => 'vegetable', 'Basil' => 'herb', 'Mint' => 'herb', 'Marigold' => 'flower', 'Sunflower' => 'flower'] as $name => $type) {
            $crops[$name] = Crop::firstOrCreate(['name' => $name], ['type' => $type]);
        }
        foreach ([
            ['A-02', 'Tomato', 2], ['A-02', 'Pechay', 8], ['A-02', 'Basil', 12],
            ['A-03', 'Lettuce', 2], ['A-03', 'Pechay', 6],
            ['B-03', 'Tomato', 1], ['B-03', 'Eggplant', 3],
            ['C-02', 'Marigold', 1], ['C-02', 'Mint', 4],
            ['B-02', 'Sunflower', 7],
        ] as [$plotCode, $cropName, $daysAfterStart]) {
            $assignment = $assignments[$plotCode];
            Planting::firstOrCreate(
                ['plot_assignment_id' => $assignment->id, 'crop_id' => $crops[$cropName]->id],
                ['planted_at' => $assignment->start_date->copy()->addDays($daysAfterStart)],
            );
        }

        foreach ([
            ['Seedling swap', 'Bring extra seedlings and exchange growing tips with other members.', 'Greenhouse Row', 0, 9, 11, 'published'],
            ['Shared watering round', 'Check soil moisture and water the shared beds together.', 'North Garden', 1, 8, 9, 'published'],
            ['Composting workshop', 'Learn how to balance greens and browns in the community compost bins.', 'Compost station', 3, 14, 16, 'published'],
            ['Herb garden care', 'Prune basil and mint, check seedlings, and refresh mulch.', 'Greenhouse Row', 4, 9, 11, 'published'],
            ['Community harvest', 'Pick mature vegetables and prepare the shared harvest table.', 'Orchard Edge', 5, 8, 10, 'published'],
            ['Community garden work day', 'Help tidy shared paths, prepare compost beds, and meet new members.', 'Main tool shed', 6, 8, 11, 'published'],
            ['New member orientation', 'Tour the garden, learn the watering schedule, and meet the garden staff.', 'Main entrance', 9, 10, 12, 'published'],
            ['Irrigation planning session', 'Staff planning session for upcoming greenhouse repairs.', 'Main tool shed', 8, 13, 15, 'draft'],
            ['Previous season cleanup', 'The completed end-of-season cleanup and tool inventory.', 'North Garden', -7, 8, 10, 'archived'],
        ] as [$title, $description, $location, $day, $startHour, $endHour, $status]) {
            CalendarEvent::firstOrCreate(
                ['title' => $title, 'created_by' => $staff->id],
                [
                    'description' => $description, 'location' => $location,
                    'starts_at' => $weekStart->copy()->addDays($day)->setTime($startHour, 0),
                    'ends_at' => $weekStart->copy()->addDays($day)->setTime($endHour, 0),
                    'status' => $status, 'published_at' => $status === 'draft' ? null : $today->copy()->subDays(7),
                ],
            );
        }

        foreach ([
            ['Welcome to the new garden workspace', 'Plot requests, assignments, events, and garden announcements are now available in one place.', 'published', 6],
            ['This week in the garden', 'Join the composting workshop and community harvest this week. Check the garden calendar for times and meeting points. Bring gloves, a hat, and drinking water.', 'published', 0],
            ['Shared watering schedule', 'North Garden watering is scheduled for early mornings. Please return hoses to the tool shed and report leaks to the garden staff.', 'published', 1],
            ['Seedlings available for members', 'Pechay, basil, and marigold seedlings are ready at Greenhouse Row. Members may collect a small tray during staffed garden hours.', 'published', 3],
            ['Next season planning', 'Draft announcement: gather member preferences for the next planting season before opening plot renewals.', 'draft', 0],
            ['Previous harvest day recap', 'Thank you to everyone who helped share the last harvest with our community. The harvest table is now closed for that event.', 'archived', 21],
        ] as [$title, $body, $status, $daysAgo]) {
            CommunityUpdate::firstOrCreate(
                ['title' => $title, 'created_by' => $admin->id],
                ['body' => $body, 'status' => $status, 'published_at' => $status === 'draft' ? null : $today->copy()->subDays($daysAgo)->setTime(7, 0)],
            );
        }
    }
}
