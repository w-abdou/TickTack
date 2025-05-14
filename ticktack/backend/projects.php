<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Log request details
error_log('Request Method: ' . $_SERVER['REQUEST_METHOD']);
error_log('Request Headers: ' . json_encode(getallheaders()));

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

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
    $method = $_SERVER['REQUEST_METHOD'];
    $userId = getUserId();
    error_log('Processing ' . $method . ' request for user ID: ' . $userId);
    
    // Get project ID from query string if present
    $projectId = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    switch ($method) {
        case 'GET':
            if ($projectId) {
                // Get specific project
                $stmt = $pdo->prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?");
                $stmt->execute([$projectId, $userId]);
                $project = $stmt->fetch();
                
                if (!$project) {
                    throw new Exception('Project not found');
                }
                
                echo json_encode([
                    'status' => 'success',
                    'data' => $project
                ]);
            } else {
                // Get all projects for user
                $stmt = $pdo->prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC");
                $stmt->execute([$userId]);
                $projects = $stmt->fetchAll();
                error_log('Found ' . count($projects) . ' projects for user ' . $userId);
                
                echo json_encode([
                    'status' => 'success',
                    'data' => $projects
                ]);
            }
            break;
            
        case 'POST':
            // Create new project
            $input = file_get_contents("php://input");
            error_log('Received POST data: ' . $input);
            
            $data = json_decode($input, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Invalid JSON data: ' . json_last_error_msg());
            }
            error_log('Decoded JSON data: ' . json_encode($data));
            
            if (!isset($data['name']) || trim($data['name']) === '') {
                throw new Exception('Project name is required');
            }
            
            try {
                $pdo->beginTransaction();
                
                $stmt = $pdo->prepare("INSERT INTO projects (name, description, user_id) VALUES (?, ?, ?)");
                $name = trim($data['name']);
                $description = isset($data['description']) ? trim($data['description']) : null;
                
                error_log('Executing SQL with parameters: ' . json_encode([
                    'name' => $name,
                    'description' => $description,
                    'user_id' => $userId
                ]));
                
                $stmt->execute([$name, $description, $userId]);
                $projectId = $pdo->lastInsertId();
                
                $pdo->commit();
                
                // Get the created project
                $stmt = $pdo->prepare("SELECT * FROM projects WHERE id = ?");
                $stmt->execute([$projectId]);
                $project = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Project created successfully',
                    'data' => $project
                ]);
            } catch (Exception $e) {
                $pdo->rollBack();
                throw $e;
            }
            break;
            
        case 'PUT':
            if (!$projectId) {
                throw new Exception('Project ID is required');
            }
            
            // Verify project belongs to user
            $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
            $stmt->execute([$projectId, $userId]);
            if (!$stmt->fetch()) {
                throw new Exception('Project not found');
            }
            
            // Update project
            $input = file_get_contents("php://input");
            error_log('Received PUT data: ' . $input);
            
            $data = json_decode($input, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Invalid JSON data: ' . json_last_error_msg());
            }
            
            if (!isset($data['name']) || trim($data['name']) === '') {
                throw new Exception('Project name is required');
            }
            
            try {
                $pdo->beginTransaction();
                
                $stmt = $pdo->prepare("UPDATE projects SET name = ?, description = ? WHERE id = ? AND user_id = ?");
                $result = $stmt->execute([
                    trim($data['name']),
                    isset($data['description']) ? trim($data['description']) : null,
                    $projectId,
                    $userId
                ]);
                
                if (!$result) {
                    throw new Exception('Failed to update project: ' . implode(', ', $stmt->errorInfo()));
                }
                
                $pdo->commit();
                
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Project updated successfully'
                ]);
            } catch (Exception $e) {
                $pdo->rollBack();
                throw $e;
            }
            break;
            
        case 'DELETE':
            if (!$projectId) {
                throw new Exception('Project ID is required');
            }
            
            // Verify project belongs to user
            $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
            $stmt->execute([$projectId, $userId]);
            if (!$stmt->fetch()) {
                throw new Exception('Project not found');
            }
            
            try {
                $pdo->beginTransaction();
                
                // Delete project
                $stmt = $pdo->prepare("DELETE FROM projects WHERE id = ? AND user_id = ?");
                $result = $stmt->execute([$projectId, $userId]);
                
                if (!$result) {
                    throw new Exception('Failed to delete project: ' . implode(', ', $stmt->errorInfo()));
                }
                
                $pdo->commit();
                
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Project deleted successfully'
                ]);
            } catch (Exception $e) {
                $pdo->rollBack();
                throw $e;
            }
            break;
            
        default:
            throw new Exception('Method not allowed');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
