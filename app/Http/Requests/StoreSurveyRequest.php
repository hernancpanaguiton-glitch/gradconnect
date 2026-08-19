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
            'type' => ['required', 'in:employability,tracer,readiness,custom'],
            'status' => ['nullable', 'in:draft,open,closed'],
            'target_role' => ['nullable', 'in:alumni,student,industry_partner,alumni_affairs,department_head,sao,admin'],
            'target_graduation_year' => ['nullable', 'integer', 'between:1990,2100'],
            'opens_at' => ['nullable', 'date'],
            'closes_at' => ['nullable', 'date'],
            'questions' => ['nullable', 'array'],
            'questions.*.prompt' => ['required', 'string'],
            'questions.*.type' => ['required', 'in:text,textarea,single_choice,multi_choice,rating,boolean,number'],
            'questions.*.options' => ['nullable', 'array'],
            'questions.*.is_required' => ['boolean'],
            'questions.*.maps_to' => ['nullable', 'in:employment_status,current_employer,job_title,industry'],
        ];
    }
}
