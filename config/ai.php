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

];
