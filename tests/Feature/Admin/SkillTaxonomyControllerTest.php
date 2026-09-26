<?php

namespace Tests\Feature\Admin;

use App\Models\Skill;
use App\Models\SkillAlias;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SkillTaxonomyControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_view_the_skill_taxonomy(): void
    {
        $admin = User::factory()->admin()->create();
        Skill::findOrCreateByName('JavaScript');

        $this->actingAs($admin)->get(route('skill-taxonomy.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Skills')->has('skills.data', 1));
    }

    public function test_alumni_affairs_can_also_manage_the_taxonomy(): void
    {
        $aao = User::factory()->alumniAffairs()->create();

        $this->actingAs($aao)->get(route('skill-taxonomy.index'))->assertOk();
    }

    public function test_alumni_cannot_view_the_skill_taxonomy(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get(route('skill-taxonomy.index'))->assertForbidden();
    }

    public function test_admin_can_add_an_alias(): void
    {
        $admin = User::factory()->admin()->create();
        $skill = Skill::findOrCreateByName('JavaScript');

        $this->actingAs($admin)->post(route('skill-taxonomy.aliases.store', $skill), ['alias' => 'JS'])
            ->assertRedirect();

        $this->assertDatabaseHas('skill_aliases', ['skill_id' => $skill->id, 'alias' => 'JS']);
    }

    public function test_alias_cannot_shadow_an_existing_skill(): void
    {
        // A bare abort(422) is not a ValidationException, so Inertia had no
        // errors bag to redirect back with and covered the whole console in
        // the raw Laravel error page instead of flagging the input.
        $admin = User::factory()->admin()->create();
        $javascript = Skill::findOrCreateByName('JavaScript');
        Skill::findOrCreateByName('Python');

        $response = $this->actingAs($admin)
            ->from(route('skill-taxonomy.index'))
            ->post(route('skill-taxonomy.aliases.store', $javascript), ['alias' => 'Python']);

        $response->assertStatus(302);
        $response->assertRedirect(route('skill-taxonomy.index'));
        $response->assertSessionHasErrors('alias');

        $this->assertDatabaseCount('skill_aliases', 0);
    }

    public function test_a_blank_alias_is_rejected_without_touching_the_taxonomy(): void
    {
        $admin = User::factory()->admin()->create();
        $skill = Skill::findOrCreateByName('JavaScript');

        $this->actingAs($admin)
            ->from(route('skill-taxonomy.index'))
            ->post(route('skill-taxonomy.aliases.store', $skill), ['alias' => ''])
            ->assertSessionHasErrors('alias');

        $this->assertDatabaseCount('skill_aliases', 0);
    }

    public function test_a_valid_alias_still_saves_without_errors(): void
    {
        $admin = User::factory()->admin()->create();
        $skill = Skill::findOrCreateByName('JavaScript');

        $this->actingAs($admin)
            ->from(route('skill-taxonomy.index'))
            ->post(route('skill-taxonomy.aliases.store', $skill), ['alias' => 'ECMAScript'])
            ->assertRedirect(route('skill-taxonomy.index'))
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('skill_aliases', [
            'skill_id' => $skill->id,
            'alias' => 'ECMAScript',
            'alias_slug' => Skill::slugFor('ECMAScript'),
        ]);
    }

    public function test_admin_can_remove_an_alias(): void
    {
        $admin = User::factory()->admin()->create();
        $skill = Skill::findOrCreateByName('JavaScript');
        $alias = SkillAlias::create(['skill_id' => $skill->id, 'alias' => 'JS', 'alias_slug' => 'js']);

        $this->actingAs($admin)->delete(route('skill-taxonomy.aliases.destroy', $alias))->assertRedirect();

        $this->assertDatabaseMissing('skill_aliases', ['id' => $alias->id]);
    }

    public function test_search_filters_skills_by_name(): void
    {
        $admin = User::factory()->admin()->create();
        Skill::findOrCreateByName('JavaScript');
        Skill::findOrCreateByName('Python');

        $this->actingAs($admin)->get(route('skill-taxonomy.index', ['search' => 'Java']))
            ->assertInertia(fn ($page) => $page->has('skills.data', 1)->where('skills.data.0.name', 'JavaScript'));
    }
}
