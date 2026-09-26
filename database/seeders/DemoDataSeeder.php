<?php

namespace Database\Seeders;

use App\Jobs\GenerateResumeEmbedding;
use App\Models\Announcement;
use App\Models\ClearanceRecord;
use App\Models\CommunityComment;
use App\Models\CommunityPost;
use App\Models\Company;
use App\Models\Conversation;
use App\Models\EmployerFeedback;
use App\Models\Event;
use App\Models\EventRsvp;
use App\Models\GraduateProfile;
use App\Models\JobApplication;
use App\Models\JobMatchResult;
use App\Models\JobPosting;
use App\Models\LearningResource;
use App\Models\MatchFeedback;
use App\Models\Resume;
use App\Models\Scholarship;
use App\Models\ScholarshipRecipient;
use App\Models\Setting;
use App\Models\Skill;
use App\Models\SkillAlias;
use App\Models\StudentCase;
use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Models\User;
use App\Notifications\AnnouncementPublished;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * The activity layer on top of DatabaseSeeder's core records.
 *
 * DatabaseSeeder alone left ~19 tables empty, so every feature built after
 * the job-board (applications, employer feedback, events, scholarships,
 * clearance, cases, community, messaging, learning resources, announcements,
 * AI recommendations) demoed as an empty state. This seeds each of them with
 * plausible data so a fresh `migrate:fresh --seed` gives a walkable system.
 *
 * It reads what it needs from the DB rather than taking parameters, so it can
 * be re-run on its own: `php artisan db:seed --class=DemoDataSeeder`.
 */
class DemoDataSeeder extends Seeder
{
    /**
     * Résumé archetypes, written so they genuinely match different postings —
     * the backend CV should out-score the frontend one on the Laravel role.
     *
     * @var array<string, array{headline: string, body: string, skills: array<int, string>}>
     */
    private const RESUME_ARCHETYPES = [
        'backend' => [
            'headline' => 'Backend Developer',
            'skills' => ['PHP', 'Laravel', 'PostgreSQL', 'REST API', 'Docker', 'Git'],
            'body' => <<<'TXT'
                BACKEND DEVELOPER

                SUMMARY
                Backend-focused developer with hands-on experience building and maintaining
                REST APIs in PHP and Laravel. Comfortable with relational data modelling,
                query optimisation, and containerised deployment.

                TECHNICAL SKILLS
                PHP, Laravel, PostgreSQL, MySQL, REST API design, Docker, Git, Linux

                EXPERIENCE
                Junior Backend Developer
                - Built and maintained Laravel REST APIs serving web and mobile clients.
                - Designed PostgreSQL schemas and tuned slow queries.
                - Containerised services with Docker for consistent local and staging runs.

                EDUCATION
                BS Information Technology, University of Cebu Lapu-Lapu and Mandaue
                TXT,
        ],
        'frontend' => [
            'headline' => 'Frontend Developer',
            'skills' => ['JavaScript', 'TypeScript', 'React', 'Tailwind CSS', 'HTML', 'CSS'],
            'body' => <<<'TXT'
                FRONTEND DEVELOPER

                SUMMARY
                Frontend developer building responsive, accessible interfaces with React and
                TypeScript. Strong eye for detail and component reuse.

                TECHNICAL SKILLS
                JavaScript, TypeScript, React, Tailwind CSS, HTML, CSS, Git

                EXPERIENCE
                Frontend Developer
                - Translated designs into reusable, accessible React components.
                - Migrated a legacy jQuery interface to React with TypeScript.
                - Built responsive layouts with Tailwind CSS across mobile and desktop.

                EDUCATION
                BS Information Technology, University of Cebu Lapu-Lapu and Mandaue
                TXT,
        ],
        'data' => [
            'headline' => 'Data Analyst',
            'skills' => ['Python', 'SQL', 'Data Analysis', 'PostgreSQL'],
            'body' => <<<'TXT'
                DATA ANALYST

                SUMMARY
                Analyst turning operational data into reports and dashboards that support
                decision-making. Strong SQL and Python fundamentals.

                TECHNICAL SKILLS
                Python, SQL, PostgreSQL, Data Analysis, reporting and visualisation

                EXPERIENCE
                Data Analyst
                - Wrote SQL to consolidate reporting across several operational systems.
                - Automated recurring reports with Python.
                - Presented findings to non-technical stakeholders.

                EDUCATION
                BS Computer Science, University of Cebu Lapu-Lapu and Mandaue
                TXT,
        ],
    ];

