<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

include('db.php');

// Get user ID from request
function getUserId() {
    $headers = getallheaders();
    error_log('Authorization Header: ' . (isset($headers['Authorization']) ? $headers['Authorization'] : 'not set'));
    
    if (!isset($headers['Authorization'])) {
        throw new Exception('Authorization required');
    }
    
    $userId = intval($headers['Authorization']);
    error_log('Parsed User ID: ' . $userId);
    
    if ($userId <= 0) {
        throw new Exception('Invalid user ID');
    }
    
    return $userId;
}

try {
    $userId = getUserId();
    
    $sql = "SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC"; 
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId]);
    
    $projects = $stmt->fetchAll();
    error_log('Found ' . count($projects) . ' projects for user ' . $userId);
    
    echo json_encode([
        'status' => 'success',
        'data' => $projects
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

$pdo = null;
?>