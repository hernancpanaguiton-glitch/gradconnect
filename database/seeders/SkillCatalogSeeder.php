<?php

namespace Database\Seeders;

use App\Models\Skill;
use App\Models\SkillAlias;
use App\Support\UclmCatalog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * The skill catalogue behind every college, from database/data/uclm_catalog.php.
 *
 * Categories are only ever filled in, never overwritten: an administrator can
 * recategorise a skill from the taxonomy screen and re-running the seeder
 * must leave that alone.
 */
class SkillCatalogSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            foreach (UclmCatalog::skillCategories() as $category => $names) {
                foreach ($names as $name) {
                    $skill = Skill::findOrCreateByName($name);

                    if ($skill->category === null) {
                        $skill->update(['category' => $category]);
                    }
                }
            }

            $this->seedAliases();
        });
    }

    private function seedAliases(): void
    {
        foreach (UclmCatalog::skillAliases() as $alias => $canonical) {
            $skill = Skill::where('slug', Skill::slugFor($canonical))->first();

            if ($skill === null) {
                continue;
            }

            $aliasSlug = Skill::slugFor($alias);

            // Mirrors Admin\SkillTaxonomyController: a name that is already a
            // skill in its own right can never also be an alias.
            if (Skill::where('slug', $aliasSlug)->exists()) {
                continue;
            }

            SkillAlias::firstOrCreate(
                ['alias_slug' => $aliasSlug],
                ['skill_id' => $skill->id, 'alias' => $alias],
            );
        }
    }
}
