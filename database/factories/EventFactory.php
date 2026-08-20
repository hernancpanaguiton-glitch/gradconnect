<?php

namespace Database\Factories;

use App\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'type' => fake()->randomElement(['career_fair', 'workshop', 'networking', 'seminar', 'other']),
            'location' => fake()->city(),
            'starts_at' => now()->addWeek(),
            'ends_at' => null,
            'capacity' => null,
            'status' => 'published',
        ];
    }
}
