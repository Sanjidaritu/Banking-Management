<?php
declare(strict_types=1);
require_once __DIR__ . '/../config.php';

$username = trim((string)($_GET['username'] ?? ''));
if (!preg_match('/^[A-Za-z0-9_]{6,20}$/', $username)) {
    json_response(['success'=>true,'available'=>false]);
}

$stmt = $pdo->prepare('SELECT id FROM online_users WHERE username = :username LIMIT 1');
$stmt->execute(['username'=>$username]);

json_response(['success'=>true,'available'=>!$stmt->fetch()]);
