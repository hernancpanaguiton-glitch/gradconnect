<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminStoreDepartmentRequest;
use App\Http\Requests\AdminUpdateDepartmentRequest;
use App\Models\AuditLog;
use App\Models\Department;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin > Colleges & Programs — the institution's own structure.
 *
 * Colleges and programs were seed-only until now, so an administrator could
 * not add a new program or correct a name without a developer. Every
 * department-scoped screen (graduate profiles, learning resources, the
 * department head's reports) reads from these rows, which is why moves and
 * deletions are audited and blocked rather than cascading.
 */
class DepartmentController extends Controller
{
    /**
     * Usage counts shown on each row, and the same counts that block a delete.
     *
     * @var array<int, string>
     */
    private const COUNTS = ['users', 'graduateProfiles', 'learningResources', 'children'];

    public function index(): Response
    {
        $colleges = Department::colleges()
            ->withCount(self::COUNTS)
            ->with(['children' => fn ($query) => $query->withCount(self::COUNTS)->orderBy('name')])
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Colleges', [
            'colleges' => $colleges,
            // A program whose college was removed would otherwise be invisible
            // here, yet still attached to graduates.
            'orphanPrograms' => Department::programs()
                ->whereNull('parent_id')
                ->withCount(self::COUNTS)
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(AdminStoreDepartmentRequest $request): RedirectResponse
    {
        $department = Department::create($request->validated());

        AuditLog::record(
            'department.created',
            $request->user(),
            "Created {$department->type} \"{$department->name}\" ({$department->code})",
        );

        return back()->with('success', ucfirst($department->type).' added.');
    }

    public function update(AdminUpdateDepartmentRequest $request, Department $department): RedirectResponse
    {
        $before = $department->only(['name', 'code', 'parent_id']);

        $department->update($request->validated());

        AuditLog::record('department.updated', $request->user(), $this->describeChange($department, $before));

        return back()->with('success', 'Saved.');
    }

    public function destroy(Request $request, Department $department): RedirectResponse
    {
        $blockers = $department->deletionBlockers();

        if ($blockers !== []) {
            throw ValidationException::withMessages([
                'department' => "Cannot delete \"{$department->name}\" — it still has ".
                    collect($blockers)->map(fn (int $count, string $label): string => "{$count} {$label}")->join(', ', ' and ').
                    '. Move or remove those first.',
            ]);
        }

        AuditLog::record(
            'department.deleted',
            $request->user(),
            "Deleted {$department->type} \"{$department->name}\" ({$department->code})",
        );

        $department->delete();

        return back()->with('success', 'Removed.');
    }

    /**
     * @param  array<string, mixed>  $before
     */
    private function describeChange(Department $department, array $before): string
    {
        $parts = [];

        if ($before['code'] !== $department->code) {
            $parts[] = "code {$before['code']} → {$department->code}";
        }

        if ($before['name'] !== $department->name) {
            $parts[] = "name \"{$before['name']}\" → \"{$department->name}\"";
        }

        if ($before['parent_id'] !== $department->parent_id) {
            // A move changes which department head sees those graduates, so
            // record where it came from as well as where it went.
            $parts[] = 'college '.$this->collegeLabel($before['parent_id']).' → '.$this->collegeLabel($department->parent_id);
        }

        return "Updated {$department->type} \"{$department->name}\"".
            ($parts === [] ? '' : ': '.implode(', ', $parts));
    }

    private function collegeLabel(?int $collegeId): string
    {
        if ($collegeId === null) {
            return 'unassigned';
        }

        return Department::find($collegeId)?->code ?? "#{$collegeId}";
    }
}
