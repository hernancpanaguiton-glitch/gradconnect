<?php

namespace Database\Factories;

use App\Models\JobPosting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobPosting>
 */
class JobPostingFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->jobTitle(),
            'description' => fake()->paragraphs(3, true),
            'responsibilities' => fake()->optional(0.8)->paragraphs(2, true),
            'qualifications' => fake()->optional(0.8)->paragraphs(2, true),
            'employment_type' => fake()->randomElement(['full_time', 'part_time', 'contract']),
            'location' => fake()->randomElement(['Cebu City', 'Mandaue City', 'Remote', 'Makati City']),
            'is_remote' => fake()->boolean(30),
            'salary_range' => fake()->optional(0.6)->randomElement(['20000-30000', '30000-50000', '50000-80000', '80000+']),
            'experience_level' => fake()->randomElement(['entry', 'mid', 'senior']),
            'min_education' => fake()->randomElement(['Bachelor', 'Master', 'Any']),
            'status' => 'open',
            'application_deadline' => fake()->optional(0.7)->dateTimeBetween('now', '+3 months')?->format('Y-m-d'),
            'embedding_status' => 'pending',
            'embedded_at' => null,
        ];
    }

    public function open(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'open']);
    }

    public function closed(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'closed']);
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'draft']);
    }
}
