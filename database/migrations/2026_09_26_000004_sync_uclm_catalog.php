<?php

use Database\Seeders\CollegeSeeder;
use Database\Seeders\SkillCatalogSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Bring an already-running installation up to the full UCLM catalogue.
     *
     * A fresh install (and the test suite) seeds through DatabaseSeeder, which
     * calls the same two seeders — so when both tables are still empty there
     * is nothing to sync and running them here would only duplicate work.
     */
    public function up(): void
    {
        $isFreshInstall = DB::table('departments')->count() === 0
            && DB::table('skills')->count() === 0;

        if ($isFreshInstall) {
            return;
        }

        app(CollegeSeeder::class)->run();
        app(SkillCatalogSeeder::class)->run();
    }

    public function down(): void
    {
        // Data migration: the colleges, programs and skills added here are
        // ordinary rows an administrator now owns, so removing them on a
        // rollback would delete real institutional data.
    }
};
