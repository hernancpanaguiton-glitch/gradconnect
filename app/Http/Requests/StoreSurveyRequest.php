<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreSurveyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'in:employability,tracer,custom'],
            'status' => ['nullable', 'in:draft,open,closed'],
            'opens_at' => ['nullable', 'date'],
            'closes_at' => ['nullable', 'date'],
            'questions' => ['nullable', 'array'],
            'questions.*.prompt' => ['required', 'string'],
            'questions.*.type' => ['required', 'in:text,textarea,single_choice,multi_choice,rating,boolean,number'],
            'questions.*.options' => ['nullable', 'array'],
            'questions.*.is_required' => ['boolean'],
            'questions.*.maps_to' => ['nullable', 'string'],
        ];
    }
}
