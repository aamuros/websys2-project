<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

abstract class Controller
{
    protected function requireOperations(Request $request): void
    {
        abort_unless(in_array($request->user()->role->value, ['staff', 'admin'], true), 403);
    }

    protected function requireAdmin(Request $request): void
    {
        abort_unless($request->user()->role->value === 'admin', 403);
    }
}
