<?php

namespace Tests\Unit\Models;

use App\Models\Skill;
use App\Models\SkillAlias;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SkillTest extends TestCase
{
    use RefreshDatabase;

    public function test_find_or_create_by_name_creates_a_new_skill_when_no_match_exists(): void
    {
        $skill = Skill::findOrCreateByName('Kubernetes');

        $this->assertSame('Kubernetes', $skill->name);
        $this->assertDatabaseCount('skills', 1);
    }

    public function test_find_or_create_by_name_returns_the_existing_skill_on_an_exact_match(): void
    {
        $first = Skill::findOrCreateByName('JavaScript');
        $second = Skill::findOrCreateByName('JavaScript');

        $this->assertSame($first->id, $second->id);
        $this->assertDatabaseCount('skills', 1);
    }

    public function test_find_or_create_by_name_resolves_through_an_alias_instead_of_duplicating(): void
    {
        $javascript = Skill::findOrCreateByName('JavaScript');
        SkillAlias::create(['skill_id' => $javascript->id, 'alias' => 'JS', 'alias_slug' => Str::slug('JS')]);

        $resolved = Skill::findOrCreateByName('JS');

        $this->assertSame($javascript->id, $resolved->id);
        $this->assertDatabaseCount('skills', 1);
    }

    public function test_alias_resolution_is_case_insensitive(): void
    {
        $javascript = Skill::findOrCreateByName('JavaScript');
        SkillAlias::create(['skill_id' => $javascript->id, 'alias' => 'ECMAScript', 'alias_slug' => Str::slug('ECMAScript')]);

        $resolved = Skill::findOrCreateByName('ecmascript');

        $this->assertSame($javascript->id, $resolved->id);
    }
}
