<?php
declare(strict_types=1);
session_start();
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['success'=>false,'message'=>'Method not allowed.'],405);

$data = json_input();
$token = (string)($data['enrollment_token'] ?? '');
$username = trim((string)($data['username'] ?? ''));
$password = (string)($data['password'] ?? '');

if (!preg_match('/^[A-Za-z0-9_]{6,20}$/', $username) ||
    !preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,72}$/', $password)) {
    json_response(['success'=>false,'message'=>'Invalid credentials.'],400);
}

if (!$token || empty($_SESSION['enrollment_token_hash']) ||
    empty($_SESSION['enrollment_customer_id']) ||
    empty($_SESSION['enrollment_expires']) ||
    time() > $_SESSION['enrollment_expires'] ||
    !hash_equals($_SESSION['enrollment_token_hash'], hash('sha256',$token))) {
    json_response(['success'=>false,'message'=>'Verification session expired. Start again.'],401);
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('SELECT id, online_enrolled FROM customers WHERE id = :id AND active = 1 FOR UPDATE');
    $stmt->execute(['id'=>(int)$_SESSION['enrollment_customer_id']]);
    $customer = $stmt->fetch();

    if (!$customer || (int)$customer['online_enrolled'] === 1) {
        $pdo->rollBack();
        json_response(['success'=>false,'message'=>'This customer is already enrolled.'],409);
    }

    $stmt = $pdo->prepare('SELECT id FROM online_users WHERE username = :username LIMIT 1');
    $stmt->execute(['username'=>$username]);
    if ($stmt->fetch()) {
        $pdo->rollBack();
        json_response(['success'=>false,'message'=>'Username is already taken.'],409);
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare(
        'INSERT INTO online_users (customer_id, username, password_hash)
         VALUES (:customer_id, :username, :password_hash)'
    );
    $stmt->execute([
        'customer_id'=>(int)$customer['id'],
        'username'=>$username,
        'password_hash'=>$passwordHash
    ]);

    $stmt = $pdo->prepare('UPDATE customers SET online_enrolled = 1, enrollment_reference_hash = NULL WHERE id = :id');
    $stmt->execute(['id'=>(int)$customer['id']]);

    $pdo->commit();

    unset($_SESSION['enrollment_token_hash'], $_SESSION['enrollment_customer_id'], $_SESSION['enrollment_expires']);

    json_response(['success'=>true,'username'=>$username],201);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    json_response(['success'=>false,'message'=>'Unable to complete enrollment.'],500);
}
