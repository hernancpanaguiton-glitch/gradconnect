<?php

namespace App\Http\Requests;

use App\Models\Department;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminUpdateDepartmentRequest extends FormRequest
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
        $department = $this->department();

        return [
            'code' => ['required', 'string', 'max:20', 'regex:/^[A-Z0-9][A-Z0-9-]*$/',
                Rule::unique('departments', 'code')->ignore($department->id)],
            'name' => ['required', 'string', 'max:255', Rule::unique('departments', 'name')
                ->where('type', $department->type)
                ->where('parent_id', $this->input('parent_id'))
                ->ignore($department->id)],
            // Immutable: every department-scoped query assumes a row stays on
            // the level it was created at.
            'type' => ['required', Rule::in([$department->type])],
            'parent_id' => [
                'nullable',
                Rule::requiredIf(fn (): bool => $department->type === 'program'),
                Rule::prohibitedIf(fn (): bool => $department->type === 'college'),
                Rule::exists('departments', 'id')->where('type', 'college'),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.regex' => 'Use letters, numbers and hyphens only, e.g. BSBA-HRM.',
            'type.in' => 'A college cannot become a program, or the other way round.',
            'parent_id.prohibited' => 'A college does not belong to another college.',
            'parent_id.required' => 'Choose the college this program belongs to.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'code' => str($this->input('code'))->squish()->upper()->value(),
            'name' => str($this->input('name'))->squish()->value(),
            'type' => $this->filled('type') ? $this->input('type') : $this->department()->type,
            'parent_id' => $this->filled('parent_id') ? (int) $this->input('parent_id') : null,
        ]);
    }

    private function department(): Department
    {
        return $this->route('department');
    }
}
