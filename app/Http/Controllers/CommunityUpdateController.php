<?php

namespace App\Http\Controllers;

use App\Models\CommunityUpdate;
use App\Models\User;
use App\Notifications\GardenNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CommunityUpdateController extends Controller
{
    public function index(Request $request): Response
    {
        $query = CommunityUpdate::with('creator:id,name')->latest('published_at');
        if ($request->user()->role->value === 'member') {
            $query->where('status', 'published');
        }
        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(fn ($q) => $q->where('title', 'like', "%{$search}%")->orWhere('body', 'like', "%{$search}%"));
        }
        if ($request->filled('status') && $request->user()->role->value !== 'member') {
            $query->where('status', $request->string('status'));
        }

        return Inertia::render('community-updates', ['updates' => $query->paginate(8)->withQueryString(), 'filters' => $request->only('search', 'status')]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireOperations($request);
        $data = $this->validated($request);
        $communityUpdate = CommunityUpdate::create([...$data, 'created_by' => $request->user()->id, 'published_at' => $data['status'] === 'published' ? now() : null]);
        if ($data['status'] === 'published') {
            $this->notifyPublished($request, $communityUpdate);
        }

        return back()->with('success', 'Update created.');
    }

    public function update(Request $request, CommunityUpdate $communityUpdate): RedirectResponse
    {
        $this->requireOperations($request);
        $data = $this->validated($request);
        $publishing = $communityUpdate->status !== 'published' && $data['status'] === 'published';
        $communityUpdate->update([...$data, 'published_at' => $publishing ? now() : $communityUpdate->published_at]);
        if ($publishing) {
            $this->notifyPublished($request, $communityUpdate);
        }

        return back()->with('success', 'Update saved.');
    }

    public function publish(Request $request, CommunityUpdate $communityUpdate): RedirectResponse
    {
        $this->requireOperations($request);
        $communityUpdate->update(['status' => 'published', 'published_at' => now()]);
        $this->notifyPublished($request, $communityUpdate);

        return back()->with('success', 'Update published.');
    }

    public function archive(Request $request, CommunityUpdate $communityUpdate): RedirectResponse
    {
        $this->requireOperations($request);
        $communityUpdate->update(['status' => 'archived']);

        return back()->with('success', 'Update archived.');
    }

    private function validated(Request $request): array
    {
        return $request->validate(['title' => ['required', 'string', 'max:160'], 'body' => ['required', 'string', 'max:10000'], 'status' => ['required', Rule::in(['draft', 'published'])]]);
    }

    private function notifyPublished(Request $request, CommunityUpdate $communityUpdate): void
    {
        User::where('is_active', true)->whereKeyNot($request->user()->id)->get()->each->notify(new GardenNotification("Community update: {$communityUpdate->title}", '/community-updates'));
    }
}
