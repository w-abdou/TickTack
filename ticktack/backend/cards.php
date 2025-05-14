<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

// Get user ID from request
function getUserId() {
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        throw new Exception('Authorization required');
    }
    
    $userId = intval($headers['Authorization']);
    if ($userId <= 0) {
        throw new Exception('Invalid user ID');
    }
    
    return $userId;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $userId = getUserId();
    
    // Get card ID from query string if present
    $cardId = isset($_GET['id']) ? intval($_GET['id']) : null;
    $projectId = isset($_GET['project_id']) ? intval($_GET['project_id']) : null;
    
    switch ($method) {
        case 'GET':
            if (!$projectId) {
                throw new Exception('Project ID is required');
            }
            
            // Verify project belongs to user
            $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
            $stmt->execute([$projectId, $userId]);
            if (!$stmt->fetch()) {
                throw new Exception('Project not found');
            }
            
            // Get all cards for project
            $stmt = $pdo->prepare("SELECT * FROM cards WHERE project_id = ? ORDER BY created_at DESC");
            $stmt->execute([$projectId]);
            $cards = $stmt->fetchAll();
            
            echo json_encode([
                'status' => 'success',
                'data' => $cards
            ]);
            break;
            
        case 'POST':
            // Create new card
            $input = file_get_contents("php://input");
            $data = json_decode($input, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Invalid JSON data: ' . json_last_error_msg());
            }
            
            if (!isset($data['title']) || trim($data['title']) === '') {
                throw new Exception('Card title is required');
            }
            
            if (!isset($data['project_id'])) {
                throw new Exception('Project ID is required');
            }
            
            // Verify project belongs to user
            $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
            $stmt->execute([$data['project_id'], $userId]);
            if (!$stmt->fetch()) {
                throw new Exception('Project not found');
            }
            
            try {
                $pdo->beginTransaction();
                
                $stmt = $pdo->prepare("INSERT INTO cards (title, description, status, project_id) VALUES (?, ?, ?, ?)");
                $result = $stmt->execute([
                    trim($data['title']),
                    isset($data['description']) ? trim($data['description']) : null,
                    $data['status'] ?? 'todo',
                    $data['project_id']
                ]);
                
                if (!$result) {
                    throw new Exception('Failed to create card: ' . implode(', ', $stmt->errorInfo()));
                }
                
                $cardId = $pdo->lastInsertId();
                $pdo->commit();
                
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Card created successfully',
                    'data' => [
                        'id' => $cardId,
                        'title' => $data['title'],
                        'description' => $data['description'] ?? null,
                        'status' => $data['status'] ?? 'todo',
                        'project_id' => $data['project_id']
                    ]
                ]);
            } catch (Exception $e) {
                $pdo->rollBack();
                throw $e;
            }
            break;
            
        case 'PUT':
            if (!$cardId) {
                throw new Exception('Card ID is required');
            }
            
            // Get card and verify it belongs to user's project
            $stmt = $pdo->prepare("
                SELECT c.* FROM cards c 
                JOIN projects p ON c.project_id = p.id 
                WHERE c.id = ? AND p.user_id = ?
            ");
            $stmt->execute([$cardId, $userId]);
            if (!$stmt->fetch()) {
                throw new Exception('Card not found');
            }
            
            $input = file_get_contents("php://input");
            $data = json_decode($input, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Invalid JSON data: ' . json_last_error_msg());
            }
            
            if (!isset($data['title']) || trim($data['title']) === '') {
                throw new Exception('Card title is required');
            }
            
            try {
                $pdo->beginTransaction();
                
                $stmt = $pdo->prepare("UPDATE cards SET title = ?, description = ?, status = ? WHERE id = ?");
                $result = $stmt->execute([
                    trim($data['title']),
                    isset($data['description']) ? trim($data['description']) : null,
                    $data['status'] ?? 'todo',
                    $cardId
                ]);
                
                if (!$result) {
                    throw new Exception('Failed to update card: ' . implode(', ', $stmt->errorInfo()));
                }
                
                $pdo->commit();
                
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Card updated successfully'
                ]);
            } catch (Exception $e) {
                $pdo->rollBack();
                throw $e;
            }
            break;
            
        case 'DELETE':
            if (!$cardId) {
                throw new Exception('Card ID is required');
            }
            
            // Verify card belongs to user's project
            $stmt = $pdo->prepare("
                SELECT c.* FROM cards c 
                JOIN projects p ON c.project_id = p.id 
                WHERE c.id = ? AND p.user_id = ?
            ");
            $stmt->execute([$cardId, $userId]);
            if (!$stmt->fetch()) {
                throw new Exception('Card not found');
            }
            
            try {
                $pdo->beginTransaction();
                
                $stmt = $pdo->prepare("DELETE FROM cards WHERE id = ?");
                $result = $stmt->execute([$cardId]);
                
                if (!$result) {
                    throw new Exception('Failed to delete card: ' . implode(', ', $stmt->errorInfo()));
                }
                
                $pdo->commit();
                
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Card deleted successfully'
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
