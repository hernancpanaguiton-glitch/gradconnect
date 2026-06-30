<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreJobPostingRequest extends FormRequest
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
            'description' => ['required', 'string'],
            'responsibilities' => ['nullable', 'string'],
            'qualifications' => ['nullable', 'string'],
            'employment_type' => ['required', 'in:full_time,part_time,contract,internship,freelance'],
            'location' => ['nullable', 'string', 'max:255'],
            'is_remote' => ['boolean'],
            'salary_range' => ['nullable', 'string', 'max:100'],
            'experience_level' => ['nullable', 'string', 'max:100'],
            'min_education' => ['nullable', 'string', 'max:100'],
            'application_deadline' => ['nullable', 'date'],
            'status' => ['nullable', 'in:draft,open,closed'],
            'skills' => ['nullable', 'array'],
            'skills.*.id' => ['required', 'exists:skills,id'],
            'skills.*.is_required' => ['boolean'],
            'skills.*.weight' => ['integer', 'between:1,5'],
        ];
    }
}
