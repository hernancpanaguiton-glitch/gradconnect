<?php

/**
 * Syntax-check every PHP file in the project's own source directories.
 *
 * `php -l` catches the class of error that only shows up when a file is
 * autoloaded at runtime (a stray semicolon after a class declaration, say),
 * which can otherwise reach a tester before any route exercises the file.
 *
 * Usage: composer lint
 */
$root = dirname(__DIR__);
$directories = ['app', 'bootstrap', 'config', 'database', 'routes', 'tests'];
$php = PHP_BINARY;

$checked = 0;
$failures = [];

foreach ($directories as $directory) {
    $path = $root.DIRECTORY_SEPARATOR.$directory;

    if (! is_dir($path)) {
        continue;
    }

    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS)
    );

    foreach ($files as $file) {
        if ($file->getExtension() !== 'php') {
            continue;
        }

        $checked++;

        $output = [];
        $status = 0;
        exec(escapeshellarg($php).' -l '.escapeshellarg($file->getPathname()).' 2>&1', $output, $status);

        if ($status !== 0) {
            $failures[] = trim(implode(PHP_EOL, $output));
        }
    }
}

if ($failures !== []) {
    fwrite(STDERR, implode(PHP_EOL, $failures).PHP_EOL);
    fwrite(STDERR, PHP_EOL.count($failures).' file(s) with syntax errors out of '.$checked.' checked.'.PHP_EOL);

    exit(1);
}

echo "No syntax errors in {$checked} PHP files.".PHP_EOL;
