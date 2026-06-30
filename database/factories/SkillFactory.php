<?php

namespace Database\Factories;

use App\Models\Skill;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Skill>
 */
class SkillFactory extends Factory
{
    private static array $skills = [
        'PHP', 'Laravel', 'JavaScript', 'TypeScript', 'React', 'Vue.js',
        'Node.js', 'Python', 'Java', 'MySQL', 'PostgreSQL', 'MongoDB',
        'Git', 'Docker', 'AWS', 'REST API', 'GraphQL', 'Linux',
        'CSS', 'HTML', 'Tailwind CSS', 'Bootstrap', 'Figma',
        'Project Management', 'Communication', 'Teamwork', 'Problem Solving',
        'Data Analysis', 'Excel', 'Power BI', 'SQL', 'Networking',
    ];

    private static int $index = 0;

    public function definition(): array
    {
        $name = self::$skills[self::$index % count(self::$skills)].' '.self::$index;
        self::$index++;

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'category' => fake()->randomElement(['Technical', 'Soft Skills', 'Tools', 'Frameworks']),
        ];
    }
}
