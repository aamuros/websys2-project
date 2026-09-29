<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\CommunityUpdate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunityUpdatesTest extends TestCase
{
    use RefreshDatabase;

    public function test_members_receive_only_published_updates_with_the_full_content(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $body = "Garden maintenance starts next week.\n\n".str_repeat('Please keep the paths clear. ', 40);
        $published = $this->update($staff, 'Maintenance notice', 'published', $body);
        $this->update($staff, 'Private draft', 'draft');
        $this->update($staff, 'Archived notice', 'archived');

        $this->actingAs($member)->get('/community-updates?status=draft')
            ->assertInertia(fn ($page) => $page
                ->component('community-updates')
                ->has('updates.data', 1)
                ->where('updates.data.0.id', $published->id)
                ->where('updates.data.0.body', $body)
                ->where('updates.data.0.creator.name', $staff->name)
                ->where('filters.sort', 'newest'));
    }

    public function test_members_can_search_update_titles_and_content(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $this->update($staff, 'Compost delivery', 'published');
        $this->update($staff, 'Garden reminder', 'published', 'Collect compost from the north gate.');
        $this->update($staff, 'Compost draft', 'draft');
        $this->update($staff, 'Watering schedule', 'published');

        $this->actingAs($member)->get('/community-updates?search=compost')
            ->assertInertia(fn ($page) => $page
                ->has('updates.data', 2)
                ->where('updates.total', 2)
                ->where('filters.search', 'compost'));

        $this->get('/community-updates?search=no-match')
            ->assertInertia(fn ($page) => $page
                ->has('updates.data', 0)
                ->where('updates.total', 0));
    }

    public function test_date_sorting_is_stable_and_pagination_preserves_search_and_sort(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $updates = [];
        for ($index = 1; $index <= 10; $index++) {
            $updates[] = $this->update($staff, "Garden notice {$index}", 'published');
        }

        $this->actingAs($member)->get('/community-updates')
            ->assertInertia(fn ($page) => $page
                ->has('updates.data', 8)
                ->where('updates.data.0.id', $updates[9]->id)
                ->where('updates.data.7.id', $updates[2]->id));

        $this->get('/community-updates?search=Garden&sort=oldest')
            ->assertInertia(fn ($page) => $page
                ->where('filters.sort', 'oldest')
                ->where('updates.data.0.id', $updates[0]->id)
                ->where('updates.data.7.id', $updates[7]->id)
                ->where('updates.next_page_url', fn ($url) => str_contains($url, 'sort=oldest') && str_contains($url, 'search=Garden') && str_contains($url, 'page=2')));

        $this->get('/community-updates?search=Garden&sort=oldest&page=2')
            ->assertInertia(fn ($page) => $page
                ->has('updates.data', 2)
                ->where('updates.data.0.id', $updates[8]->id)
                ->where('updates.data.1.id', $updates[9]->id));
    }

    public function test_staff_and_admin_share_the_update_management_workflow_and_filters(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);

        foreach ([UserRole::Staff, UserRole::Admin] as $role) {
            $manager = User::factory()->create(['role' => $role]);
            $title = "Garden notice from {$role->value}";
            $this->actingAs($manager)->post('/community-updates', [
                'title' => $title, 'body' => 'Draft garden news.', 'status' => 'draft',
            ])->assertSessionHasNoErrors()->assertRedirect();
            $update = CommunityUpdate::where('created_by', $manager->id)->firstOrFail();

            $this->get('/community-updates?status=draft&sort=oldest&search=Garden')
                ->assertInertia(fn ($page) => $page
                    ->component('community-updates')
                    ->has('updates.data', 1)
                    ->where('updates.data.0.id', $update->id)
                    ->where('updates.data.0.creator.name', $manager->name)
                    ->where('filters.status', 'draft')
                    ->where('filters.sort', 'oldest')
                    ->where('filters.search', 'Garden'));

            $this->put("/community-updates/{$update->id}", [
                'title' => $title, 'body' => 'Full garden news for everyone.', 'status' => 'draft',
            ])->assertSessionHasNoErrors()->assertRedirect();
            $this->post("/community-updates/{$update->id}/publish")->assertRedirect();
            $this->assertDatabaseHas('community_updates', ['id' => $update->id, 'status' => 'published']);

            $this->actingAs($member)->get('/community-updates?sort=oldest&search=Garden')
                ->assertInertia(fn ($page) => $page
                    ->component('community-updates')
                    ->has('updates.data', 1)
                    ->where('updates.data.0.id', $update->id)
                    ->where('updates.data.0.body', 'Full garden news for everyone.')
                    ->where('filters.sort', 'oldest')
                    ->where('filters.search', 'Garden'));

            $this->actingAs($manager)->post("/community-updates/{$update->id}/archive")->assertRedirect();
            $this->get('/community-updates?status=archived&search='.$role->value)
                ->assertInertia(fn ($page) => $page
                    ->has('updates.data', 1)
                    ->where('updates.data.0.id', $update->id)
                    ->where('updates.data.0.status', 'archived'));
            $this->actingAs($member)->get('/community-updates')
                ->assertInertia(fn ($page) => $page->has('updates.data', 0));
        }
    }

    public function test_members_cannot_use_update_management_actions(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $update = $this->update($staff, 'Garden notice', 'draft');
        $payload = ['title' => 'Changed title', 'body' => 'Changed content.', 'status' => 'published'];

        $this->actingAs($member)->post('/community-updates', $payload)->assertForbidden();
        $this->put("/community-updates/{$update->id}", $payload)->assertForbidden();
        $this->post("/community-updates/{$update->id}/publish")->assertForbidden();
        $this->post("/community-updates/{$update->id}/archive")->assertForbidden();
        $this->assertDatabaseCount('community_updates', 1);
        $this->assertDatabaseHas('community_updates', ['id' => $update->id, 'title' => 'Garden notice', 'status' => 'draft']);
    }

    private function update(User $author, string $title, string $status, string $body = 'News from the garden team.'): CommunityUpdate
    {
        return CommunityUpdate::create([
            'title' => $title,
            'body' => $body,
            'status' => $status,
            'created_by' => $author->id,
            'published_at' => $status === 'draft' ? null : '2026-09-01 09:00:00',
        ]);
    }
}
