<?php

$allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:4173',
    'http://localhost:4174',
    'http://localhost:4175',
    'http://localhost:4176',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4173',
    'http://127.0.0.1:5173',
    'https://localhost:3000',
    'https://localhost:4173',
    'https://localhost:5173',
    'https://127.0.0.1:3000',
    'https://127.0.0.1:4173',
    'https://127.0.0.1:5173',
    'https://calapan-bplo-frontend.onrender.com',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$file = __DIR__ . '/public' . $path;

if ($path !== '/' && is_file($file)) {
    return false;
}

require __DIR__ . '/public/index.php';