<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ResolvesReportFilters;
use App\Models\Department;
use App\Models\Report;
use App\Services\CsvExporter;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployabilityReportController extends Controller
{
    use ResolvesReportFilters;

    public function __construct(
        private readonly ReportService $reports,
        private readonly CsvExporter $csv,
    ) {}

    /**
     * Show the employability report dashboard (FR9), filterable by college,
     * program, and graduation year.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermissionTo('reports.employability.view'), 403);

        $filters = [
            'department_ids' => $this->departmentIdsFromRequest($request),
            'graduation_year' => $this->graduationYearFromRequest($request),
        ];

        return Inertia::render('Reports/Employability', [
            ...$this->reports->employabilitySummary($filters),
            'colleges' => Department::colleges()->orderBy('name')->get(['id', 'name']),
            'programs' => Department::where('type', 'program')->orderBy('name')->get(['id', 'name', 'parent_id']),
            'filters' => [
                'college_id' => $request->integer('college_id') ?: null,
                'program_id' => $request->integer('program_id') ?: null,
                'graduation_year' => $filters['graduation_year'],
            ],
        ]);
    }

    /**
     * CSV export (Table 19 Report entity; "Generate Reports" use case's
     * "provide export options"). Also logs a Report row.
     */
    public function export(Request $request): StreamedResponse
    {
        abort_unless($request->user()->hasPermissionTo('reports.employability.view'), 403);

        $filters = [
            'department_ids' => $this->departmentIdsFromRequest($request),
            'graduation_year' => $this->graduationYearFromRequest($request),
        ];

        $summary = $this->reports->employabilitySummary($filters);

        Report::create([
            'generated_by_user_id' => $request->user()->id,
            'report_type' => 'employability',
            'parameters' => $request->only(['college_id', 'program_id', 'graduation_year']),
        ]);

        $rows = [
            ['Total Graduates', $summary['totalGraduates']],
            ['Willing to Relocate', $summary['willingToRelocate']],
            ['Job Relevance Rate (%)', $summary['jobRelevanceRate'] ?? 'N/A'],
            ['Avg. Time to Employment (months)', $summary['avgTimeToEmploymentMonths'] ?? 'N/A'],
            [],
            ['Employment Status', 'Count'],
            ...collect($summary['employmentBreakdown'])->map(fn ($count, $status) => [$status, $count])->values()->all(),
            [],
            ['Salary Range', 'Count'],
            ...collect($summary['salaryDistribution'])->map(fn ($count, $range) => [$range, $count])->values()->all(),
            [],
            ['Survey', 'Submitted', 'Eligible', 'Response Rate (%)'],
            ...collect($summary['surveyResponseRates'])->map(fn ($s) => [$s['title'], $s['submitted'], $s['eligible'], $s['responseRate']])->all(),
        ];

        return $this->csv->stream('employability-report-'.now()->format('Y-m-d').'.csv', ['Metric', 'Value'], $rows);
    }
}
