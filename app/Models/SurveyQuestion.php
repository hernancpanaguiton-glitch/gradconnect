<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Validation\Rule;

class SurveyQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'survey_id', 'order', 'prompt', 'type', 'options', 'is_required', 'maps_to',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'is_required' => 'boolean',
        ];
    }

    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(SurveyAnswer::class);
    }

    /**
     * Validation rules for this question's submitted answer, keyed by the
     * path they apply to inside the `answers` payload.
     *
     * Responses used to be stored with no validation at all, so a rating
     * could arrive as 47, a choice question could be answered with a value
     * that was never offered, a required question could be skipped, and an
     * array answer written into a varchar column by the maps_to write-back
     * crashed the whole submission.
     *
     * @return array<string, array<int, mixed>>
     */
    public function answerRules(): array
    {
        $presence = $this->is_required ? 'required' : 'nullable';
        $options = array_values(array_filter((array) ($this->options ?? [])));

        return match ($this->type) {
            'text' => ["answers.{$this->id}" => [$presence, 'string', 'max:2000']],
            'textarea' => ["answers.{$this->id}" => [$presence, 'string', 'max:10000']],
            'number' => ["answers.{$this->id}" => [$presence, 'numeric']],
            'rating' => ["answers.{$this->id}" => [$presence, 'integer', 'between:1,5']],
            'boolean' => ["answers.{$this->id}" => [$presence, Rule::in(['Yes', 'No'])]],
            'single_choice' => ["answers.{$this->id}" => [$presence, Rule::in($options)]],
            'multi_choice' => [
                "answers.{$this->id}" => [$presence, 'array'],
                "answers.{$this->id}.*" => [Rule::in($options)],
            ],
            default => ["answers.{$this->id}" => [$presence]],
        };
    }

    /**
     * Coerce a validated answer into the shape stored in survey_answers, so
     * a rating reads back as a number rather than the string the form posts.
     */
    public function normalizeAnswer(mixed $value): mixed
    {
        if ($value === null || $value === '') {
            return null;
        }

        return match ($this->type) {
            'rating' => (int) $value,
            'number' => is_numeric($value) ? $value + 0 : $value,
            'multi_choice' => array_values(array_filter(
                is_array($value) ? $value : [$value],
                fn ($option) => $option !== null && $option !== '',
            )),
            'text', 'textarea' => is_string($value) ? trim($value) : $value,
            default => $value,
        };
    }
}
