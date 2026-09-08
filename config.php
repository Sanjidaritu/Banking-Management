<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$host = getenv('MYSQLHOST');
$port = getenv('MYSQLPORT');
$db   = getenv('MYSQLDATABASE');
$user = getenv('MYSQLUSER');
$pass = getenv('MYSQLPASSWORD');

echo json_encode([
    'MYSQLHOST'     => $host !== false && $host !== '' ? 'FOUND' : 'MISSING',
    'MYSQLPORT'     => $port !== false && $port !== '' ? 'FOUND' : 'MISSING',
    'MYSQLDATABASE' => $db !== false && $db !== '' ? 'FOUND' : 'MISSING',
    'MYSQLUSER'     => $user !== false && $user !== '' ? 'FOUND' : 'MISSING',
    'MYSQLPASSWORD' => $pass !== false && $pass !== '' ? 'FOUND' : 'MISSING'
]);

exit;