    public function run(): void
    {
        $aao = User::role('alumni_affairs')->orderBy('id')->first();
        $sao = User::role('sao')->orderBy('id')->first();
        $admin = User::role('admin')->orderBy('id')->first();

        if (! $aao || ! $sao || ! $admin) {
            $this->command?->warn('DemoDataSeeder: core staff users missing — run DatabaseSeeder first.');

            return;
        }

        $this->seedSkillAliases();
        $this->seedLearningResources($aao);
        $resumesByProfile = $this->seedResumes();
        $this->seedApplicationsAndFeedback($resumesByProfile);
        $this->seedMatchResults($resumesByProfile);
        $this->seedSurveyResponses();
        $this->seedEvents($aao, $sao);
        $this->seedScholarships($sao);
        $this->seedClearance($sao);
        $this->seedStudentCases($sao);
        $this->seedCommunity();
        $this->seedConversation($aao);
        $this->seedAnnouncements($aao, $admin);
        $this->seedSettings();
    }

    /**
     * Layer 2.4 skill standardisation needs at least a few real aliases to
     * demonstrate that "JS" resolves to "JavaScript".
     */
    private function seedSkillAliases(): void
    {
        $aliases = [
            'JavaScript' => ['JS', 'ECMAScript'],
            'TypeScript' => ['TS'],
            'PostgreSQL' => ['Postgres', 'psql'],
            'REST API' => ['RESTful API'],
        ];

        foreach ($aliases as $canonical => $names) {
            $skill = Skill::where('name', $canonical)->first();
            if (! $skill) {
                continue;
            }

            foreach ($names as $alias) {
                SkillAlias::firstOrCreate(
                    ['alias_slug' => Skill::slugFor($alias)],
                    ['skill_id' => $skill->id, 'alias' => $alias],
                );
            }
        }
    }

    private function seedLearningResources(User $aao): void
    {
        $catalogue = [
            ['Docker Essentials for Developers', 'course', 'Coursera', ['Docker']],
            ['Kubernetes Fundamentals', 'training', 'Linux Foundation', ['Docker']],
            ['AWS Certified Cloud Practitioner', 'certification', 'Amazon Web Services', ['Linux', 'Networking']],
            ['Advanced SQL for Analysts', 'course', 'DataCamp', ['SQL', 'Data Analysis']],
            ['React Performance Workshop', 'workshop', 'Frontend Masters', ['React', 'JavaScript']],
            ['Technical Communication for IT Graduates', 'seminar', 'UCLM Career Services', ['Communication']],
            ['Writing a Standout IT Résumé', 'article', 'UCLM Alumni Affairs', ['Communication']],
            ['Project Management Basics (PMBOK)', 'training', 'PMI Philippines', ['Project Management']],
        ];

        foreach ($catalogue as [$title, $type, $provider, $skillNames]) {
            $resource = LearningResource::firstOrCreate(
                ['title' => $title],
                [
                    'created_by_user_id' => $aao->id,
                    'type' => $type,
                    'provider' => $provider,
                    'url' => 'https://example.org/'.Str::slug($title),
                    'description' => "Recommended by Alumni Affairs to close the {$skillNames[0]} gap.",
                ],
            );

            $ids = Skill::whereIn('name', $skillNames)->pluck('id')->all();
            $resource->skills()->syncWithoutDetaching($ids);
        }
    }

