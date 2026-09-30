<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Notifications\GardenNotification;
use App\Services\AccountSessionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
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

    public function update(Request $request, User $user, AccountSessionService $sessions): RedirectResponse
    {
        $this->requireAdmin($request);
        abort_if($user->role->value === 'admin', 403);
        $data = $request->validate(['role' => ['required', Rule::in(['member', 'staff'])], 'is_active' => ['required', 'boolean']]);
        if ($data['role'] !== $user->role->value && $user->plotAssignments()->where('status', 'active')->exists()) {
            throw ValidationException::withMessages(['role' => 'Close this member’s active plot assignment before changing their role.']);
        }
        $user->update($data);
        $user->forceFill(['remember_token' => Str::random(60)])->save();
        $sessions->invalidate($user);
        $user->notify(new GardenNotification('Your account access was updated by an administrator.', '/settings'));

        return back()->with('success', 'Member access updated.');
    }
}
