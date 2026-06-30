<?php

namespace Database\Factories;

use App\Models\Resume;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Resume>
 */
class ResumeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'original_filename' => fake()->slug().'.pdf',
            'path' => 'resumes/'.fake()->uuid().'.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => fake()->numberBetween(10_000, 500_000),
            'extracted_text' => null,
            'is_primary' => false,
            'embedding_status' => 'pending',
            'embedded_at' => null,
        ];
    }

    public function embedded(): static
    {
        return $this->state(fn (array $attributes) => [
            'embedding_status' => 'done',
            'embedded_at' => now(),
        ]);
    }
}