    /**
     * Seeds a real résumé file per graduate so the AI matching centrepiece has
     * candidate-side content. extracted_text is pre-filled so the résumé is
     * useful even when no queue worker is running; the embedding job is still
     * dispatched so the real pipeline runs when a worker and API keys exist.
     *
     * @return array<int, Resume> keyed by graduate_profile_id
     */
    private function seedResumes(): array
    {
        $archetypeKeys = array_keys(self::RESUME_ARCHETYPES);
        $resumes = [];

        // Alumni get résumés; students mostly do not (they are still studying),
        // except the demo student so the student flow is walkable too.
        $profiles = GraduateProfile::whereHas('user', fn ($q) => $q->role('alumni'))->orderBy('id')->get();
        $demoStudent = GraduateProfile::whereHas('user', fn ($q) => $q->where('email', 'student@gradconnect.edu.ph'))->first();
        if ($demoStudent) {
            $profiles->push($demoStudent);
        }

        foreach ($profiles->values() as $index => $profile) {
            if ($profile->resumes()->exists()) {
                continue;
            }

            $key = $archetypeKeys[$index % count($archetypeKeys)];
            $archetype = self::RESUME_ARCHETYPES[$key];
            $body = $this->dedent($archetype['body']);

            $filename = "{$key}-resume.txt";
            $path = "resumes/{$profile->id}/{$filename}";
            Storage::disk('local')->put($path, $body);

            $resume = $profile->resumes()->create([
                'original_filename' => $filename,
                'path' => $path,
                'mime_type' => 'text/plain',
                'size_bytes' => strlen($body),
                'extracted_text' => $body,
                'is_primary' => true,
                'source' => 'uploaded',
                'embedding_status' => 'pending',
            ]);

            // Give the profile a headline consistent with its résumé so the
            // profile text and the résumé text agree.
            if (blank($profile->headline)) {
                $profile->update(['headline' => $archetype['headline']]);
            }

            $skillIds = Skill::whereIn('name', $archetype['skills'])->pluck('id')
                ->mapWithKeys(fn ($id) => [$id => ['proficiency' => 'intermediate', 'source' => 'resume']]);
            $profile->skills()->syncWithoutDetaching($skillIds);

            GenerateResumeEmbedding::dispatch($resume->id);

            $resumes[$profile->id] = $resume;
        }

        return $resumes;
    }

    /**
     * @param  array<int, Resume>  $resumesByProfile
     */
    private function seedApplicationsAndFeedback(array $resumesByProfile): void
    {
        $postings = JobPosting::with('company')->orderBy('id')->get();
        $profiles = GraduateProfile::whereHas('user', fn ($q) => $q->role('alumni'))->orderBy('id')->take(12)->get();

        if ($postings->isEmpty() || $profiles->isEmpty()) {
            return;
        }

        // A spread across every status so the applicant pipeline, the
        // graduate's "My Applications" page, and the hiring funnel chart all
        // have something to show.
        $statuses = ['submitted', 'under_review', 'shortlisted', 'rejected', 'hired', 'submitted'];

        foreach ($profiles as $i => $profile) {
            $posting = $postings[$i % $postings->count()];
            $status = $statuses[$i % count($statuses)];

            $application = JobApplication::firstOrCreate(
                ['job_posting_id' => $posting->id, 'graduate_profile_id' => $profile->id],
                [
                    'resume_id' => $resumesByProfile[$profile->id]->id ?? $profile->primaryResume?->id,
                    'cover_letter' => 'I am very interested in this role and believe my background is a strong fit.',
                    'status' => $status,
                    'applied_at' => now()->subDays(30 - $i),
                ],
            );

            // Employer feedback is only collectable once a hiring decision is made.
            if (in_array($status, ['hired', 'rejected'], true)) {
                EmployerFeedback::firstOrCreate(
                    ['job_application_id' => $application->id],
                    [
                        'company_id' => $posting->company_id,
                        'graduate_profile_id' => $profile->id,
                        'submitted_by_user_id' => $posting->posted_by_user_id,
                        'overall_rating' => $status === 'hired' ? 5 : 3,
                        'competency_ratings' => $status === 'hired'
                            ? ['technical_skills' => 5, 'communication' => 4, 'problem_solving' => 5, 'teamwork' => 4, 'adaptability' => 4]
                            : ['technical_skills' => 3, 'communication' => 3, 'problem_solving' => 2, 'teamwork' => 4, 'adaptability' => 3],
                        'comments' => $status === 'hired'
                            ? 'Strong technical fundamentals and communicated clearly throughout the process.'
                            : 'Solid attitude, but needed more depth on backend fundamentals for this role.',
                    ],
                );
            }
        }
    }

