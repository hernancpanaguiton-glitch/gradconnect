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
     * A department ID list that yields no rows. ReportService treats an
     * empty array as "no filter / institution-wide", so a scoped viewer who
     * has no department must get this instead — otherwise the absence of a
     * scope silently becomes full access.
     */
    private const SCOPE_MATCHES_NOTHING = [0];

    /**
     * @return array<int, int>
     */
    private function departmentIdsFromRequest(Request $request): array
    {
        $user = $request->user();

        // A department head is confined to their own college and its
        // programs, and cannot widen or retarget that with query params.
        // Previously this method read only user-supplied params and returned
        // [] (= institution-wide) when none were given, so a department head
        // saw — and CSV-exported — the whole institution's salary and
        // employment data, and any other college's by passing ?college_id=.
        if ($this->callerIsDepartmentScoped($user)) {
            $own = $user->scopedDepartmentIds();

            if ($own === []) {
                return self::SCOPE_MATCHES_NOTHING;
            }

            // Narrowing within their own college is allowed; anything else is ignored.
            $programId = $request->integer('program_id');

            return $programId && in_array($programId, $own, true) ? [$programId] : $own;
        }

        if ($programId = $request->integer('program_id')) {
            return [$programId];
        }

        if ($collegeId = $request->integer('college_id')) {
            return Department::expandToProgramIds($collegeId);
        }

        return [];
    }

    /**
     * Department heads are the one reporting role the manuscript scopes to a
     * single college. Admin holds every permission, so this keys off the role
     * rather than `reports.department.view` (which admin also has) — matching
     * how DashboardController already discriminates.
     */
    private function callerIsDepartmentScoped(?object $user): bool
    {
        return $user !== null
            && $user->hasRole('department_head')
            && ! $user->hasRole('admin');
    }

    private function graduationYearFromRequest(Request $request): ?int
    {
        return $request->integer('graduation_year') ?: null;
    }
}
