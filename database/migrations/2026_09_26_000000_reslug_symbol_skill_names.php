<?php

use App\Models\Skill;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Re-slug skills and aliases whose name contains a symbol Str::slug()
     * throws away — "C", "C++" and "C#" all stored the slug "c", so whichever
     * was created first swallowed the others everywhere matching compares
     * slugs. Existing well-behaved slugs (vuejs, nodejs, tailwind-css) are
     * left exactly as they are.
     */
    public function up(): void
    {
        $this->reslug('skills', 'name', 'slug');
        $this->reslug('skill_aliases', 'alias', 'alias_slug');
    }

    public function down(): void
    {
        // Data migration: the old slugs were ambiguous by construction, so
        // there is nothing meaningful to restore.
    }

    private function reslug(string $table, string $nameColumn, string $slugColumn): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        $rows = DB::table($table)->orderBy('id')->get(['id', $nameColumn, $slugColumn]);
        $taken = array_flip($rows->pluck($slugColumn)->all());

        foreach ($rows as $row) {
            $target = Skill::slugFor((string) $row->{$nameColumn});

            // Skip a slug that another row already owns rather than break the
            // unique index; the taxonomy screen can merge those by hand.
            if ($target === $row->{$slugColumn} || isset($taken[$target])) {
                continue;
            }

            DB::table($table)->where('id', $row->id)->update([$slugColumn => $target]);

            unset($taken[$row->{$slugColumn}]);
            $taken[$target] = true;
        }
    }
};
