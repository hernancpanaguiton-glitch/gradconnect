<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $component = match (true) {
            $user->hasRole('admin') => 'Dashboards/AdminDashboard',
            $user->hasRole('alumni_affairs') => 'Dashboards/AlumniAffairsDashboard',
            $user->hasRole('department_head') => 'Dashboards/DepartmentHeadDashboard',
            $user->hasRole('industry_partner') => 'Dashboards/IndustryPartnerDashboard',
            $user->hasRole('alumni') => 'Dashboards/AlumniDashboard',
            $user->hasRole('student') => 'Dashboards/StudentDashboard',
            default => 'Dashboards/AlumniDashboard',
        };

        return Inertia::render($component);
    }
}
