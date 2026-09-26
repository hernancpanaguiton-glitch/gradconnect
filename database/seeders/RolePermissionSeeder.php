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
            'community.participate',

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
            'graduate_profiles.view_all',
            'announcements.manage',
            'learning_resources.manage',
            'community.moderate',

            // Department Head (read-only, scoped to department)
            'reports.department.view',
            'program_outcomes.view',
            'accreditation.support',

            // Student Affairs Office (student welfare & non-academic development)
            'students.manage',
            'scholarships.manage',
            'student_events.manage',
            'clearance.manage',
            'student_analytics.view',
            'students.cases.manage',

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
            'community.participate',
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
            'graduate_profiles.view_all', 'announcements.manage',
            'learning_resources.manage', 'community.moderate',
            // The FDD gives this office "manage alumni records", which is the
            // graduate directory (Talent Search) — not user-account
            // administration. It previously held users.manage, but every route
            // consuming that is role:admin, so the sidebar's "Alumni Database"
            // link and the Reports Hub's user-management card both 403'd.
            'candidates.search',
            // Talent Search and global search link straight to
            // /candidates/{profile}, which is gated on view_resumes — without
            // it every result this office is shown leads to a 403.
            'candidates.view_resumes',
        ]);

        $departmentHead = Role::firstOrCreate(['name' => 'department_head', 'guard_name' => 'web']);
        $departmentHead->syncPermissions([
            'reports.department.view', 'reports.employability.view',
            'program_outcomes.view', 'accreditation.support',
            'graduate_profiles.view_all',
        ]);

        $sao = Role::firstOrCreate(['name' => 'sao', 'guard_name' => 'web']);
        $sao->syncPermissions([
            'students.manage', 'scholarships.manage', 'student_events.manage',
            'clearance.manage', 'student_analytics.view', 'reports.employability.view',
            'candidates.search', 'candidates.view_resumes', 'graduate_profiles.view_all',
            'students.cases.manage',
        ]);

        // Admin super-role gets every permission
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->syncPermissions(Permission::all());
    }
}
