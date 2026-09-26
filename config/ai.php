<?php

/*
 * Which AI provider handles each stage, and at what vector size.
 *
 * Provider credentials, endpoints, and MODEL NAMES live in config/services.php
 * — that is the file every provider actually reads, and the only place a model
 * name should be changed. This file used to carry a second copy of them that
 * nothing consumed, still naming the models that were retired upstream, so
 * editing it looked like it worked and changed nothing.
 */

return [

    'embeddings' => [
        'default' => env('AI_EMBEDDING_PROVIDER', 'gemini'),
        'dimension' => (int) env('AI_EMBEDDING_DIM', 768),
    ],

    'scoring' => [
        'default' => env('AI_SCORING_PROVIDER', 'groq'),
        'fallback' => env('AI_SCORING_FALLBACK', 'gemini'),
    ],

    /*
     * Limits for outbound AI calls. Laravel's default is no connect timeout
     * and 30s per request; a matching run makes one call per candidate and
     * can fall back to a second provider, so unbounded calls overran the
     * job's own timeout and the work was abandoned halfway.
     */
    'http' => [
        'connect_timeout' => (int) env('AI_CONNECT_TIMEOUT', 5),
        'timeout' => (int) env('AI_TIMEOUT', 20),
    ],

    'matching' => [
        // Wall-clock budget for AI scoring inside one job. Past it the run
        // keeps the vector-similarity score and skips the AI pass, so it
        // finishes with partial results instead of being killed.
        'time_budget' => (int) env('AI_MATCHING_TIME_BUDGET', 240),
    ],

];
