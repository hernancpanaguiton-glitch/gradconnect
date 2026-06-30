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
        Schema::create('job_postings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('posted_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->text('responsibilities')->nullable();
            $table->text('qualifications')->nullable();
            $table->string('employment_type')->default('full_time');
            $table->string('location')->nullable();
            $table->boolean('is_remote')->default(false);
            $table->string('salary_range')->nullable();
            $table->string('experience_level')->nullable();
            $table->string('min_education')->nullable();
            $table->string('status')->default('open'); // draft|open|closed
            $table->date('application_deadline')->nullable();
            $table->string('embedding_status')->default('pending');
            $table->timestamp('embedded_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_postings');
    }
};
