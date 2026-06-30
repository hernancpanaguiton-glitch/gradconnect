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
        Schema::create('graduate_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->string('program')->nullable();
            $table->string('student_number')->nullable();
            $table->smallInteger('graduation_year')->nullable();
            $table->smallInteger('expected_graduation_year')->nullable();
            $table->string('gender')->nullable();
            $table->date('birthdate')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->string('headline')->nullable();
            $table->text('summary')->nullable();
            $table->string('current_employment_status')->default('unemployed');
            $table->boolean('willing_to_relocate')->default(false);
            $table->smallInteger('profile_completion')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('graduate_profiles');
    }
};
