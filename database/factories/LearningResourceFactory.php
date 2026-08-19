<?php

namespace Database\Factories;

use App\Models\LearningResource;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LearningResource>
 */
class LearningResourceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'created_by_user_id' => User::factory(),
            'department_id' => null,
            'title' => fake()->sentence(4),
            'type' => fake()->randomElement(['training', 'seminar', 'certification', 'course', 'article', 'link']),
            'provider' => fake()->company(),
            'url' => fake()->url(),
            'description' => fake()->paragraph(),
        ];
    }
}
