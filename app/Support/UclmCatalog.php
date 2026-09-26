<?php

namespace App\Support;

/**
 * Reader for database/data/uclm_catalog.php.
 *
 * The file is a plain PHP array so the seeders, the landing page showcase and
 * the offline job-title suggestions all read the same institution data. It is
 * required once per process and memoised — nothing here touches the database,
 * so it is safe to call from a migration or a route closure.
 */
final class UclmCatalog
{
    /**
     * @var array<string, mixed>|null
     */
    private static ?array $catalog = null;

    /**
     * Colleges, in catalogue order.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function colleges(): array
    {
        return self::catalog()['colleges'] ?? [];
    }

    /**
     * Every skill name grouped by category: one entry per college plus the
     * shared categories. A skill name belongs to exactly one category.
     *
     * @return array<string, array<int, string>>
     */
    public static function skillCategories(): array
    {
        $categories = [];

        foreach (self::colleges() as $college) {
            $categories[$college['skill_category']] = array_values(array_unique(array_merge(
                $categories[$college['skill_category']] ?? [],
                $college['skills'],
            )));
        }

        foreach (self::catalog()['shared_skills'] ?? [] as $category => $skills) {
            $categories[$category] = array_values(array_unique(array_merge(
                $categories[$category] ?? [],
                $skills,
            )));
        }

        return $categories;
    }

    /**
     * Abbreviation => canonical skill name.
     *
     * @return array<string, string>
     */
    public static function skillAliases(): array
    {
        return self::catalog()['skill_aliases'] ?? [];
    }

    /**
     * One illustrative AI match per college, flattened for the landing page.
     *
     * @return array<int, array{
     *     college_code: string, college_name: string, short_label: string,
     *     job_title: string, match: int,
     *     skills: array<int, array{name: string, match: int}>,
     *     employer_type: string, salary_min: int, salary_max: int, location: string
     * }>
     */
    public static function showcase(): array
    {
        $showcase = [];

        foreach (self::colleges() as $college) {
            $example = $college['showcase'];

            $showcase[] = [
                'college_code' => $college['code'],
                'college_name' => $college['name'],
                'short_label' => $college['short_label'],
                'job_title' => $example['job_title'],
                'match' => (int) $example['match'],
                'skills' => array_map(
                    fn (array $skill): array => ['name' => $skill[0], 'match' => (int) $skill[1]],
                    $example['skills'],
                ),
                'employer_type' => $example['employer_type'],
                'salary_min' => (int) $example['salary'][0],
                'salary_max' => (int) $example['salary'][1],
                'location' => $example['location'],
            ];
        }

        return $showcase;
    }

    /**
     * Every job title in the catalogue, de-duplicated and alphabetical.
     *
     * @return array<int, string>
     */
    public static function jobTitles(): array
    {
        $titles = [];

        foreach (self::colleges() as $college) {
            foreach ($college['job_titles'] as $title) {
                $titles[mb_strtolower($title)] = $title;
            }
        }

        ksort($titles);

        return array_values($titles);
    }

    /**
     * Offline autocomplete for the job posting form, so the field still helps
     * when no AI provider is configured.
     *
     * @return array<int, string>
     */
    public static function suggestJobTitles(string $query, int $limit = 8): array
    {
        $needle = mb_strtolower(trim($query));

        if ($needle === '' || $limit < 1) {
            return [];
        }

        // Prefix matches first: typing "acc" should surface "Accounting Staff"
        // before "Junior Accountant".
        $prefixed = [];
        $contained = [];

        foreach (self::jobTitles() as $title) {
            $haystack = mb_strtolower($title);

            if (str_starts_with($haystack, $needle)) {
                $prefixed[] = $title;
            } elseif (str_contains($haystack, $needle)) {
                $contained[] = $title;
            }
        }

        return array_slice(array_merge($prefixed, $contained), 0, $limit);
    }

    /**
     * The skill category a college's graduates should see opened first.
     */
    public static function skillCategoryForCollegeCode(?string $code): ?string
    {
        if ($code === null || $code === '') {
            return null;
        }

        foreach (self::colleges() as $college) {
            if (strcasecmp($college['code'], $code) === 0) {
                return $college['skill_category'];
            }
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private static function catalog(): array
    {
        return self::$catalog ??= require database_path('data/uclm_catalog.php');
    }
}
