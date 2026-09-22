<?php

namespace App\Http\Requests;

use App\Enums\GardenPlotStatus;
use App\Enums\PlotRequestStatus;
use App\Enums\UserRole;
use App\Models\GardenPlot;
use App\Models\PlotRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePlotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Member;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'garden_plot_id' => [
                'required',
                'integer',
                Rule::exists(GardenPlot::class, 'id')
                    ->where('status', GardenPlotStatus::Available->value),
                Rule::unique(PlotRequest::class, 'garden_plot_id')
                    ->where('user_id', $this->user()->id)
                    ->where('status', PlotRequestStatus::Pending->value),
            ],
            'notes' => ['required', 'string', 'min:10', 'max:500'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'garden_plot_id.exists' => 'The selected plot is no longer available.',
            'garden_plot_id.unique' => 'You already have a pending request for this plot.',
            'notes.required' => 'Tell us briefly how you plan to use the plot.',
            'notes.min' => 'Please enter at least 10 characters.',
            'notes.max' => 'Please keep your note to 500 characters or fewer.',
        ];
    }
}
