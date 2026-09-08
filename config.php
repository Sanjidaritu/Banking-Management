<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$host = getenv('MYSQLHOST');
$port = getenv('MYSQLPORT');
$db   = getenv('MYSQLDATABASE');
$user = getenv('MYSQLUSER');
$pass = getenv('MYSQLPASSWORD');

echo json_encode([
    'MYSQLHOST' => $host ? 'FOUND' : 'MISSING',
    'MYSQLPORT' => $port ? 'FOUND' : 'MISSING',
    'MYSQLDATABASE' => $db ? 'FOUND' : 'MISSING',
    'MYSQLUSER' => $user ? 'FOUND' : 'MISSING',
    'MYSQLPASSWORD' => $pass ? 'FOUND' : 'MISSING'
]);

exit;
