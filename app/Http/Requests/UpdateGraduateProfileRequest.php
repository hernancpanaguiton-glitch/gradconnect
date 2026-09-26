<?php

namespace App\Http\Requests;

use App\Models\Department;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'college_id' => ['nullable', Rule::exists('departments', 'id')->where('type', 'college')],
            // A program only counts when it actually sits under the college
            // that was picked, so the two selects cannot drift apart.
            'program_id' => ['nullable', Rule::exists('departments', 'id')
                ->where('type', 'program')
                ->where('parent_id', $this->input('college_id'))],
            'skills' => ['nullable', 'array'],
            'skills.*' => ['exists:skills,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'program_id.exists' => 'Choose a program that belongs to the selected college.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $collegeId = $this->toId($this->input('college_id'));
        $programId = $this->toId($this->input('program_id'));

        // A tab opened before the college/program split still posts one
        // department_id; resolve it to whichever half it belongs to so the
        // save succeeds instead of failing an invisible validation rule.
        if ($collegeId === null && $programId === null && $this->filled('department_id')) {
            $department = Department::find($this->toId($this->input('department_id')));

            if ($department !== null) {
                $collegeId = $department->type === 'program' ? $department->parent_id : $department->id;
                $programId = $department->type === 'program' ? $department->id : null;
            }
        }

        $this->merge([
            'college_id' => $collegeId,
            'program_id' => $programId,
        ]);
    }

    private function toId(mixed $value): ?int
    {
        return ($value === null || $value === '') ? null : (int) $value;
    }
}