    /**
     * Pre-computed AI match results so /recommendations, /skill-gap and the
     * Platform Status accuracy dashboard are demonstrable WITHOUT API keys or
     * a queue worker. When the real pipeline does run, ResumeMatchingService
     * upserts over these rows on the same unique key.
     *
     * @param  array<int, Resume>  $resumesByProfile
     */
    private function seedMatchResults(array $resumesByProfile): void
    {
        $postings = JobPosting::with('skills')->orderBy('id')->get();
        $profiles = GraduateProfile::whereHas('user', fn ($q) => $q->role('alumni'))
            ->with('skills')->orderBy('id')->take(8)->get();

        foreach ($profiles as $profile) {
            $profileSkills = $profile->skills->pluck('name');

            foreach ($postings as $posting) {
                $required = $posting->skills->pluck('name');
                $matched = $required->intersect($profileSkills)->values();
                $gaps = $required->diff($profileSkills)->values();

                if ($required->isEmpty()) {
                    continue;
                }

                // Score straight from real skill overlap, so the numbers are at
                // least internally consistent with the seeded résumés.
                $fit = (int) round($matched->count() / $required->count() * 100);
                $similarity = round(0.45 + ($fit / 100) * 0.5, 4);

                JobMatchResult::updateOrCreate(
                    ['job_posting_id' => $posting->id, 'graduate_profile_id' => $profile->id],
                    [
                        'resume_id' => $resumesByProfile[$profile->id]->id ?? $profile->primaryResume?->id,
                        'similarity' => $similarity,
                        'fit_score' => $fit,
                        'matched_skills' => $matched->all(),
                        'skill_gaps' => $gaps->all(),
                        'recommendation' => $fit >= 70 ? 'strong' : ($fit >= 40 ? 'moderate' : 'weak'),
                        'explanation' => $matched->isEmpty()
                            ? 'Limited overlap with the required skills for this role.'
                            : 'Matches on '.$matched->join(', ').($gaps->isEmpty() ? '.' : '; still missing '.$gaps->join(', ').'.'),
                        'scored_by' => $fit % 2 === 0 ? 'groq' : 'gemini',
                        'scored_at' => now()->subDays(2),
                    ],
                );
            }
        }

        // A little feedback so the Layer 5 accuracy dashboard is not empty.
        JobMatchResult::with('graduateProfile.user')->orderBy('id')->take(6)->get()
            ->each(function (JobMatchResult $match, int $i) {
                $user = $match->graduateProfile?->user;
                if (! $user) {
                    return;
                }

                MatchFeedback::firstOrCreate(
                    ['job_match_result_id' => $match->id, 'user_id' => $user->id],
                    ['rating' => $i % 3 === 0 ? 'not_helpful' : 'helpful'],
                );
            });
    }

    private function seedSurveyResponses(): void
    {
        $surveys = Survey::with('questions')->get();
        $alumni = User::role('alumni')->with('graduateProfile')->orderBy('id')->take(14)->get();

        foreach ($surveys as $survey) {
            if ($survey->questions->isEmpty()) {
                continue;
            }

            // Partial response rate, so the report's response-rate metric shows
            // a realistic figure rather than a flat 100%.
            foreach ($alumni->take(9) as $user) {
                $response = SurveyResponse::firstOrCreate(
                    ['survey_id' => $survey->id, 'user_id' => $user->id],
                    [
                        'graduate_profile_id' => $user->graduateProfile?->id,
                        'status' => 'submitted',
                        'submitted_at' => now()->subDays(rand(1, 20)),
                    ],
                );

                foreach ($survey->questions as $question) {
                    $response->answers()->firstOrCreate(
                        ['survey_question_id' => $question->id],
                        ['value' => $this->answerFor($question->type, $question->options)],
                    );
                }
            }
        }
    }

    /**
     * @param  array<int, string>|null  $options
     */
    private function answerFor(string $type, ?array $options): mixed
    {
        return match ($type) {
            'rating' => rand(3, 5),
            'boolean' => true,
            'number' => rand(1, 12),
            'single_choice', 'multi_choice' => $options[array_rand($options)] ?? 'N/A',
            default => 'Software Developer',
        };
    }

