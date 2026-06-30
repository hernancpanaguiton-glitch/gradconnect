<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Embedding vector dimension, fixed to match gemini-embedding-001 (MRL-truncated).
     * Switching embedding providers to a different dimension requires a new
     * migration to alter the column type and re-embedding all rows.
     */
    private const DIMENSION = 768;

    /**
     * Run the migrations.
     *
     * pgvector has no SQLite equivalent, so this is a no-op outside Postgres —
     * the test suite runs on SQLite and matching features are gated to pgsql.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('CREATE EXTENSION IF NOT EXISTS vector');

        DB::statement('ALTER TABLE resumes ADD COLUMN embedding vector('.self::DIMENSION.')');
        DB::statement('ALTER TABLE job_postings ADD COLUMN embedding vector('.self::DIMENSION.')');

        DB::statement('CREATE INDEX resumes_embedding_hnsw_idx ON resumes USING hnsw (embedding vector_cosine_ops)');
        DB::statement('CREATE INDEX job_postings_embedding_hnsw_idx ON job_postings USING hnsw (embedding vector_cosine_ops)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS resumes_embedding_hnsw_idx');
        DB::statement('DROP INDEX IF EXISTS job_postings_embedding_hnsw_idx');
        DB::statement('ALTER TABLE resumes DROP COLUMN IF EXISTS embedding');
        DB::statement('ALTER TABLE job_postings DROP COLUMN IF EXISTS embedding');
    }
};
