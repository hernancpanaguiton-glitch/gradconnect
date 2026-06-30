<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateGraduateProfileRequest extends FormRequest
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
            'program' => ['nullable', 'string'],
            'graduation_year' => ['nullable', 'integer', 'between:1900,2030'],
            'expected_graduation_year' => ['nullable', 'integer'],
            'gender' => ['nullable', 'in:male,female,other,prefer_not_to_say'],
            'birthdate' => ['nullable', 'date'],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'linkedin_url' => ['nullable', 'url'],
            'headline' => ['nullable', 'string', 'max:255'],
            'summary' => ['nullable', 'string'],
            'current_employment_status' => ['nullable', 'in:employed,unemployed,self_employed,further_study,not_seeking'],
            'willing_to_relocate' => ['nullable', 'boolean'],
            'skills' => ['nullable', 'array'],
            'skills.*' => ['exists:skills,id'],
        ];
    }
}
