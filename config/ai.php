<?php

return [

    'embeddings' => [
        'default' => env('AI_EMBEDDING_PROVIDER', 'gemini'),
        'dimension' => (int) env('AI_EMBEDDING_DIM', 768),
    ],

    'scoring' => [
        'default' => env('AI_SCORING_PROVIDER', 'groq'),
        'fallback' => env('AI_SCORING_FALLBACK', 'gemini'),
    ],

    'providers' => [

        'gemini' => [
            'api_key' => env('GEMINI_API_KEY'),
            'chat_model' => env('GEMINI_CHAT_MODEL', 'gemini-2.5-flash'),
            'embedding_model' => env('GEMINI_EMBEDDING_MODEL', 'gemini-embedding-001'),
        ],

        'groq' => [
            'api_key' => env('GROQ_API_KEY'),
            'model' => env('GROQ_MODEL', 'llama-3.3-70b-versatile'),
        ],

        'jina' => [
            'api_key' => env('JINA_API_KEY'),
            'model' => env('JINA_EMBEDDING_MODEL', 'jina-embeddings-v3'),
        ],

    ],

];
