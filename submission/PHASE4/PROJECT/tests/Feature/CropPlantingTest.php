<?php

namespace Tests\Feature;

use App\Enums\GardenPlotStatus;
use App\Enums\UserRole;
use App\Models\Crop;
use App\Models\GardenPlot;
use App\Models\PlotAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CropPlantingTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_add_and_edit_crops(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);

        $this->actingAs($staff)->post('/crops', ['name' => 'Tomato', 'type' => 'fruit'])->assertRedirect();
        $crop = Crop::firstOrFail();
        $this->actingAs($staff)->put("/crops/{$crop->id}", ['name' => 'Cherry tomato', 'type' => 'vegetable'])->assertRedirect();

        $this->assertDatabaseHas('crops', ['id' => $crop->id, 'name' => 'Cherry tomato', 'type' => 'vegetable']);
        $this->actingAs($staff)->get('/crops')->assertOk()->assertInertia(fn ($page) => $page->component('crops')->has('crops', 1));
    }

    public function test_only_staff_can_manage_crops(): void
    {
        foreach ([UserRole::Admin, UserRole::Member] as $role) {
            $user = User::factory()->create(['role' => $role]);
            $this->actingAs($user)->get('/crops')->assertForbidden();
            $this->actingAs($user)->post('/crops', ['name' => 'Tomato', 'type' => 'fruit'])->assertForbidden();
        }
    }

    public function test_grain_is_not_an_available_crop_type(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);

        $this->actingAs($staff)->post('/crops', ['name' => 'Wheat', 'type' => 'grain'])->assertSessionHasErrors('type');
        $this->assertDatabaseCount('crops', 0);
    }

    public function test_member_can_plant_on_their_active_assignment_and_view_it(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $crop = Crop::create(['name' => 'Tomato', 'type' => 'fruit']);
        $assignment = $this->assignment($member);

        $this->actingAs($member)->post("/assignments/{$assignment->id}/plantings", ['crop_id' => $crop->id, 'planted_at' => '2026-09-23'])->assertRedirect();

        $this->assertSame('2026-09-23', $assignment->plantings()->firstOrFail()->planted_at->toDateString());
        $this->assertDatabaseHas('plantings', ['plot_assignment_id' => $assignment->id, 'crop_id' => $crop->id]);
        $this->actingAs($member)->get('/assignments')->assertOk()->assertInertia(fn ($page) => $page->component('assignments')->has('assignments.data.0.plantings', 1)->where('assignments.data.0.plantings.0.crop.name', 'Tomato'));
    }

    public function test_member_cannot_plant_on_someone_elses_or_ended_assignment(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $otherMember = User::factory()->create(['role' => UserRole::Member]);
        $crop = Crop::create(['name' => 'Tomato', 'type' => 'fruit']);
        $otherAssignment = $this->assignment($otherMember);
        $ownAssignment = $this->assignment($member, 'A-02');

        $this->actingAs($member)->post("/assignments/{$otherAssignment->id}/plantings", ['crop_id' => $crop->id, 'planted_at' => '2026-09-23'])->assertForbidden();
        $ownAssignment->update(['status' => 'ended', 'end_date' => '2026-09-23']);
        $this->actingAs($member)->post("/assignments/{$ownAssignment->id}/plantings", ['crop_id' => $crop->id, 'planted_at' => '2026-09-23'])->assertUnprocessable();
        $this->assertDatabaseCount('plantings', 0);
    }

    public function test_filtered_assignment_history_keeps_the_members_current_plot_visible(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $otherMember = User::factory()->create(['role' => UserRole::Member]);
        $active = $this->assignment($member);
        $past = $this->assignment($member, 'A-02');
        $past->update(['status' => 'ended', 'end_date' => '2026-09-23']);
        $otherPast = $this->assignment($otherMember, 'B-01');
        $otherPast->update(['status' => 'ended', 'end_date' => '2026-09-23']);
        $this->assignment($otherMember, 'B-02');
        $crop = Crop::create(['name' => 'Tomato', 'type' => 'fruit']);
        $active->plantings()->create(['crop_id' => $crop->id, 'planted_at' => '2026-09-23']);

        $this->actingAs($member)
            ->get('/assignments?status=ended&search=North')
            ->assertInertia(fn ($page) => $page
                ->component('assignments')
                ->has('assignments.data', 1)
                ->where('assignments.data.0.id', $past->id)
                ->where('activeAssignment.id', $active->id)
                ->where('activeAssignment.garden_plot.size', fn ($size) => (float) $size === 12.0)
                ->has('activeAssignment.plantings', 1)
                ->where('activeAssignment.plantings.0.crop.name', 'Tomato')
                ->where('today', now()->toDateString()));

        $this->get('/assignments?search=South')
            ->assertInertia(fn ($page) => $page
                ->has('assignments.data', 0)
                ->where('activeAssignment.id', $active->id));
    }

    public function test_member_without_an_active_plot_does_not_receive_another_members_assignment(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $otherMember = User::factory()->create(['role' => UserRole::Member]);
        $this->assignment($otherMember);

        $this->actingAs($member)->get('/assignments')
            ->assertInertia(fn ($page) => $page
                ->where('activeAssignment', null)
                ->has('assignments.data', 0));
    }

    public function test_planting_dates_must_be_within_the_assignment_start_and_today(): void
    {
        $this->travelTo(now()->setDate(2026, 9, 28)->startOfDay());
        $member = User::factory()->create(['role' => UserRole::Member]);
        $assignment = $this->assignment($member);
        $crop = Crop::create(['name' => 'Basil', 'type' => 'herb']);

        foreach (['2026-08-31', '2026-09-29'] as $date) {
            $this->actingAs($member)
                ->post("/assignments/{$assignment->id}/plantings", ['crop_id' => $crop->id, 'planted_at' => $date])
                ->assertSessionHasErrors('planted_at');
        }

        $this->assertDatabaseCount('plantings', 0);
        $this->post("/assignments/{$assignment->id}/plantings", ['crop_id' => $crop->id, 'planted_at' => '2026-09-01'])
            ->assertSessionHasNoErrors()
            ->assertRedirect();
        $this->assertDatabaseCount('plantings', 1);
    }

    private function assignment(User $member, string $plotCode = 'A-01'): PlotAssignment
    {
        $plot = GardenPlot::create(['plot_code' => $plotCode, 'location' => 'North', 'size' => 12, 'status' => GardenPlotStatus::Occupied]);

        return PlotAssignment::create(['user_id' => $member->id, 'garden_plot_id' => $plot->id, 'start_date' => '2026-09-01', 'status' => 'active']);
    }
}
