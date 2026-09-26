<?php

namespace App\Http\Requests;

use App\Rules\ResumeFileContent;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreResumeRequest extends FormRequest
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
            // `extensions` reads the client's name and the rule below checks the
            // bytes; `mimes` alone rejected valid .docx files on platforms whose
            // type database reports the zip container instead.
            'file' => ['required', 'file', 'extensions:pdf,txt,docx', 'max:10240', new ResumeFileContent],
        ];
    }
}
