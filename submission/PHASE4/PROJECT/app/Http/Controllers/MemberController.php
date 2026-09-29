<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Notifications\GardenNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MemberController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $query = User::withCount(['plotRequests', 'plotAssignments'])->where('role', '!=', 'admin')->orderBy('name');
        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
        }
        if ($request->filled('role')) {
            $query->where('role', $request->string('role'));
        }
        if ($request->filled('status')) {
            $query->where('is_active', $request->string('status')->toString() === 'active');
        }

        return Inertia::render('members', ['members' => $query->paginate(12)->withQueryString(), 'filters' => $request->only('search', 'role', 'status')]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->requireAdmin($request);
        abort_if($user->role->value === 'admin', 403);
        $data = $request->validate(['role' => ['required', Rule::in(['member', 'staff'])], 'is_active' => ['required', 'boolean']]);
        $user->update($data);
        $user->notify(new GardenNotification('Your account access was updated by an administrator.', '/settings'));

        return back()->with('success', 'Member access updated.');
    }
}
