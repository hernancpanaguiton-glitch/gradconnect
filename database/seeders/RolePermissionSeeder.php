<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Graduate / Alumni self-service
            'profile.edit',
            'resume.upload',
            'resume.manage',
            'jobs.view',
            'jobs.apply',
            'career.track',
            'recommendations.view',
            'surveys.respond',

            // Graduating student extras
            'career.resources.view',
            'assessments.participate',

            // Industry Partner
            'company.manage',
            'job_postings.create',
            'job_postings.edit_own',
            'job_postings.delete_own',
            'candidates.search',
            'candidates.view_resumes',
            'applications.manage_own',
            'employer_feedback.submit',
            'matching.trigger',

            // Alumni Affairs Office (+ absorbed CSO functions)
            'alumni.manage',
            'tracer_studies.manage',
            'alumni_engagement.monitor',
            'surveys.manage',
            'employability_reports.generate',
            'career_activities.manage',
            'reports.employability.view',

            // Department Head (read-only, scoped to department)
            'reports.department.view',
            'program_outcomes.view',
            'accreditation.support',

            // Admin (+ absorbed CSO: job moderation, system reports)
            'users.manage',
            'roles.manage',
            'permissions.manage',
            'job_postings.moderate',
            'system.settings',
            'reports.system.view',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $alumni = Role::firstOrCreate(['name' => 'alumni', 'guard_name' => 'web']);
        $alumni->syncPermissions([
            'profile.edit', 'resume.upload', 'resume.manage',
            'jobs.view', 'jobs.apply', 'career.track',
            'recommendations.view', 'surveys.respond', 'matching.trigger',
        ]);

        $student = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        $student->syncPermissions([
            'profile.edit', 'resume.upload', 'resume.manage',
            'jobs.view', 'jobs.apply',
            'career.resources.view', 'assessments.participate',
            'surveys.respond', 'matching.trigger',
        ]);

        $industryPartner = Role::firstOrCreate(['name' => 'industry_partner', 'guard_name' => 'web']);
        $industryPartner->syncPermissions([
            'company.manage',
            'job_postings.create', 'job_postings.edit_own', 'job_postings.delete_own',
            'candidates.search', 'candidates.view_resumes',
            'applications.manage_own', 'employer_feedback.submit',
            'matching.trigger',
        ]);

        $alumniAffairs = Role::firstOrCreate(['name' => 'alumni_affairs', 'guard_name' => 'web']);
        $alumniAffairs->syncPermissions([
            'alumni.manage', 'tracer_studies.manage', 'alumni_engagement.monitor',
            'surveys.manage', 'employability_reports.generate',
            'career_activities.manage', 'reports.employability.view',
            'users.manage',
        ]);

        $departmentHead = Role::firstOrCreate(['name' => 'department_head', 'guard_name' => 'web']);
        $departmentHead->syncPermissions([
            'reports.department.view', 'reports.employability.view',
            'program_outcomes.view', 'accreditation.support',
        ]);

        // Admin super-role gets every permission
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->syncPermissions(Permission::all());
    }
}
