<?php

// Isolated screenshot server: use the production bundle without changing public/hot.
define('LARAVEL_START', microtime(true));
$root = dirname(__DIR__, 2);
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($path !== '/' && is_file($root.'/public'.$path)) {
    return false;
}
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Http\Kernel::class)->bootstrap();
Illuminate\Support\Facades\Vite::useHotFile('/private/tmp/websys2-phase4-unused-hot');
config(['cache.stores.file.path' => '/private/tmp/websys2-phase4-cache']);
$app->handleRequest(Illuminate\Http\Request::capture());
