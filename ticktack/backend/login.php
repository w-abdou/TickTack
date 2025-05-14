<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

// Enable error logging
error_log('Login attempt started');

try {
    // Get and validate input
    $rawData = file_get_contents("php://input");
    error_log('Received login data: ' . $rawData);
    
    $data = json_decode($rawData, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON data: ' . json_last_error_msg());
    }
    
    if (!isset($data['email']) || !isset($data['password'])) {
        throw new Exception('Email and password are required');
    }

    $email = trim($data['email']);
    $password = $data['password'];

    if (empty($email)) {
        throw new Exception('Email cannot be empty');
    }

    error_log('Attempting login for email: ' . $email);

    // First check if the email exists
    $sql = "SELECT * FROM users WHERE email = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        error_log('User not found for email: ' . $email);
        throw new Exception('Invalid email or password');
    }

    error_log('User found with ID: ' . $user['id']);

    // Then check if the password matches
    if ($user['password'] !== $password) {
        error_log('Invalid password for user: ' . $user['id']);
        throw new Exception('Invalid email or password');
    }

    // Start a session and store user ID
    session_start();
    $_SESSION['user_id'] = $user['id'];
    
    error_log('Login successful for user: ' . $user['id']);
    
    $userData = [
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email']
    ];
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Login successful',
        'user' => $userData
    ]);

} catch (Exception $e) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
