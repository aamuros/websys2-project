<?php

namespace Database\Seeders;

use App\Enums\GardenPlotStatus;
use App\Enums\UserRole;
use App\Models\GardenPlot;
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
    }
}
