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
        Schema::create('learning_resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            // training|seminar|certification|course cover Skill Bridge Mitigation
            // (Scope §p.6); article|link cover general career guidance content
            // (FDD Graduate Student "access guidance resources") — one catalogue,
            // not two parallel CMSes.
            $table->string('type');
            $table->string('provider')->nullable();
            $table->string('url')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('learning_resource_skill', function (Blueprint $table) {
            $table->id();
            $table->foreignId('learning_resource_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['learning_resource_id', 'skill_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('learning_resource_skill');
        Schema::dropIfExists('learning_resources');
    }
};
