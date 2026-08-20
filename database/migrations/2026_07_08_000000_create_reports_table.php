<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('generated_by_user_id')->constrained('users')->cascadeOnDelete();
            // employability|program_outcomes — which report was run.
            $table->string('report_type');
            // Filters used to generate it (college_id, program_id, graduation_year, …).
            $table->jsonb('parameters')->nullable();
            // Set once the CSV export is written to storage; null for an
            // on-screen-only view.
            $table->string('file_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
