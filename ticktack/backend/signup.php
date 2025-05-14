<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once 'db.php';

function writeLog($message) {
    $logFile = __DIR__ . '/debug.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
}

try {
    $rawData = file_get_contents("php://input");
    $data = json_decode($rawData, true);
    
    if (!isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
        throw new Exception('Username, email, and password are required');
    }

    $username = trim($data['username']);
    $email = trim($data['email']);
    $password = $data['password'];

    // Validate inputs
    if (empty($username) || empty($email) || empty($password)) {
        throw new Exception('All fields are required');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }

    // Check if email already exists
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetchColumn() > 0) {
        throw new Exception('Email already registered');
    }

    // Insert new user
    $sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([$username, $email, $password]);

    if (!$result) {
        throw new Exception('Failed to create account');
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Account created successfully'
    ]);

} catch (Exception $e) {
    writeLog("Signup error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
