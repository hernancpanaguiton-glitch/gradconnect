<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Resume extends Model
{
    use HasFactory;

    protected $fillable = [
        'graduate_profile_id', 'original_filename', 'path', 'mime_type',
        'size_bytes', 'extracted_text', 'is_primary', 'source',
        'embedding_status', 'embedded_at',
    ];

    /**
     * Never serialize the résumé's full text, its storage path, or the raw
     * pgvector column: this model is nested inside employer-facing payloads
     * (applicant lists, AI matches), and extracted_text is the whole résumé.
     *
     * @var array<int, string>
     */
    protected $hidden = ['embedding', 'extracted_text', 'path'];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'embedded_at' => 'datetime',
        ];
    }

    public function graduateProfile(): BelongsTo
    {
        return $this->belongsTo(GraduateProfile::class);
    }

    public function markEmbedded(): void
    {
        $this->update(['embedding_status' => 'done', 'embedded_at' => now()]);
    }

    public function markFailed(): void
    {
        $this->update(['embedding_status' => 'failed']);
    }
}
