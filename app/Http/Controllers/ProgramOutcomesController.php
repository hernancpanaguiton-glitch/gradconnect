<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ResolvesReportFilters;
use App\Models\Report;
use App\Services\CsvExporter;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProgramOutcomesController extends Controller
{
    use ResolvesReportFilters;

    public function __construct(
        private readonly ReportService $reports,
        private readonly CsvExporter $csv,
    ) {}

    /**
     * Curriculum-evaluation view for department heads (FR14 Skill
     * Analytics; FDD "identify curriculum improvement opportunities" /
     * "assess program effectiveness" / "support accreditation
     * requirements") — scoped to the head's own college/programs.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user->hasPermissionTo('program_outcomes.view'), 403);

        // Via the trait, so a head with no department assigned resolves to a
        // scope that matches nothing. Passing scopedDepartmentIds() straight
        // through sent [] instead, which ReportService reads as "no filter"
        // — i.e. the whole institution's figures.
        $filters = ['department_ids' => $this->departmentIdsFromRequest($request)];

        return Inertia::render('Reports/ProgramOutcomes', [
            ...$this->reports->employabilitySummary($filters),
            ...$this->reports->skillAnalytics($filters),
            'hasDepartment' => $user->scopedDepartmentIds() !== [],
        ]);
    }

    /**
     * CSV export (Table 19 Report entity). Also logs a Report row.
     */
    public function export(Request $request): StreamedResponse
    {
        $user = $request->user();
        abort_unless($user->hasPermissionTo('program_outcomes.view'), 403);

        $departmentIds = $this->departmentIdsFromRequest($request);
        $filters = ['department_ids' => $departmentIds];

        $employability = $this->reports->employabilitySummary($filters);
        $skills = $this->reports->skillAnalytics($filters);

        Report::create([
            'generated_by_user_id' => $user->id,
            'report_type' => 'program_outcomes',
            'parameters' => ['department_ids' => $departmentIds],
        ]);

        $rows = [
            ['Total Graduates', $employability['totalGraduates']],
            ['Job Relevance Rate (%)', $employability['jobRelevanceRate'] ?? 'N/A'],
            [],
            ['Employment Status', 'Count'],
            ...collect($employability['employmentBreakdown'])->map(fn ($count, $status) => [$status, $count])->values()->all(),
            [],
            ['Top Skill Gap (from AI job matches)', 'Count'],
            ...collect($skills['topSkillGaps'])->map(fn (array $gap) => [$gap['skill'], $gap['count']])->all(),
            [],
            ['Average Employer-Rated Competency (1-5)', 'Average'],
            ...collect($skills['competencyAverages'])->map(fn ($avg, $key) => [$key, $avg])->all(),
        ];

        return $this->csv->stream('program-outcomes-'.now()->format('Y-m-d').'.csv', ['Metric', 'Value'], $rows);
    }
}
