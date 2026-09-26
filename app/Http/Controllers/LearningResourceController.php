<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLearningResourceRequest;
use App\Models\Department;
use App\Models\LearningResource;
use App\Models\Skill;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LearningResourceController extends Controller
{
    /**
     * Catalogue of trainings/seminars/certifications/courses/articles
     * (Skill Bridge Mitigation, Scope §p.6; FDD Graduate Student "access
     * guidance resources"). Managers (AAO/Admin) see and curate everything;
     * students see what's relevant to their own program plus general
     * (department-less) resources.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $canManage = $user->hasPermissionTo('learning_resources.manage');

        abort_unless($canManage || $user->hasPermissionTo('career.resources.view'), 403);

        $query = LearningResource::with(['department', 'skills']);

        if (! $canManage) {
            $query->forDepartment($user->graduateProfile?->department_id);
        }

        return Inertia::render('LearningResources/Index', [
            'resources' => $query->latest()->get(),
            'canManage' => $canManage,
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()->hasPermissionTo('learning_resources.manage'), 403);

        return Inertia::render('LearningResources/Create', [
            'departmentGroups' => $this->departmentGroups(),
            'skills' => Skill::orderBy('category')->orderBy('name')->get(['id', 'name', 'category']),
        ]);
    }

    public function store(StoreLearningResourceRequest $request): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('learning_resources.manage'), 403);

        $resource = LearningResource::create([
            ...$request->safe()->except('skill_ids'),
            'created_by_user_id' => $request->user()->id,
        ]);

        $resource->skills()->sync($request->input('skill_ids', []));

        return redirect()->route('learning-resources.index')->with('success', 'Resource added.');
    }

    public function edit(Request $request, LearningResource $learningResource): Response
    {
        abort_unless($request->user()->hasPermissionTo('learning_resources.manage'), 403);

        return Inertia::render('LearningResources/Edit', [
            'resource' => $learningResource->load('skills:id'),
            'departmentGroups' => $this->departmentGroups(),
            'skills' => Skill::orderBy('category')->orderBy('name')->get(['id', 'name', 'category']),
        ]);
    }

    public function update(StoreLearningResourceRequest $request, LearningResource $learningResource): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('learning_resources.manage'), 403);

        $learningResource->update($request->safe()->except('skill_ids'));
        $learningResource->skills()->sync($request->input('skill_ids', []));

        return redirect()->route('learning-resources.index')->with('success', 'Resource updated.');
    }

    public function destroy(Request $request, LearningResource $learningResource): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('learning_resources.manage'), 403);

        $learningResource->delete();

        return redirect()->route('learning-resources.index')->with('success', 'Resource removed.');
    }

    /**
     * Departments for the "restrict to" picker, grouped college → programs so
     * the select renders <optgroup>s instead of one flat list of ~50 rows.
     *
     * @return array<int, array{id: int|null, name: string, programs: array<int, array{id: int, name: string}>}>
     */
    private function departmentGroups(): array
    {
        $groups = Department::colleges()
            ->with(['children' => fn ($query) => $query->orderBy('name')])
            ->orderBy('name')
            ->get()
            ->map(fn (Department $college): array => [
                'id' => $college->id,
                'name' => $college->name,
                'programs' => $college->children
                    ->map(fn (Department $program): array => ['id' => $program->id, 'name' => $program->name])
                    ->all(),
            ])
            ->all();

        // A program whose college was removed still needs to be selectable.
        $orphans = Department::programs()->whereNull('parent_id')->orderBy('name')->get();

        if ($orphans->isNotEmpty()) {
            $groups[] = [
                'id' => null,
                'name' => 'Unassigned programs',
                'programs' => $orphans
                    ->map(fn (Department $program): array => ['id' => $program->id, 'name' => $program->name])
                    ->all(),
            ];
        }

        return $groups;
    }
}
