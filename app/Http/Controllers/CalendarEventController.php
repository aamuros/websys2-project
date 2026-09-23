<?php

namespace App\Http\Controllers;

use App\Models\CalendarEvent;
use App\Models\User;
use App\Notifications\GardenNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CalendarEventController extends Controller
{
    public function index(Request $request): Response
    {
        if ($request->user()->role->value === 'member') {
            return Inertia::render('workspace-page', [
                'page' => 'garden-calendar',
                'title' => 'Garden calendar',
                'description' => 'View upcoming events, maintenance, and shared work days.',
                'calendarEvents' => CalendarEvent::where('status', 'published')
                    ->orderBy('starts_at')
                    ->get(['id', 'title', 'description', 'location', 'starts_at', 'ends_at']),
            ]);
        }

        $query = CalendarEvent::with('creator:id,name')->orderBy('starts_at');
        if ($request->user()->role->value === 'member') {
            $query->where('status', 'published');
        }
        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(fn ($q) => $q->where('title', 'like', "%{$search}%")->orWhere('location', 'like', "%{$search}%"));
        }
        if ($request->filled('status') && $request->user()->role->value !== 'member') {
            $query->where('status', $request->string('status'));
        }

        return Inertia::render('garden-calendar', ['events' => $query->paginate(10)->withQueryString(), 'filters' => $request->only('search', 'status')]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireOperations($request);
        $data = $this->validated($request);
        $event = CalendarEvent::create([...$data, 'created_by' => $request->user()->id, 'published_at' => $data['status'] === 'published' ? now() : null]);
        if ($data['status'] === 'published') {
            $this->notifyPublished($request, $event);
        }

        return back()->with('success', 'Event created.');
    }

    public function update(Request $request, CalendarEvent $event): RedirectResponse
    {
        $this->requireOperations($request);
        $data = $this->validated($request);
        $publishing = $event->status !== 'published' && $data['status'] === 'published';
        $event->update([...$data, 'published_at' => $publishing ? now() : $event->published_at]);
        if ($publishing) {
            $this->notifyPublished($request, $event);
        }

        return back()->with('success', 'Event updated.');
    }

    public function publish(Request $request, CalendarEvent $event): RedirectResponse
    {
        $this->requireOperations($request);
        $event->update(['status' => 'published', 'published_at' => now()]);
        $this->notifyPublished($request, $event);

        return back()->with('success', 'Event published.');
    }

    public function archive(Request $request, CalendarEvent $event): RedirectResponse
    {
        $this->requireOperations($request);
        $event->update(['status' => 'archived']);

        return back()->with('success', 'Event archived.');
    }

    private function validated(Request $request): array
    {
        return $request->validate(['title' => ['required', 'string', 'max:160'], 'description' => ['nullable', 'string', 'max:3000'], 'location' => ['nullable', 'string', 'max:160'], 'starts_at' => ['required', 'date'], 'ends_at' => ['required', 'date', 'after:starts_at'], 'status' => ['required', Rule::in(['draft', 'published'])]]);
    }

    private function notifyPublished(Request $request, CalendarEvent $event): void
    {
        User::where('is_active', true)->whereKeyNot($request->user()->id)->get()->each->notify(new GardenNotification("New garden event: {$event->title}", '/garden-calendar'));
    }
}
