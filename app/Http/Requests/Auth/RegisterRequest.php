<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use App\Support\Roles;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;

class RegisterRequest extends FormRequest
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
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => ['required', Rule::in(Roles::REGISTRABLE)],
            // A department head is tied to one college; nobody else may set it.
            'department_id' => [
                'exclude_unless:role,'.Roles::DEPARTMENT_HEAD,
                'nullable',
                Rule::exists('departments', 'id')->where('type', 'college'),
            ],
            // Data Privacy Act of 2012 (RA 10173) — registrants must
            // affirmatively agree before an account is created.
            'consent' => ['accepted'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            // A tab opened before the role vocabularies merged still posts
            // "dean" / "alumni_officer"; fold those into the current names.
            'role' => Roles::canonical($this->input('role')),
            'department_id' => $this->filled('department_id') ? (int) $this->input('department_id') : null,
        ]);
    }
}
