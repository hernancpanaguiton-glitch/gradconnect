<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Department;
use Illuminate\Http\Request;

/**
 * Shared by EmployabilityReportController and ProgramOutcomesController so
 * "pick a college or a specific program" resolves to a department ID list
 * the same way in both places.
 */
trait ResolvesReportFilters
{
    /**
     * @return array<int, int>
     */
    private function departmentIdsFromRequest(Request $request): array
    {
        if ($programId = $request->integer('program_id')) {
            return [$programId];
        }

        if ($collegeId = $request->integer('college_id')) {
            return Department::expandToProgramIds($collegeId);
        }

        return [];
    }

    private function graduationYearFromRequest(Request $request): ?int
    {
        return $request->integer('graduation_year') ?: null;
    }
}
