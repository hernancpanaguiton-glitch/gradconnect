<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportsHubTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_sees_every_permission_scoped_report(): void
    {
        // Admin has every permission but no "alumni"/"student" role, so the
        // two personal graduate reports (skill gap, applications) are correctly
        // excluded — this asserts on the general (non-role-scoped) reports only.
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get(route('reports.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('ReportsHub')
                ->has('reports', 5)
            );
    }

    public function test_alumni_affairs_sees_scoped_reports(): void
    {
        $aao = User::factory()->alumniAffairs()->create();

        $this->actingAs($aao)->get(route('reports.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('reports', 3)
                ->where('reports.0.title', 'Employability Report')
            );
    }

    public function test_alumni_sees_only_their_personal_reports(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get(route('reports.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('reports', 2));
    }

    public function test_industry_partner_sees_only_the_directory(): void
    {
        $partner = User::factory()->industryPartner()->create();

        $this->actingAs($partner)->get(route('reports.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('reports', 1)
                ->where('reports.0.title', 'Graduate & Alumni Directory')
            );
    }
}
