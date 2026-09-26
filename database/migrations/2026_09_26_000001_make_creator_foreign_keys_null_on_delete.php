<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Deleting a staff account must not delete their work.
 *
 * Every "who created this" column cascaded on delete, so removing one
 * retired officer's account took their surveys with it — and survey_answers
 * cascade from survey_questions, so every tracer-study response ever
 * collected went with them. Announcements, learning resources, events,
 * scholarships, generated reports and student cases behaved the same way.
 * Content outlives the account that made it, so these become nullable and
 * null out instead.
 */
return new class extends Migration
{
    /**
     * @var array<string, string>
     */
    private const CREATOR_COLUMNS = [
        'surveys' => 'created_by_user_id',
        'announcements' => 'created_by_user_id',
        'learning_resources' => 'created_by_user_id',
        'events' => 'created_by_user_id',
        'scholarships' => 'created_by_user_id',
        'reports' => 'generated_by_user_id',
        'student_cases' => 'reported_by_user_id',
    ];

    public function __construct()
    {
        // SQLite has no ALTER for this, so Laravel rebuilds each table and
        // toggles foreign-key enforcement around the rebuild — which a
        // wrapping transaction would prevent.
        $this->withinTransaction = DB::connection()->getDriverName() !== 'sqlite';
    }

    public function up(): void
    {
        foreach (self::CREATOR_COLUMNS as $table => $column) {
            Schema::table($table, function (Blueprint $blueprint) use ($column) {
                // The array form: SQLite cannot drop a foreign key by name.
                $blueprint->dropForeign([$column]);
                $blueprint->unsignedBigInteger($column)->nullable()->change();
                $blueprint->foreign($column)->references('id')->on('users')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        foreach (self::CREATOR_COLUMNS as $table => $column) {
            Schema::table($table, function (Blueprint $blueprint) use ($column) {
                $blueprint->dropForeign([$column]);
                // The columns stay nullable on the way down: rows created
                // while this migration was applied may already hold NULL,
                // and NOT NULL would reject them.
                $blueprint->foreign($column)->references('id')->on('users')->cascadeOnDelete();
            });
        }
    }
};
