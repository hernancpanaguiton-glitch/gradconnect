<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardRoutingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_sees_admin_dashboard(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user)->get('/dashboard')
            ->assertInertia(fn ($page) => $page->component('Dashboards/AdminDashboard'));
    }

    public function test_alumni_sees_alumni_dashboard(): void
    {
        $user = User::factory()->alumni()->create();

        $this->actingAs($user)->get('/dashboard')
            ->assertInertia(fn ($page) => $page->component('Dashboards/AlumniDashboard'));
    }

    public function test_student_sees_student_dashboard(): void
    {
        $user = User::factory()->student()->create();

        $this->actingAs($user)->get('/dashboard')
            ->assertInertia(fn ($page) => $page->component('Dashboards/StudentDashboard'));
    }

    public function test_industry_partner_sees_industry_partner_dashboard(): void
    {
        $user = User::factory()->industryPartner()->create();

        $this->actingAs($user)->get('/dashboard')
            ->assertInertia(fn ($page) => $page->component('Dashboards/IndustryPartnerDashboard'));
    }

    public function test_alumni_affairs_sees_alumni_affairs_dashboard(): void
    {
        $user = User::factory()->alumniAffairs()->create();

        $this->actingAs($user)->get('/dashboard')
            ->assertInertia(fn ($page) => $page->component('Dashboards/AlumniAffairsDashboard'));
    }

    public function test_department_head_sees_department_head_dashboard(): void
    {
        $user = User::factory()->departmentHead()->create();

        $this->actingAs($user)->get('/dashboard')
            ->assertInertia(fn ($page) => $page->component('Dashboards/DepartmentHeadDashboard'));
    }
}
