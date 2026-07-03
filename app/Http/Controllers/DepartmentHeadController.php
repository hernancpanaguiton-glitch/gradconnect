<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DepartmentHeadController extends Controller
{
    /**
     * Let a department head / dean set the college they belong to, so their
     * dashboard analytics scope correctly.
     */
    public function updateCollege(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'department_id' => ['nullable', Rule::exists('departments', 'id')->where('type', 'college')],
        ]);

        $request->user()->update(['department_id' => $data['department_id'] ?? null]);

        return back()->with('success', 'College updated.');
    }
}
