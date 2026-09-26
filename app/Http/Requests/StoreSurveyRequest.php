<?php

namespace App\Http\Requests;

use App\Models\Survey;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSurveyRequest extends FormRequest
{
    /**
     * Question types whose answers come from a fixed option list.
     *
     * @var array<int, string>
     */
    private const CHOICE_TYPES = ['single_choice', 'multi_choice'];

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * The survey builder collects options as one comma-separated line, but
     * they are stored (and validated) as a list. Without this, every choice
     * question failed the `array` rule — and because the form showed no
     * per-question errors, saving simply appeared to do nothing.
     */
    protected function prepareForValidation(): void
    {
        $questions = $this->input('questions');

        if (! is_array($questions)) {
            return;
        }

        foreach ($questions as $index => $question) {
            if (! is_array($question)) {
                continue;
            }

            $questions[$index]['options'] = in_array($question['type'] ?? null, self::CHOICE_TYPES, true)
                ? $this->splitOptions($question['options'] ?? null)
                // A type change away from a choice question must not leave
                // the old options behind for the answer validator to enforce.
                : null;
        }

        $this->merge(['questions' => $questions]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $survey = $this->route('survey');

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
            // An edit addresses existing questions by ID; a crafted payload
            // must not be able to retarget another survey's question.
            'questions.*.id' => $survey instanceof Survey
                ? ['nullable', 'integer', Rule::exists('survey_questions', 'id')->where('survey_id', $survey->id)]
                : ['nullable', 'integer'],
            'questions.*.prompt' => ['required', 'string'],
            'questions.*.type' => ['required', 'in:text,textarea,single_choice,multi_choice,rating,boolean,number'],
            'questions.*.options' => ['nullable', 'array', 'required_if:questions.*.type,single_choice,multi_choice'],
            'questions.*.options.*' => ['string', 'max:255'],
            'questions.*.is_required' => ['boolean'],
            'questions.*.maps_to' => ['nullable', 'in:employment_status,current_employer,job_title,industry'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'questions.*.options.required_if' => 'List at least one option for a choice question.',
        ];
    }

    /**
     * @return array<int, string>|null
     */
    private function splitOptions(mixed $options): ?array
    {
        if (is_array($options)) {
            $values = $options;
        } elseif (is_string($options)) {
            $values = explode(',', $options);
        } else {
            return null;
        }

        return array_values(array_filter(
            array_map(fn ($option) => is_string($option) ? trim($option) : $option, $values),
            fn ($option) => $option !== '' && $option !== null,
        ));
    }
}
