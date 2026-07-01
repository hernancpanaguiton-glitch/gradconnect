<?php

namespace Database\Factories;

use App\Models\GraduateProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GraduateProfile>
 */
class GraduateProfileFactory extends Factory
{
    public function definition(): array
    {
        $graduationYear = fake()->numberBetween(2018, 2025);

        return [
            'department_id' => null,
            'program' => fake()->randomElement([
                'BS Computer Science', 'BS Information Technology',
                'BS Computer Engineering', 'BS Electronics Engineering',
                'BS Business Administration', 'BS Accountancy',
            ]),
            'student_number' => fake()->numerify('##-#####'),
            'graduation_year' => $graduationYear,
            'expected_graduation_year' => null,
            'gender' => fake()->randomElement(['male', 'female', 'prefer_not_to_say']),
            'birthdate' => fake()->dateTimeBetween('-35 years', '-20 years')->format('Y-m-d'),
            'phone' => '+63 9'.fake()->numerify('## ### ####'),
            'address' => fake()->streetAddress(),
            'city' => fake()->randomElement(['Cebu City', 'Mandaue City', 'Lapu-Lapu City', 'Talisay City']),
            'linkedin_url' => null,
            'headline' => fake()->jobTitle(),
            'summary' => fake()->paragraph(),
            'current_employment_status' => fake()->randomElement(['employed', 'unemployed', 'self_employed']),
            'willing_to_relocate' => fake()->boolean(40),
            'profile_completion' => fake()->numberBetween(40, 100),
        ];
    }

    public function employed(): static
    {
        return $this->state(fn (array $attributes) => [
            'current_employment_status' => 'employed',
        ]);
    }

    public function unemployed(): static
    {
        return $this->state(fn (array $attributes) => [
            'current_employment_status' => 'unemployed',
        ]);
    }

    public function student(): static
    {
        return $this->state(fn (array $attributes) => [
            'graduation_year' => null,
            'expected_graduation_year' => fake()->numberBetween(2025, 2027),
            'current_employment_status' => 'unemployed',
        ]);
    }
}
