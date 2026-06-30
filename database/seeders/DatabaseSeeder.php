<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Department;
use App\Models\EducationRecord;
use App\Models\EmploymentRecord;
use App\Models\GraduateProfile;
use App\Models\JobPosting;
use App\Models\Skill;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Roles & permissions first
        $this->call(RolePermissionSeeder::class);

        // Departments
        $itDept = Department::create(['name' => 'College of Computer Studies', 'code' => 'CCS', 'type' => 'college']);
        $csDept = Department::create(['name' => 'BS Computer Science', 'code' => 'BSCS', 'type' => 'program', 'parent_id' => $itDept->id]);
        $itProgram = Department::create(['name' => 'BS Information Technology', 'code' => 'BSIT', 'type' => 'program', 'parent_id' => $itDept->id]);
        $bizDept = Department::create(['name' => 'College of Business', 'code' => 'COB', 'type' => 'college']);

        // Canonical skills
        $skillNames = [
            'PHP', 'Laravel', 'JavaScript', 'TypeScript', 'React', 'Vue.js',
            'Node.js', 'Python', 'MySQL', 'PostgreSQL', 'Git', 'Docker',
            'REST API', 'Linux', 'CSS', 'HTML', 'Tailwind CSS',
            'Project Management', 'Communication', 'Problem Solving',
            'Data Analysis', 'SQL', 'Networking', 'Java',
        ];
        $skills = collect($skillNames)->map(
            fn ($name) => Skill::findOrCreateByName($name)
        );

        // Admin
        $admin = User::factory()->admin()->create([
            'first_name' => 'Admin',
            'last_name' => 'GradConnect',
            'email' => 'admin@gradconnect.edu.ph',
        ]);

        // Alumni Affairs Office staff
        $aaStaff1 = User::factory()->alumniAffairs()->create([
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'email' => 'alumni.affairs@gradconnect.edu.ph',
        ]);

        $aaStaff2 = User::factory()->alumniAffairs()->create();

        // Department Heads
        $deptHead1 = User::factory()->departmentHead()->create([
            'first_name' => 'Dr. Juan',
            'last_name' => 'dela Cruz',
            'email' => 'depthead.ccs@gradconnect.edu.ph',
            'department_id' => $itDept->id,
        ]);

        $deptHead2 = User::factory()->departmentHead()->create([
            'department_id' => $bizDept->id,
        ]);

        // Industry Partners (with companies)
        $partnerUsers = User::factory()->count(3)->industryPartner()->create();
        $companies = $partnerUsers->map(function (User $partnerUser) {
            return Company::factory()->verified()->create(['owner_user_id' => $partnerUser->id]);
        });

        // Job postings (2 per company)
        $jobPostings = $companies->flatMap(function (Company $company) use ($skills) {
            return JobPosting::factory()->count(2)->create([
                'company_id' => $company->id,
                'posted_by_user_id' => $company->owner_user_id,
            ])->each(function (JobPosting $job) use ($skills) {
                $job->skills()->attach(
                    $skills->random(4)->pluck('id'),
                    ['is_required' => true, 'weight' => 1]
                );
            });
        });

        // Alumni (20) with profiles, education, employment, skills
        $alumniUsers = User::factory()->count(20)->alumni()->create();
        $alumniUsers->each(function (User $user) use ($itProgram, $skills) {
            $profile = GraduateProfile::factory()->employed()->create([
                'user_id' => $user->id,
                'department_id' => $itProgram->id,
            ]);

            EducationRecord::factory()->create(['graduate_profile_id' => $profile->id]);

            EmploymentRecord::factory()->create(['graduate_profile_id' => $profile->id]);
            EmploymentRecord::factory()->current()->create(['graduate_profile_id' => $profile->id]);

            $profile->skills()->attach(
                $skills->random(5)->pluck('id')->mapWithKeys(fn ($id) => [$id => ['proficiency' => 'intermediate', 'source' => 'self']])
            );
        });

        // Graduating Students (10)
        $studentUsers = User::factory()->count(10)->student()->create();
        $studentUsers->each(function (User $user) use ($csDept, $skills) {
            $profile = GraduateProfile::factory()->student()->create([
                'user_id' => $user->id,
                'department_id' => $csDept->id,
            ]);

            EducationRecord::factory()->create(['graduate_profile_id' => $profile->id]);

            $profile->skills()->attach(
                $skills->random(3)->pluck('id')->mapWithKeys(fn ($id) => [$id => ['proficiency' => 'beginner', 'source' => 'self']])
            );
        });

        // Surveys
        $employabilitySurvey = Survey::factory()->employability()->create([
            'created_by_user_id' => $aaStaff1->id,
        ]);

        SurveyQuestion::factory()->singleChoice(['Employed', 'Unemployed', 'Self-employed', 'Further study'])->create([
            'survey_id' => $employabilitySurvey->id,
            'order' => 1,
            'prompt' => 'What is your current employment status?',
            'maps_to' => 'employment_status',
        ]);

        SurveyQuestion::factory()->create([
            'survey_id' => $employabilitySurvey->id,
            'order' => 2,
            'prompt' => 'What is your current job title or position?',
            'type' => 'text',
        ]);

        SurveyQuestion::factory()->rating()->create([
            'survey_id' => $employabilitySurvey->id,
            'order' => 3,
            'prompt' => 'How relevant is your current job to your degree?',
        ]);

        $tracerSurvey = Survey::factory()->tracer()->create([
            'created_by_user_id' => $aaStaff1->id,
        ]);

        SurveyQuestion::factory()->create([
            'survey_id' => $tracerSurvey->id,
            'order' => 1,
            'prompt' => 'How long after graduation did you find your first job?',
            'type' => 'single_choice',
            'options' => ['Within 1 month', '1-3 months', '3-6 months', 'More than 6 months', 'Still looking'],
        ]);
    }
}
