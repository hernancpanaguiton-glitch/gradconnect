<?php

namespace Database\Factories;

use App\Models\Survey;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Survey>
 */
class SurveyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'description' => fake()->optional(0.7)->paragraph(),
            'type' => fake()->randomElement(['employability', 'tracer', 'custom']),
            'target_role' => fake()->optional(0.5)->randomElement(['alumni', 'student']),
            'target_graduation_year' => fake()->optional(0.4)->numberBetween(2020, 2025),
            'status' => 'open',
            'opens_at' => now()->subDays(7),
            'closes_at' => now()->addDays(30),
        ];
    }

    public function employability(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'employability',
            'title' => 'Graduate Employability Survey '.now()->year,
        ]);
    }

    public function tracer(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'tracer',
            'title' => 'Alumni Tracer Study '.now()->year,
        ]);
    }
}
