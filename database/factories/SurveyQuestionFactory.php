<?php

namespace Database\Factories;

use App\Models\SurveyQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SurveyQuestion>
 */
class SurveyQuestionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'order' => 0,
            'prompt' => fake()->sentence().'?',
            'type' => 'text',
            'options' => null,
            'is_required' => true,
            'maps_to' => null,
        ];
    }

    public function singleChoice(array $options): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'single_choice',
            'options' => $options,
        ]);
    }

    public function rating(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'rating',
            'options' => [1, 2, 3, 4, 5],
        ]);
    }
}
