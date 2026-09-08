<?php
declare(strict_types=1);
session_start();
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['success'=>false,'message'=>'Method not allowed.'],405);

$data = json_input();
$account = trim((string)($data['account_number'] ?? ''));
$ssn4 = trim((string)($data['ssn_last4'] ?? ''));
$dob = trim((string)($data['date_of_birth'] ?? ''));
$reference = trim((string)($data['enrollment_reference'] ?? ''));

if ($account === '' || !preg_match('/^\d{4}$/', $ssn4) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dob) || $reference === '') {
    json_response(['success'=>false,'message'=>'The information could not be verified.'],400);
}

$stmt = $pdo->prepare(
    'SELECT id, enrollment_reference_hash
     FROM customers
     WHERE account_number = :account
       AND ssn_last4 = :ssn4
       AND date_of_birth = :dob
       AND active = 1
       AND online_enrolled = 0
     LIMIT 1'
);
$stmt->execute(['account'=>$account,'ssn4'=>$ssn4,'dob'=>$dob]);
$customer = $stmt->fetch();

if (!$customer || !password_verify($reference, $customer['enrollment_reference_hash'])) {
    usleep(250000);
    json_response(['success'=>false,'message'=>'The information could not be verified.'],401);
}

$token = bin2hex(random_bytes(32));
$_SESSION['enrollment_token_hash'] = hash('sha256', $token);
$_SESSION['enrollment_customer_id'] = (int)$customer['id'];
$_SESSION['enrollment_expires'] = time() + 600;

json_response(['success'=>true,'enrollment_token'=>$token]);
