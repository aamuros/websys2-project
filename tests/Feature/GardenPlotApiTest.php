<?php

namespace Tests\Feature;

use App\Enums\GardenPlotStatus;
use App\Enums\PlotRequestStatus;
use App\Enums\UserRole;
use App\Models\GardenPlot;
use App\Models\PlotRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GardenPlotApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_users_can_fetch_garden_plots_as_json(): void
    {
        $user = User::factory()->create();
        $plot = GardenPlot::create([
            'plot_code' => 'A-01',
            'location' => 'North Garden',
            'size' => 12,
            'status' => GardenPlotStatus::Available,
        ]);
        PlotRequest::create([
            'user_id' => $user->id,
            'garden_plot_id' => $plot->id,
            'status' => PlotRequestStatus::Pending,
            'notes' => 'Vegetables for our family meals.',
        ]);

        $this->actingAs($user)
            ->getJson('/api/garden-plots')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.plot_code', 'A-01')
            ->assertJsonPath('data.0.status', 'available')
            ->assertJsonPath('data.0.has_pending_request', true);
    }

    public function test_a_member_can_submit_a_valid_plot_request(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $plot = GardenPlot::create([
            'plot_code' => 'B-02',
            'location' => 'Orchard Edge',
            'size' => 18.5,
            'status' => GardenPlotStatus::Available,
        ]);

        $this->actingAs($member)
            ->postJson('/api/plot-requests', [
                'garden_plot_id' => $plot->id,
                'notes' => 'I plan to grow herbs for the community kitchen.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.plot.plot_code', 'B-02');

        $this->assertDatabaseHas('plot_requests', [
            'user_id' => $member->id,
            'garden_plot_id' => $plot->id,
            'status' => PlotRequestStatus::Pending->value,
        ]);
    }

    public function test_plot_request_validation_rejects_unavailable_and_duplicate_requests(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $occupied = GardenPlot::create([
            'plot_code' => 'C-01',
            'location' => 'Greenhouse Row',
            'size' => 8.25,
            'status' => GardenPlotStatus::Occupied,
        ]);

        $this->actingAs($member)
            ->postJson('/api/plot-requests', [
                'garden_plot_id' => $occupied->id,
                'notes' => 'This note is long enough for validation.',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('garden_plot_id');

        $available = GardenPlot::create([
            'plot_code' => 'D-01',
            'location' => 'South Garden',
            'size' => 10,
            'status' => GardenPlotStatus::Available,
        ]);
        PlotRequest::create([
            'user_id' => $member->id,
            'garden_plot_id' => $available->id,
            'status' => PlotRequestStatus::Pending,
            'notes' => 'My original request for this plot.',
        ]);

        $this->actingAs($member)
            ->postJson('/api/plot-requests', [
                'garden_plot_id' => $available->id,
                'notes' => 'Trying to request the same plot twice.',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('garden_plot_id');
    }

    public function test_only_members_can_submit_plot_requests(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);

        $this->actingAs($staff)
            ->postJson('/api/plot-requests', [])
            ->assertForbidden();
    }
}
