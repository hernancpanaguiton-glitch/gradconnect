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
        Schema::create('clearance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('graduate_profile_id')->constrained()->cascadeOnDelete();
            // library|accounting|registrar|department|student_affairs|alumni_office
            $table->string('office');
            $table->string('status')->default('pending'); // pending|cleared
            $table->foreignId('cleared_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('cleared_at')->nullable();
            $table->timestamps();
            $table->unique(['graduate_profile_id', 'office']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clearance_records');
    }
};
