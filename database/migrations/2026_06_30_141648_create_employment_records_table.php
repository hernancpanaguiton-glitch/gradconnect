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
        Schema::create('employment_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('graduate_profile_id')->constrained()->cascadeOnDelete();
            $table->string('company_name');
            $table->string('industry')->nullable();
            $table->string('job_title');
            $table->string('employment_type')->default('full_time');
            // full_time|part_time|contract|internship|freelance
            $table->boolean('is_current')->default(false);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('monthly_salary_range')->nullable();
            $table->string('location')->nullable();
            $table->boolean('is_related_to_course')->nullable();
            $table->string('how_obtained')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employment_records');
    }
};