    private function seedEvents(User $aao, User $sao): void
    {
        $events = [
            [$aao, 'Alumni Homecoming 2026', 'networking', 'UCLM Mandaue Campus', 3, 120],
            [$aao, 'IT Career Fair', 'career_fair', 'UCLM Lapu-Lapu Gymnasium', 14, 300],
            [$sao, 'Résumé Writing Workshop', 'workshop', 'Room 302, Main Building', 7, 40],
            [$sao, 'Interview Skills Seminar', 'seminar', 'AVR 1', 21, 60],
        ];

        $attendees = User::role(['alumni', 'student'])->orderBy('id')->take(15)->get();

        foreach ($events as [$owner, $title, $type, $location, $daysOut, $capacity]) {
            $event = Event::firstOrCreate(
                ['title' => $title],
                [
                    'created_by_user_id' => $owner->id,
                    'description' => "Join us for {$title}. Open to graduates and graduating students.",
                    'type' => $type,
                    'location' => $location,
                    'starts_at' => now()->addDays($daysOut)->setTime(9, 0),
                    'ends_at' => now()->addDays($daysOut)->setTime(16, 0),
                    'capacity' => $capacity,
                    'status' => 'published',
                ],
            );

            foreach ($attendees->random(min(6, $attendees->count())) as $i => $attendee) {
                EventRsvp::firstOrCreate(
                    ['event_id' => $event->id, 'user_id' => $attendee->id],
                    ['status' => $i % 4 === 0 ? 'interested' : 'going'],
                );
            }
        }
    }

    private function seedScholarships(User $sao): void
    {
        $programs = [
            ['CHED Tulong Dunong Grant', 'Commission on Higher Education', 480000, 'active'],
            ['DOST-SEI Merit Scholarship', 'DOST Science Education Institute', 750000, 'active'],
            ['UCLM Academic Excellence Grant', 'University of Cebu Lapu-Lapu and Mandaue', 300000, 'active'],
            ['Mandaue City College Assistance', 'Mandaue City Government', 250000, 'pending'],
        ];

        $students = GraduateProfile::whereHas('user', fn ($q) => $q->role('student'))->orderBy('id')->get();

        foreach ($programs as [$name, $provider, $budget, $status]) {
            $scholarship = Scholarship::firstOrCreate(
                ['name' => $name],
                [
                    'created_by_user_id' => $sao->id,
                    'provider' => $provider,
                    'description' => "{$name}, administered through the Student Affairs Office.",
                    'budget_amount' => $budget,
                    'status' => $status,
                ],
            );

            if ($status !== 'active' || $students->isEmpty()) {
                continue;
            }

            foreach ($students->random(min(3, $students->count())) as $profile) {
                ScholarshipRecipient::firstOrCreate(
                    ['scholarship_id' => $scholarship->id, 'graduate_profile_id' => $profile->id],
                    ['awarded_at' => now()->subMonths(2)],
                );
            }
        }
    }

    private function seedClearance(User $sao): void
    {
        $students = GraduateProfile::whereHas('user', fn ($q) => $q->role('student'))->orderBy('id')->get();

        foreach ($students as $i => $profile) {
            // Progressive completion, so the institution-wide progress bars
            // show a realistic spread rather than all-or-nothing.
            $clearedCount = $i % (count(ClearanceRecord::OFFICES) + 1);

            foreach (ClearanceRecord::OFFICES as $officeIndex => $office) {
                $cleared = $officeIndex < $clearedCount;

                ClearanceRecord::firstOrCreate(
                    ['graduate_profile_id' => $profile->id, 'office' => $office],
                    [
                        'status' => $cleared ? 'cleared' : 'pending',
                        'cleared_by_user_id' => $cleared ? $sao->id : null,
                        'cleared_at' => $cleared ? now()->subDays(rand(1, 30)) : null,
                    ],
                );
            }
        }
    }

    private function seedStudentCases(User $sao): void
    {
        $students = GraduateProfile::whereHas('user', fn ($q) => $q->role('student'))->with('user')->orderBy('id')->take(4)->get();

        $cases = [
            ['financial', 'I am having difficulty settling my tuition balance before the deadline.', 'open', null],
            ['academic', 'I need guidance on my remaining subjects for graduation.', 'in_progress', null],
            ['personal', 'Requesting assistance with a schedule conflict affecting my OJT.', 'resolved', 'Coordinated with the department to adjust the OJT schedule.'],
            ['other', 'Asking about the process for requesting a certificate of good moral character.', 'closed', 'Directed to the registrar; certificate released.'],
        ];

        foreach ($students as $i => $profile) {
            [$category, $description, $status, $notes] = $cases[$i % count($cases)];

            StudentCase::firstOrCreate(
                ['graduate_profile_id' => $profile->id, 'category' => $category],
                [
                    'reported_by_user_id' => $profile->user->id,
                    'assigned_to_user_id' => $status === 'open' ? null : $sao->id,
                    'description' => $description,
                    'status' => $status,
                    'resolution_notes' => $notes,
                ],
            );
        }
    }

