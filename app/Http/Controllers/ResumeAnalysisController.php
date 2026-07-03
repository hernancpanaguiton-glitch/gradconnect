<?php

namespace App\Http\Controllers;

use App\Services\ResumeAnalysisService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ResumeAnalysisController extends Controller
{
    public function __construct(private readonly ResumeAnalysisService $analysis) {}

    /**
     * AI analysis of the graduate's primary résumé, including profile ↔ résumé
     * consistency checks.
     */
    public function index(Request $request): Response
    {
        $profile = $request->user()->graduateProfile()->firstOrCreate(
            ['user_id' => $request->user()->id],
        );

        return Inertia::render('ResumeAnalysis', $this->analysis->analyze($profile));
    }
}
