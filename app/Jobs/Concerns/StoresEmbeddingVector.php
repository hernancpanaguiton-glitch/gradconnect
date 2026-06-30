<?php

namespace App\Jobs\Concerns;

use Illuminate\Support\Facades\DB;

trait StoresEmbeddingVector
{
    /**
     * Write a vector into a pgvector column via raw SQL — Eloquent has no
     * native vector cast. No-ops outside Postgres (e.g. the SQLite test DB).
     *
     * @param  array<int, float>  $vector
     */
    protected function storeEmbedding(string $table, int $id, array $vector): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement(
            "update {$table} set embedding = ? where id = ?",
            ['['.implode(',', $vector).']', $id]
        );
    }
}
