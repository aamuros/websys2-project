<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user()?->only('id', 'name', 'email', 'role'),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'notifications' => fn () => $request->user() ? [
                'unreadCount' => $request->user()->unreadNotifications()->count(),
                'items' => $request->user()->notifications()->latest()->limit(8)->get()->map(fn ($item) => [
                    'id' => $item->id, 'message' => $item->data['message'] ?? 'Notification',
                    'url' => $item->data['url'] ?? '/dashboard', 'read' => $item->read_at !== null,
                    'created_at' => $item->created_at?->diffForHumans(),
                ]),
            ] : ['unreadCount' => 0, 'items' => []],
        ];
    }
}
