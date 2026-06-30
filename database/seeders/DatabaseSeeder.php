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

        // Skill lookup by name, so each job posting gets skills that match its role.
        $skillsByName = $skills->keyBy('name');

        // Realistic IT companies for the demo.
        $companyBlueprints = [
            ['name' => 'Sugbo Software Labs', 'industry' => 'Software Development', 'location' => 'Cebu City'],
            ['name' => 'Mactan Digital Solutions', 'industry' => 'Information Technology', 'location' => 'Lapu-Lapu City'],
            ['name' => 'Visayas Cloud Systems', 'industry' => 'IT & Cloud Services', 'location' => 'Mandaue City'],
        ];

        // IT job archetypes — each with required skills that actually fit the role.
        $jobBlueprints = [
            [
                'title' => 'Software Engineer',
                'employment_type' => 'full_time',
                'experience_level' => 'mid',
                'salary_range' => '40000-65000',
                'description' => 'Build and maintain web applications and REST APIs using PHP and Laravel. Collaborate on feature delivery, code reviews, and database design.',
                'qualifications' => "BS in Computer Science, IT, or a related field.\nSolid grasp of PHP, Laravel, and relational databases.\nComfortable with Git-based workflows.",
                'skills' => ['PHP', 'Laravel', 'MySQL', 'Git', 'REST API'],
            ],
            [
                'title' => 'Frontend Developer',
                'employment_type' => 'full_time',
                'experience_level' => 'entry',
                'salary_range' => '30000-50000',
                'description' => 'Develop responsive, accessible user interfaces with React and TypeScript. Translate designs into reusable components with consistent quality.',
                'qualifications' => "Strong JavaScript and TypeScript fundamentals.\nExperience with React and modern CSS (Tailwind).\nKeen eye for detail and UX.",
                'skills' => ['JavaScript', 'TypeScript', 'React', 'Tailwind CSS', 'HTML'],
            ],
            [
                'title' => 'Backend Developer',
                'employment_type' => 'full_time',
                'experience_level' => 'mid',
                'salary_range' => '45000-70000',
                'description' => 'Design and implement backend services and REST APIs. Optimize PostgreSQL queries and containerize services with Docker.',
                'qualifications' => "Proficiency in PHP/Laravel and PostgreSQL.\nExperience designing REST APIs.\nWorking knowledge of Docker.",
                'skills' => ['PHP', 'Laravel', 'PostgreSQL', 'REST API', 'Docker'],
            ],
            [
                'title' => 'Full Stack Developer',
                'employment_type' => 'full_time',
                'experience_level' => 'mid',
                'salary_range' => '50000-80000',
                'description' => 'Work across the stack building features end to end with React on the front end and Node.js services on the back end.',
                'qualifications' => "Comfortable across frontend and backend.\nExperience with React, Node.js, and SQL databases.\nStrong Git proficiency.",
                'skills' => ['JavaScript', 'React', 'Node.js', 'MySQL', 'Git'],
            ],
            [
                'title' => 'Data Analyst',
                'employment_type' => 'full_time',
                'experience_level' => 'entry',
                'salary_range' => '35000-55000',
                'description' => 'Analyze datasets, build reports and dashboards, and surface insights to support decisions using Python and SQL.',
                'qualifications' => "Strong SQL and Python skills.\nExperience with data analysis and visualization.\nAttention to detail.",
                'skills' => ['Python', 'SQL', 'Data Analysis'],
            ],
            [
                'title' => 'DevOps Engineer',
                'employment_type' => 'contract',
                'experience_level' => 'senior',
                'salary_range' => '60000-90000',
                'description' => 'Own CI/CD pipelines, containerization, and Linux server operations. Improve reliability and deployment velocity.',
                'qualifications' => "Hands-on with Docker, Linux, and networking.\nExperience with Git-based CI/CD.\nStrong automation mindset.",
                'skills' => ['Docker', 'Linux', 'Git', 'Networking'],
            ],
        ];

        // Industry Partners (with companies)
        $partnerUsers = User::factory()->count(3)->industryPartner()->create();
        $companies = $partnerUsers->values()->map(function (User $partnerUser, int $index) use ($companyBlueprints) {
            $blueprint = $companyBlueprints[$index % count($companyBlueprints)];

            return Company::factory()->verified()->create([
                'owner_user_id' => $partnerUser->id,
                'name' => $blueprint['name'],
                'industry' => $blueprint['industry'],
                'location' => $blueprint['location'],
            ]);
        });

        // Job postings (2 per company), each with role-appropriate required skills.
        $companies->each(function (Company $company, int $index) use ($jobBlueprints, $skillsByName) {
            foreach (array_slice($jobBlueprints, $index * 2, 2) as $blueprint) {
                $job = JobPosting::create([
                    'company_id' => $company->id,
                    'posted_by_user_id' => $company->owner_user_id,
                    'title' => $blueprint['title'],
                    'description' => $blueprint['description'],
                    'qualifications' => $blueprint['qualifications'],
                    'employment_type' => $blueprint['employment_type'],
                    'experience_level' => $blueprint['experience_level'],
                    'salary_range' => $blueprint['salary_range'],
                    'location' => $company->location,
                    'is_remote' => false,
                    'status' => 'open',
                ]);

                $pivot = collect($blueprint['skills'])
                    ->map(fn (string $name) => $skillsByName->get($name)?->id)
                    ->filter()
                    ->mapWithKeys(fn ($id) => [$id => ['is_required' => true, 'weight' => 1]])
                    ->all();

                $job->skills()->attach($pivot);
            }
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
