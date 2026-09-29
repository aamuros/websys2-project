<?php

namespace Tests\Feature;

use App\Enums\GardenPlotStatus;
use App\Enums\UserRole;
use App\Models\Crop;
use App\Models\GardenPlot;
use App\Models\PlotAssignment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CropCycleForecastTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_member_receives_estimate_for_only_their_own_plantings(): void
    {
        Carbon::setTestNow('2026-09-24 12:00:00');
        $member = User::factory()->create(['role' => UserRole::Member]);
        $other = User::factory()->create(['role' => UserRole::Member]);
        $crop = $this->crop(['maturity_days_min' => 60, 'maturity_days_max' => 75, 'maturity_source' => 'Seed packet']);
        $ownAssignment = $this->assignment($member, 'A-01');
        $otherAssignment = $this->assignment($other, 'A-02');
        $ownPlanting = $ownAssignment->plantings()->create(['crop_id' => $crop->id, 'planted_at' => '2026-09-10']);
        $otherAssignment->plantings()->create(['crop_id' => $crop->id, 'planted_at' => '2026-09-10']);

        $this->actingAs($member)->getJson('/api/garden-calendar/forecasts?from=2026-11-01&to=2026-11-30')
            ->assertOk()
            ->assertJsonPath('data.0.id', 'planting:'.$ownPlanting->id)
            ->assertJsonPath('data.0.harvest_start_earliest', '2026-11-09')
            ->assertJsonPath('data.0.harvest_start_latest', '2026-11-24')
            ->assertJsonPath('data.0.status', 'upcoming')
            ->assertJsonPath('data.0.basis_note', 'Seed packet')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.timezone', 'Asia/Manila');
    }

    public function test_staff_receives_active_non_archived_garden_forecasts(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $member = User::factory()->create();
        $crop = $this->crop(['maturity_days_min' => 10, 'maturity_days_max' => 10]);
        $active = $this->assignment($member, 'A-01');
        $active->plantings()->create(['crop_id' => $crop->id, 'planted_at' => '2026-09-20']);
        $ended = $this->assignment($member, 'A-02');
        $ended->update(['status' => 'ended', 'end_date' => '2026-09-23']);
        $ended->plantings()->create(['crop_id' => $crop->id, 'planted_at' => '2026-09-20']);

        $this->actingAs($staff)->getJson('/api/garden-calendar/forecasts?from=2026-09-01&to=2026-12-31')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_staff_can_open_forecast_calendar_and_return_to_event_management(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);

        $this->actingAs($staff)->get('/garden-calendar?view=forecasts')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('workspace-page')
                ->where('page', 'garden-calendar')
                ->where('manageEventsHref', '/garden-calendar'));

        $this->actingAs($staff)->get('/garden-calendar')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('garden-calendar'));
    }

    public function test_unconfigured_crop_is_omitted_and_calendar_range_overlap_is_inclusive(): void
    {
        $member = User::factory()->create();
        $configured = $this->crop(['maturity_days_min' => 10, 'maturity_days_max' => 20, 'harvest_window_days' => 5]);
        $unconfigured = $this->crop(['name' => 'Unconfigured', 'maturity_days_min' => null, 'maturity_days_max' => null]);
        $assignment = $this->assignment($member);
        $planting = $assignment->plantings()->create(['crop_id' => $configured->id, 'planted_at' => '2026-09-01']);
        $assignment->plantings()->create(['crop_id' => $unconfigured->id, 'planted_at' => '2026-09-01']);

        $this->actingAs($member)->getJson('/api/garden-calendar/forecasts?from=2026-09-21&to=2026-09-21')
            ->assertOk()
            ->assertJsonPath('data.0.id', 'planting:'.$planting->id)
            ->assertJsonPath('data.0.harvest_start_earliest', '2026-09-11')
            ->assertJsonPath('data.0.harvest_start_latest', '2026-09-21')
            ->assertJsonPath('data.0.harvest_window_end', '2026-09-26')
            ->assertJsonPath('data.0.status', 'in_window')
            ->assertJsonCount(1, 'data');
    }

    public function test_forecast_handles_leap_day_and_marks_a_past_window(): void
    {
        Carbon::setTestNow('2026-09-24 12:00:00');
        $member = User::factory()->create();
        $crop = $this->crop(['maturity_days_min' => 60, 'maturity_days_max' => 60]);
        $assignment = $this->assignment($member);
        $assignment->plantings()->create(['crop_id' => $crop->id, 'planted_at' => '2023-12-31']);
        $this->actingAs($member)->getJson('/api/garden-calendar/forecasts?from=2024-02-29&to=2024-02-29')
            ->assertOk()
            ->assertJsonPath('data.0.harvest_start_earliest', '2024-02-29')
            ->assertJsonPath('data.0.harvest_start_latest', '2024-02-29')
            ->assertJsonPath('data.0.status', 'window_passed');
    }

    public function test_api_rejects_invalid_or_overlong_date_ranges(): void
    {
        $member = User::factory()->create();

        $this->actingAs($member)->getJson('/api/garden-calendar/forecasts?from=bad&to=2026-09-30')->assertUnprocessable();
        $this->actingAs($member)->getJson('/api/garden-calendar/forecasts?from=2026-01-01&to=2027-01-03')->assertUnprocessable();
        $this->actingAs($member)->getJson('/api/garden-calendar/forecasts?from=2026-10-01&to=2026-09-30')->assertUnprocessable();
    }

    public function test_staff_crop_validation_requires_a_valid_complete_maturity_range(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $payload = ['name' => 'Tomato', 'type' => 'vegetable'];

        $this->actingAs($staff)->post('/crops', $payload + ['maturity_days_min' => 40])->assertSessionHasErrors('maturity_days_max');
        $this->actingAs($staff)->post('/crops', $payload + ['maturity_days_min' => 80, 'maturity_days_max' => 40])->assertSessionHasErrors('maturity_days_max');
        $this->actingAs($staff)->post('/crops', $payload + ['maturity_days_min' => 40, 'maturity_days_max' => 75])->assertRedirect();
        $this->assertDatabaseHas('crops', ['name' => 'Tomato', 'maturity_days_min' => 40, 'maturity_days_max' => 75]);
    }

    private function crop(array $overrides = []): Crop
    {
        static $sequence = 0;
        $sequence++;

        return Crop::create($overrides + [
            'name' => 'Crop '.$sequence,
            'type' => 'vegetable',
            'maturity_days_min' => null,
            'maturity_days_max' => null,
        ]);
    }

    private function assignment(User $member, string $plotCode = 'A-01'): PlotAssignment
    {
        $plot = GardenPlot::create(['plot_code' => $plotCode, 'location' => 'North', 'size' => 12, 'status' => GardenPlotStatus::Occupied]);

        return PlotAssignment::create(['user_id' => $member->id, 'garden_plot_id' => $plot->id, 'start_date' => '2026-09-01', 'status' => 'active']);
    }
}
