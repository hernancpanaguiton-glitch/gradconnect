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
        Schema::create('survey_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->constrained()->cascadeOnDelete();
            $table->smallInteger('order')->default(0);
            $table->text('prompt');
            $table->string('type')->default('text');
            // text|textarea|single_choice|multi_choice|rating|boolean|number
            $table->jsonb('options')->nullable();
            $table->boolean('is_required')->default(true);
            $table->string('maps_to')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('survey_questions');
    }
};
