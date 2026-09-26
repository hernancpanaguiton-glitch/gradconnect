<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminUpdateUserRequest extends FormRequest
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
            'status' => ['required', 'in:active,suspended,pending'],
            'roles' => ['required', 'array'],
            // syncRoles() throws on a name that has no role, which surfaced
            // as a 500 rather than a form error.
            'roles.*' => ['string', Rule::exists('roles', 'name')->where('guard_name', 'web')],
            'department_id' => ['nullable', Rule::exists('departments', 'id')->where('type', 'college')],
        ];
    }
}
