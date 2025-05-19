<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

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

// Verify project belongs to user
function verifyProjectOwnership($projectId, $userId) {
    global $pdo;
    error_log('verifyProjectOwnership: Checking ownership for project ID ' . $projectId . ' and user ID ' . $userId); // Log verification attempt
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM projects WHERE id = ? AND user_id = ?");
    $stmt->execute([$projectId, $userId]);
    $count = $stmt->fetchColumn();
    error_log('verifyProjectOwnership: Found ' . $count . ' matching projects.'); // Log verification result
    if ($count == 0) {
        error_log('verifyProjectOwnership: Verification failed.'); // Log verification failure
        throw new Exception('Project not found or access denied');
    }
    error_log('verifyProjectOwnership: Verification successful.'); // Log verification success
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    error_log('Tasks.php received method: ' . $method); // Log request method
    error_log('Tasks.php received GET params: ' . print_r($_GET, true)); // Log GET parameters
    error_log('Tasks.php received POST/PUT data: ' . file_get_contents("php://input")); // Log POST/PUT data
    
    switch ($method) {
        case 'GET':
            // Get all tasks for a project
            $userId = getUserId();
            $projectId = $_GET['project_id'] ?? null;
            
            if (!$projectId) {
                throw new Exception('Project ID is required');
            }
            
            verifyProjectOwnership($projectId, $userId);
            error_log('Tasks.php: Passed project ownership verification.'); // Log after successful verification
            
            $stmt = $pdo->prepare("SELECT id, title, description, project_id, status, priority, due_date, tags, created_at, updated_at FROM tasks WHERE project_id = ? ORDER BY created_at DESC");
            
            // Log before executing the query
            error_log('Tasks.php: Executing query to fetch tasks for project ID: ' . $projectId);
            
            $stmt->execute([$projectId]);
            $tasks = $stmt->fetchAll();
            
            // Log successful fetch
            error_log('Tasks.php: Successfully fetched ' . count($tasks) . ' tasks.');
            
            echo json_encode([
                'status' => 'success',
                'data' => $tasks
            ]);
            break;
            
        case 'POST':
            // Create new task
            $data = json_decode(file_get_contents("php://input"), true);
            $userId = getUserId();
            
            if (!isset($data['project_id']) || !isset($data['title'])) {
                throw new Exception('Project ID and task title are required');
            }
            
            verifyProjectOwnership($data['project_id'], $userId);
            
            $stmt = $pdo->prepare("INSERT INTO tasks (title, description, project_id, priority, due_date, status, tags) VALUES (?, ?, ?, ?, ?, ?, ?)");
            
            // Log input data before execution
            error_log("Attempting to insert task with data: " . print_r($data, true));

            $result = $stmt->execute([
                $data['title'],
                $data['description'] ?? null,
                $data['project_id'],
                $data['priority'] ?? 'medium',
                $data['due_date'] ?? null,
                $data['status'] ?? 'todo',
                $data['tags'] ?? null
            ]);
            
            if (!$result) {
                // Get detailed error information from PDO
                $errorInfo = $stmt->errorInfo();
                $errorMessage = "PDO Execute failed: " . ($errorInfo[2] ?? "Unknown PDO error");
                error_log("Task insertion failed: " . $errorMessage);
                throw new Exception($errorMessage);
            }
            
            $taskId = $pdo->lastInsertId();
            
            // Log successful insertion
            error_log("Task inserted successfully with ID: " . $taskId);

            echo json_encode([
                'status' => 'success',
                'message' => 'Task created successfully',
                'data' => ['id' => $taskId]
            ]);
            break;
            
        case 'PUT':
            // Update task
            $data = json_decode(file_get_contents("php://input"), true);
            $userId = getUserId();
            
            if (!isset($data['id']) || !isset($data['project_id'])) {
                throw new Exception('Task ID and project ID are required');
            }
            
            verifyProjectOwnership($data['project_id'], $userId);
            
            $stmt = $pdo->prepare("UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, tags = ? WHERE id = ? AND project_id = ?");
            $result = $stmt->execute([
                $data['title'],
                $data['description'] ?? null,
                $data['status'] ?? 'todo',
                $data['priority'] ?? 'medium',
                $data['due_date'] ?? null,
                $data['tags'] ?? null,
                $data['id'],
                $data['project_id']
            ]);
            
            if (!$result) {
                throw new Exception('Failed to update task');
            }
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Task updated successfully'
            ]);
            break;
            
        case 'DELETE':
            // Delete task
            $data = json_decode(file_get_contents("php://input"), true);
            $userId = getUserId();
            
            if (!isset($data['id']) || !isset($data['project_id'])) {
                throw new Exception('Task ID and project ID are required');
            }
            
            verifyProjectOwnership($data['project_id'], $userId);
            
            $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ? AND project_id = ?");
            $result = $stmt->execute([$data['id'], $data['project_id']]);
            
            if (!$result) {
                throw new Exception('Failed to delete task');
            }
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Task deleted successfully'
            ]);
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
