<?php

namespace Database\Factories;

use App\Models\EducationRecord;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EducationRecord>
 */
class EducationRecordFactory extends Factory
{
    public function definition(): array
    {
        $startYear = fake()->numberBetween(2015, 2020);

        return [
            'institution' => fake()->randomElement([
                'University of Cebu', 'University of San Carlos',
                'Cebu Institute of Technology - University', 'University of the Philippines Cebu',
                'Southwestern University PHINMA', 'Cebu Technological University',
            ]),
            'degree' => fake()->randomElement(['Bachelor of Science', 'Bachelor of Arts', 'Master of Science']),
            'field_of_study' => fake()->randomElement([
                'Computer Science', 'Information Technology',
                'Computer Engineering', 'Business Administration',
            ]),
            'start_year' => $startYear,
            'end_year' => $startYear + 4,
            'honors' => fake()->optional(0.3)->randomElement(['Cum Laude', 'Magna Cum Laude', 'Summa Cum Laude']),
        ];
    }
}
