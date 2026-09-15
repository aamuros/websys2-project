<?php

namespace Tests\Feature;

use App\Enums\GardenPlotStatus;
use App\Enums\PlotAssignmentStatus;
use App\Enums\PlotRequestStatus;
use App\Models\GardenPlot;
use App\Models\PlotAssignment;
use App\Models\PlotRequest;
use App\Models\User;
use Database\Seeders\DevelopmentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DatabaseFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_foundational_tables_and_relationships_are_available(): void
    {
        foreach (['users', 'sessions', 'garden_plots', 'plot_requests', 'plot_assignments'] as $table) {
            $this->assertTrue(Schema::hasTable($table));
        }

        $user = User::factory()->create();
        $plot = GardenPlot::create([
            'plot_code' => 'T-01',
            'location' => 'Test Bed',
            'size' => 10.5,
            'status' => GardenPlotStatus::Available,
        ]);
        $request = PlotRequest::create([
            'user_id' => $user->id,
            'garden_plot_id' => $plot->id,
            'status' => PlotRequestStatus::Pending,
        ]);
        $assignment = PlotAssignment::create([
            'user_id' => $user->id,
            'garden_plot_id' => $plot->id,
            'start_date' => '2026-09-15',
            'status' => PlotAssignmentStatus::Active,
        ]);

        $this->assertTrue($request->user->is($user));
        $this->assertTrue($request->gardenPlot->is($plot));
        $this->assertTrue($assignment->user->is($user));
        $this->assertTrue($assignment->gardenPlot->is($plot));
        $this->assertSame('10.50', $plot->size);
        $this->assertSame('2026-09-15', $assignment->start_date->toDateString());
    }

    public function test_development_seeder_is_repeatable(): void
    {
        $this->seed(DevelopmentSeeder::class);
        $this->seed(DevelopmentSeeder::class);

        $this->assertDatabaseCount('users', 3);
        $this->assertDatabaseCount('garden_plots', 5);
        $this->assertDatabaseHas('users', ['email' => 'admin@garden.test', 'role' => 'admin']);
    }
}
