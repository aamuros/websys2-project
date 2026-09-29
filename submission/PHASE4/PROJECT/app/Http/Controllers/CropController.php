<?php

namespace App\Http\Controllers;

use App\Models\Crop;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CropController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireStaff($request);

        return Inertia::render('crops', [
            'crops' => Crop::orderBy('name')->get(['id', 'name', 'type']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireStaff($request);
        Crop::create($this->validated($request));

        return back()->with('success', 'Crop added.');
    }

    public function update(Request $request, Crop $crop): RedirectResponse
    {
        $this->requireStaff($request);
        $crop->update($this->validated($request, $crop));

        return back()->with('success', 'Crop updated.');
    }

    private function validated(Request $request, ?Crop $crop = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('crops')->ignore($crop)],
            'type' => ['required', Rule::in(['fruit', 'vegetable', 'herb', 'flower'])],
        ]);
    }
}
