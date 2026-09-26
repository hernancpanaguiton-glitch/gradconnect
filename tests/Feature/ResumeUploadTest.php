<?php

namespace Tests\Feature;

use App\Jobs\GenerateResumeEmbedding;
use App\Models\Resume;
use App\Models\User;
use App\Services\FileTextExtractor;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use ZipArchive;

class ResumeUploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    /**
     * Write a minimal but valid .docx (OOXML zip) containing the given text.
     */
    private function makeDocx(string $text): string
    {
        $path = tempnam(sys_get_temp_dir(), 'res').'.docx';

        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml',
            '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'.
            '<Default Extension="xml" ContentType="application/xml"/></Types>');
        $zip->addFromString('word/document.xml',
            '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'.
            "<w:body><w:p><w:r><w:t>{$text}</w:t></w:r></w:p></w:body></w:document>");
        $zip->close();

        return $path;
    }

    public function test_extractor_reads_plain_text(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'res').'.txt';
        file_put_contents($path, 'Laravel developer with REST API experience.');

        $text = (new FileTextExtractor)->extract($path);

        $this->assertNotNull($text);
        $this->assertStringContainsString('REST API', $text);
    }

    public function test_extractor_reads_docx(): void
    {
        $path = $this->makeDocx('Kubernetes and Python data engineer');

        $text = (new FileTextExtractor)->extract($path);

        $this->assertNotNull($text);
        $this->assertStringContainsString('Kubernetes', $text);
    }

    public function test_txt_resume_upload_is_accepted(): void
    {
        Storage::fake('local');
        Queue::fake();
        $user = User::factory()->alumni()->create();

        $response = $this->actingAs($user)->post(route('resumes.store'), [
            'file' => UploadedFile::fake()->createWithContent('cv.txt', 'Backend developer, Laravel, SQL.'),
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('resumes', ['original_filename' => 'cv.txt']);
        Queue::assertPushed(GenerateResumeEmbedding::class);
    }

    public function test_docx_resume_upload_is_accepted(): void
    {
        Storage::fake('local');
        Queue::fake();
        $user = User::factory()->alumni()->create();

        $docxPath = $this->makeDocx('Frontend engineer, React, TypeScript');
        $upload = new UploadedFile($docxPath, 'cv.docx', null, null, true);

        $response = $this->actingAs($user)->post(route('resumes.store'), ['file' => $upload]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('resumes', ['original_filename' => 'cv.docx']);
    }

    public function test_docx_keeps_its_extension_so_its_text_can_be_extracted(): void
    {
        Storage::fake('local');
        Queue::fake();
        $user = User::factory()->alumni()->create();

        $docxPath = $this->makeDocx('Frontend engineer, React, TypeScript');
        $upload = new UploadedFile($docxPath, 'cv.docx', null, null, true);

        $this->actingAs($user)->post(route('resumes.store'), ['file' => $upload])
            ->assertSessionHasNoErrors();

        $resume = Resume::firstOrFail();

        // The stored name decides which parser runs; a .zip here meant the
        // resume imported as empty and was silently marked failed.
        $this->assertStringEndsWith('.docx', $resume->path);
        $this->assertSame(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            $resume->mime_type
        );
    }

    public function test_a_zip_renamed_as_docx_is_rejected(): void
    {
        Storage::fake('local');
        $user = User::factory()->alumni()->create();

        $zipPath = tempnam(sys_get_temp_dir(), 'zip').'.zip';
        $zip = new ZipArchive;
        $zip->open($zipPath, ZipArchive::CREATE);
        $zip->addFromString('notes.txt', 'not a word document');
        $zip->close();

        $this->actingAs($user)->post(route('resumes.store'), [
            'file' => new UploadedFile($zipPath, 'cv.docx', null, null, true),
        ])->assertSessionHasErrors('file');

        $this->assertDatabaseCount('resumes', 0);
    }

    public function test_an_image_renamed_as_pdf_is_rejected(): void
    {
        Storage::fake('local');
        $user = User::factory()->alumni()->create();

        $this->actingAs($user)->post(route('resumes.store'), [
            'file' => UploadedFile::fake()->image('headshot.jpg')->mimeType('application/pdf'),
        ])->assertSessionHasErrors('file');

        $this->assertDatabaseCount('resumes', 0);
    }

    public function test_unsupported_file_type_is_rejected(): void
    {
        Storage::fake('local');
        $user = User::factory()->alumni()->create();

        $response = $this->actingAs($user)->post(route('resumes.store'), [
            'file' => UploadedFile::fake()->create('photo.png', 100, 'image/png'),
        ]);

        $response->assertSessionHasErrors('file');
        $this->assertDatabaseCount('resumes', 0);
    }
}
