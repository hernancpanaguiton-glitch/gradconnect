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
            // Deterministic (no targeting) by default — now that target_role/
            // target_graduation_year actually filter visibility (Survey::
            // scopeVisibleTo), randomizing them here would make any test that
            // doesn't care about targeting intermittently flaky. Tests that
            // want to exercise targeting should use targetingRole()/
            // targetingGraduationYear() explicitly.
            'target_role' => null,
            'target_graduation_year' => null,
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

    public function targetingRole(string $role): static
    {
        return $this->state(fn (array $attributes) => ['target_role' => $role]);
    }

    public function targetingGraduationYear(int $year): static
    {
        return $this->state(fn (array $attributes) => ['target_graduation_year' => $year]);
    }
}
