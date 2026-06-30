<?php

namespace Database\Factories;

use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Company>
 */
class CompanyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'industry' => fake()->randomElement([
                'Software Development', 'Information Technology',
                'IT & Business Process Outsourcing', 'Cloud Services',
                'Data & Analytics', 'Cybersecurity',
            ]),
            'website' => fake()->optional(0.7)->url(),
            'description' => fake()->optional(0.8)->paragraph(),
            'location' => fake()->randomElement(['Cebu City', 'Mandaue City', 'Makati City', 'BGC Taguig']),
            'logo_path' => null,
            'is_verified' => fake()->boolean(60),
        ];
    }

    public function verified(): static
    {
        return $this->state(fn (array $attributes) => ['is_verified' => true]);
    }
}
