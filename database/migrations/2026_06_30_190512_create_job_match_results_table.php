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
        Schema::create('job_match_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_posting_id')->constrained()->cascadeOnDelete();
            $table->foreignId('graduate_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('resume_id')->nullable()->constrained()->nullOnDelete();
            $table->float('similarity')->nullable();
            $table->unsignedTinyInteger('fit_score')->nullable();
            $table->text('explanation')->nullable();
            $table->jsonb('skill_gaps')->nullable();
            $table->jsonb('matched_skills')->nullable();
            $table->string('recommendation')->nullable(); // strong|moderate|weak
            $table->string('scored_by')->nullable(); // groq|gemini
            $table->timestamp('scored_at')->nullable();
            $table->timestamps();

            $table->unique(['job_posting_id', 'graduate_profile_id']);
            $table->index('fit_score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_match_results');
    }
};
