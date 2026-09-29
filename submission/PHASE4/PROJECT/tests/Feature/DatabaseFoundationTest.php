<?php

namespace Tests\Feature;

use App\Enums\GardenPlotStatus;
use App\Enums\PlotAssignmentStatus;
use App\Enums\PlotRequestStatus;
use App\Models\CalendarEvent;
use App\Models\CommunityUpdate;
use App\Models\Crop;
use App\Models\GardenPlot;
use App\Models\Planting;
use App\Models\PlotAssignment;
use App\Models\PlotRequest;
use App\Models\User;
use Carbon\CarbonInterface;
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
        $member = User::where('email', 'member@garden.test')->firstOrFail();
        $password = $member->password;
        $member->update(['name' => 'Updated member name']);
        $plot = GardenPlot::where('plot_code', 'A-01')->firstOrFail();
        $plot->update(['status' => GardenPlotStatus::Reserved]);
        $request = PlotRequest::where('user_id', $member->id)->where('garden_plot_id', $plot->id)->firstOrFail();
        $request->update(['notes' => 'Updated growing plan']);

        $this->seed(DevelopmentSeeder::class);

        $this->assertDatabaseCount('users', 10);
        $this->assertDatabaseCount('garden_plots', 15);
        $this->assertDatabaseCount('plot_requests', 10);
        $this->assertDatabaseCount('plot_assignments', 6);
        $this->assertDatabaseCount('crops', 8);
        $this->assertDatabaseCount('plantings', 10);
        $this->assertDatabaseCount('calendar_events', 9);
        $this->assertDatabaseCount('community_updates', 6);
        $this->assertDatabaseHas('users', ['email' => 'admin@garden.test', 'role' => 'admin']);
        $this->assertSame('Updated member name', $member->fresh()->name);
        $this->assertSame($password, $member->fresh()->password);
        $this->assertSame(GardenPlotStatus::Reserved, $plot->fresh()->status);
        $this->assertSame('Updated growing plan', $request->fresh()->notes);
    }

    public function test_demo_data_populates_current_calendar_and_member_history(): void
    {
        $this->seed(DevelopmentSeeder::class);
        $weekStart = now()->startOfWeek(CarbonInterface::SUNDAY);

        $this->assertSame(6, CalendarEvent::where('status', 'published')->whereBetween('starts_at', [$weekStart, $weekStart->copy()->addDays(6)->endOfDay()])->count());
        $this->assertTrue(CalendarEvent::where('status', 'published')->where('starts_at', '>', now())->exists());
        $this->assertSame(4, CommunityUpdate::where('status', 'published')->count());
        $this->assertSame(4, Crop::distinct()->count('type'));

        $member = User::where('email', 'member@garden.test')->firstOrFail();
        $this->assertEqualsCanonicalizing(PlotRequestStatus::cases(), $member->plotRequests()->pluck('status')->all());
        $this->assertEqualsCanonicalizing(PlotAssignmentStatus::cases(), $member->plotAssignments()->pluck('status')->all());
        $activeAssignment = $member->plotAssignments()->where('status', 'active')->firstOrFail();
        $this->assertSame(3, $activeAssignment->plantings()->count());
        foreach (Planting::with('assignment')->get() as $planting) {
            $this->assertTrue($planting->planted_at->greaterThanOrEqualTo($planting->assignment->start_date));
            $this->assertTrue($planting->planted_at->lessThanOrEqualTo(now()));
            if ($planting->assignment->end_date) {
                $this->assertTrue($planting->planted_at->lessThanOrEqualTo($planting->assignment->end_date));
            }
        }
    }
}
