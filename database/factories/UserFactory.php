<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'id_number' => null,
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'status' => 'active',
            'department_id' => null,
            'remember_token' => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'suspended',
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    public function alumni(): static
    {
        return $this->afterCreating(function (User $user): void {
            $user->assignRole('alumni');
        });
    }

    public function student(): static
    {
        return $this->afterCreating(function (User $user): void {
            $user->assignRole('student');
        });
    }

    public function industryPartner(): static
    {
        return $this->afterCreating(function (User $user): void {
            $user->assignRole('industry_partner');
        });
    }

    public function alumniAffairs(): static
    {
        return $this->afterCreating(function (User $user): void {
            $user->assignRole('alumni_affairs');
        });
    }

    public function departmentHead(): static
    {
        return $this->afterCreating(function (User $user): void {
            $user->assignRole('department_head');
        });
    }

    public function admin(): static
    {
        return $this->afterCreating(function (User $user): void {
            $user->assignRole('admin');
        });
    }
}
