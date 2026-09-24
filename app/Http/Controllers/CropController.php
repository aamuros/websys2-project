<?php

namespace App\Http\Controllers;

use App\Models\Crop;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CropController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireStaff($request);

        return Inertia::render('crops', [
            'crops' => Crop::orderBy('name')->get(['id', 'name', 'type', 'maturity_days_min', 'maturity_days_max', 'harvest_window_days', 'maturity_source']),
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
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:100', Rule::unique('crops')->ignore($crop)],
            'type' => ['required', Rule::in(['fruit', 'vegetable', 'herb', 'flower'])],
            'maturity_days_min' => ['nullable', 'integer', 'min:1', 'max:3650'],
            'maturity_days_max' => ['nullable', 'integer', 'min:1', 'max:3650'],
            'harvest_window_days' => ['nullable', 'integer', 'min:0', 'max:3650'],
            'maturity_source' => ['nullable', 'string', 'max:255'],
        ]);
        $validator->after(function ($validator) use ($request): void {
            $hasMin = $request->filled('maturity_days_min');
            $hasMax = $request->filled('maturity_days_max');

            if ($hasMin !== $hasMax) {
                $validator->errors()->add('maturity_days_min', 'Enter both ends of the maturity range, or leave both blank.');
                $validator->errors()->add('maturity_days_max', 'Enter both ends of the maturity range, or leave both blank.');
            }

            if ($hasMin && $hasMax && (int) $request->input('maturity_days_min') > (int) $request->input('maturity_days_max')) {
                $validator->errors()->add('maturity_days_max', 'The maximum days must be at least the minimum days.');
            }
        });

        return $validator->validate();
    }
}
