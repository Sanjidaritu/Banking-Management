<?php

header('Content-Type: application/json');

echo json_encode([
    'MYSQLHOST' => getenv('MYSQLHOST') ? 'FOUND' : 'MISSING',
    'MYSQLPORT' => getenv('MYSQLPORT') ? 'FOUND' : 'MISSING',
    'MYSQLDATABASE' => getenv('MYSQLDATABASE') ? 'FOUND' : 'MISSING',
    'MYSQLUSER' => getenv('MYSQLUSER') ? 'FOUND' : 'MISSING',
    'MYSQLPASSWORD' => getenv('MYSQLPASSWORD') ? 'FOUND' : 'MISSING'
]);