    private function seedCommunity(): void
    {
        $alumni = User::role('alumni')->orderBy('id')->take(6)->get();

        if ($alumni->count() < 2) {
            return;
        }

        $posts = [
            'Just wrapped up my first year as a backend developer in Cebu. Happy to answer questions from anyone job-hunting right now.',
            'Our company is opening two junior QA roles next month. I will post details here once the listing goes live.',
            'Anyone else attending the IT Career Fair? Would be good to catch up with batchmates.',
            'Finally passed my AWS certification. The Skill Gap page nudged me toward it — genuinely useful.',
        ];

        $comments = [
            'Congratulations! Well deserved.',
            'This is really helpful, thank you for sharing.',
            'Count me in — see you there.',
        ];

        foreach ($posts as $i => $body) {
            $author = $alumni[$i % $alumni->count()];

            $post = CommunityPost::firstOrCreate(
                ['user_id' => $author->id, 'body' => $body],
                ['created_at' => now()->subDays(10 - $i)],
            );

            foreach ($alumni->where('id', '!=', $author->id)->take(2)->values() as $j => $commenter) {
                CommunityComment::firstOrCreate(
                    ['community_post_id' => $post->id, 'user_id' => $commenter->id],
                    ['body' => $comments[($i + $j) % count($comments)]],
                );
            }
        }
    }

    private function seedConversation(User $aao): void
    {
        $alumni = User::where('email', 'alumni@gradconnect.edu.ph')->first();

        if (! $alumni || Conversation::whereHas('participants', fn ($q) => $q->where('users.id', $alumni->id))->exists()) {
            return;
        }

        $conversation = Conversation::create(['subject' => 'Tracer survey follow-up']);
        $conversation->participants()->attach([$alumni->id, $aao->id]);

        $conversation->messages()->create([
            'sender_user_id' => $aao->id,
            'body' => 'Hi! We noticed your tracer survey is still pending. Could you complete it when you have a moment?',
        ]);
        $conversation->messages()->create([
            'sender_user_id' => $alumni->id,
            'body' => 'Sure — I will fill it out today. Thanks for the reminder!',
        ]);

        $conversation->participants()->updateExistingPivot($aao->id, ['last_read_at' => now()]);
    }

    private function seedAnnouncements(User $aao, User $admin): void
    {
        $announcements = [
            [$aao, 'Graduate Tracer Survey 2026 is now open', 'alumni', 'All graduates are encouraged to complete the tracer survey. Your responses directly inform curriculum review and accreditation.'],
            [$aao, 'Alumni Homecoming registration open', null, 'Registration for the 2026 Alumni Homecoming is now open. Reserve your slot through the Events page.'],
            [$admin, 'Scheduled maintenance this weekend', null, 'GradConnect will be briefly unavailable on Saturday from 10:00 PM to 12:00 AM for scheduled maintenance.'],
        ];

        foreach ($announcements as [$author, $title, $audience, $body]) {
            $existing = Announcement::where('title', $title)->first();
            if ($existing) {
                continue;
            }

            $announcement = Announcement::create([
                'created_by_user_id' => $author->id,
                'title' => $title,
                'body' => $body,
                'audience' => $audience,
                'status' => 'published',
                'published_at' => now()->subDays(rand(1, 6)),
            ]);

            // sendNow rather than dispatch: these are ShouldQueue, and a demo
            // database is usually seeded without a queue worker running, which
            // would otherwise leave the notification bell permanently empty.
            Notification::sendNow($announcement->notifiableUsers(), new AnnouncementPublished($announcement));
        }
    }

    private function seedSettings(): void
    {
        Setting::set('support_email', 'support@gradconnect.edu.ph');
    }

    /**
     * Strip the leading indentation from an indented heredoc.
     */
    private function dedent(string $text): string
    {
        return trim(implode("\n", array_map('trim', explode("\n", $text))));
    }
}
