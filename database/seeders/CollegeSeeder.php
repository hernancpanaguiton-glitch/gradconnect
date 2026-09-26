<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Support\UclmCatalog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * The UCLM colleges and their programs, from database/data/uclm_catalog.php.
 *
 * Insert-missing only: an administrator may have renamed or re-parented a row
 * through Admin > Colleges & Programs, and re-running the seeder must not
 * undo that. The one exception is a college that still carries an older code
 * (COB -> CBA), which is recoded and renamed *in place* so the users,
 * profiles and resources already pointing at that id follow the rename.
 */
class CollegeSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            foreach (UclmCatalog::colleges() as $college) {
                $department = $this->resolveCollege($college);

                foreach ($college['programs'] as $program) {
                    $this->resolveProgram($program, $department);
                }
            }
        });
    }

    /**
     * @param  array<string, mixed>  $college
     */
    private function resolveCollege(array $college): Department
    {
        $existing = Department::where('code', $college['code'])->first();

        if ($existing !== null) {
            $this->warnAboutLingeringLegacyCodes($college);

            return $existing;
        }

        foreach ($college['legacy_codes'] ?? [] as $legacyCode) {
            $legacy = Department::where('code', $legacyCode)->first();

            if ($legacy !== null) {
                $legacy->update(['code' => $college['code'], 'name' => $college['name']]);

                return $legacy;
            }
        }

        foreach (array_merge([$college['name']], $college['legacy_names'] ?? []) as $name) {
            $byName = $this->findCollegeByName($name);

            if ($byName !== null) {
                return $byName;
            }
        }

        return Department::create([
            'name' => $college['name'],
            'code' => $college['code'],
            'type' => 'college',
        ]);
    }

    /**
     * @param  array{code: string, name: string}  $program
     */
    private function resolveProgram(array $program, Department $college): Department
    {
        $existing = Department::where('code', $program['code'])->first();

        if ($existing !== null) {
            return $existing;
        }

        $byName = Department::where('parent_id', $college->id)
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($program['name'])])
            ->first();

        if ($byName !== null) {
            return $byName;
        }

        // parent_id is set on create only — a program an administrator moved
        // to a different college stays where they put it.
        return Department::create([
            'name' => $program['name'],
            'code' => $program['code'],
            'type' => 'program',
            'parent_id' => $college->id,
        ]);
    }

    private function findCollegeByName(string $name): ?Department
    {
        return Department::colleges()
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
            ->first();
    }

    /**
     * Both codes existing at once means the rename already happened and a row
     * under the old code was re-created (or never merged). Merging them would
     * move graduates between department heads, so say so and leave it alone.
     *
     * @param  array<string, mixed>  $college
     */
    private function warnAboutLingeringLegacyCodes(array $college): void
    {
        foreach ($college['legacy_codes'] ?? [] as $legacyCode) {
            if (Department::where('code', $legacyCode)->exists()) {
                $this->command?->warn(
                    "CollegeSeeder: both {$legacyCode} and {$college['code']} exist. ".
                    "Left {$legacyCode} untouched — merge them from Admin > Colleges & Programs."
                );
            }
        }
    }
}
