<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class AccountSessionService
{
    public function invalidate(User $user, ?string $exceptSession = null): void
    {
        if (config('session.driver') !== 'database') {
            return;
        }

        DB::connection(config('session.connection'))->table(config('session.table', 'sessions'))
            ->where('user_id', $user->id)
            ->when($exceptSession, fn ($query) => $query->where('id', '!=', $exceptSession))
            ->delete();
    }
}
