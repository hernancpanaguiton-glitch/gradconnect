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
        Schema::create('scholarships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('provider')->nullable();
            $table->text('description')->nullable();
            $table->decimal('budget_amount', 12, 2)->nullable();
            $table->string('status')->default('active'); // active|pending|closed
            $table->timestamps();
        });

        Schema::create('scholarship_recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scholarship_id')->constrained()->cascadeOnDelete();
            $table->foreignId('graduate_profile_id')->constrained()->cascadeOnDelete();
            $table->timestamp('awarded_at')->nullable();
            $table->timestamps();
            $table->unique(['scholarship_id', 'graduate_profile_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scholarship_recipients');
        Schema::dropIfExists('scholarships');
    }
};
