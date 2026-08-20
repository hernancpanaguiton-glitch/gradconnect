<?php

namespace Database\Factories;

use App\Models\Scholarship;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Scholarship>
 */
class ScholarshipFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->company().' Scholarship',
            'provider' => fake()->company(),
            'description' => fake()->paragraph(),
            'budget_amount' => fake()->randomFloat(2, 10000, 500000),
            'status' => 'active',
        ];
    }
}
