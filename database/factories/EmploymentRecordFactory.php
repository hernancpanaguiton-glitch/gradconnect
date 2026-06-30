<?php

namespace Database\Factories;

use App\Models\EmploymentRecord;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EmploymentRecord>
 */
class EmploymentRecordFactory extends Factory
{
    public function definition(): array
    {
        $startDate = fake()->dateTimeBetween('-5 years', '-1 year');

        return [
            'company_name' => fake()->company(),
            'industry' => fake()->randomElement([
                'Information Technology', 'Business Process Outsourcing',
                'Banking & Finance', 'Healthcare', 'Education', 'Retail',
            ]),
            'job_title' => fake()->jobTitle(),
            'employment_type' => fake()->randomElement(['full_time', 'part_time', 'contract']),
            'is_current' => false,
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => fake()->dateTimeBetween($startDate, 'now')->format('Y-m-d'),
            'monthly_salary_range' => fake()->randomElement(['15000-25000', '25000-40000', '40000-60000', '60000+']),
            'location' => fake()->randomElement(['Cebu City', 'Mandaue City', 'Makati City', 'Taguig City', 'Remote']),
            'is_related_to_course' => fake()->boolean(70),
            'how_obtained' => fake()->randomElement(['Job board', 'Referral', 'Direct application', 'OJT converted']),
            'description' => fake()->optional(0.6)->paragraph(),
        ];
    }

    public function current(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_current' => true,
            'end_date' => null,
        ]);
    }
}
