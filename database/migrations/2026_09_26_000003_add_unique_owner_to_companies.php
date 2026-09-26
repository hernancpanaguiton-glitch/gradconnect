<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * One industry partner owns exactly one company. Every read in the app
 * already assumes this (`Company::where('owner_user_id', ...)->firstOrFail()`,
 * `User::company()` as a hasOne), but nothing enforced it, so a
 * double-submitted create form left a second, permanently unreachable row.
 */
return new class extends Migration
{
    public function up(): void
    {
        $duplicates = DB::table('companies')
            ->select('owner_user_id')
            ->groupBy('owner_user_id')
            ->havingRaw('count(*) > 1')
            ->pluck('owner_user_id');

        // Refuse rather than guess which duplicate to drop — the extra rows
        // may own job postings and applications.
        if ($duplicates->isNotEmpty()) {
            throw new RuntimeException(
                'Cannot add a unique index on companies.owner_user_id: these owner_user_id values have '.
                'more than one company — '.$duplicates->implode(', ').'. Merge these first '.
                '(reassign their job postings to the company you keep, then delete the extras) and re-run.'
            );
        }

        Schema::table('companies', function (Blueprint $table) {
            $table->unique('owner_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropUnique(['owner_user_id']);
        });
    }
};
