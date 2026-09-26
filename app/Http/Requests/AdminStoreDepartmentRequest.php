<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminStoreDepartmentRequest extends FormRequest
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
            // Codes end up in reports and exports, so keep them to the plain
            // uppercase form the catalogue uses (CCS, BSBA-HRM).
            'code' => ['required', 'string', 'max:20', 'regex:/^[A-Z0-9][A-Z0-9-]*$/', 'unique:departments,code'],
            'name' => ['required', 'string', 'max:255', Rule::unique('departments', 'name')
                ->where('type', $this->input('type'))
                ->where('parent_id', $this->input('parent_id'))],
            'type' => ['required', 'in:college,program'],
            'parent_id' => [
                'nullable',
                Rule::requiredIf(fn (): bool => $this->input('type') === 'program'),
                'prohibited_if:type,college',
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
            'parent_id.prohibited_if' => 'A college does not belong to another college.',
            'parent_id.required' => 'Choose the college this program belongs to.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'code' => str($this->input('code'))->squish()->upper()->value(),
            'name' => str($this->input('name'))->squish()->value(),
            'parent_id' => $this->filled('parent_id') ? (int) $this->input('parent_id') : null,
        ]);
    }
}
