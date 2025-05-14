<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = isset($_POST['title']) ? $_POST['title'] : '';
    $description = isset($_POST['description']) ? $_POST['description'] : '';
    $project_id = isset($_POST['project_id']) ? intval($_POST['project_id']) : 0;
    $status = isset($_POST['status']) ? $_POST['status'] : 'todo';
    $priority = isset($_POST['priority']) ? $_POST['priority'] : 'low';
    $due_date = isset($_POST['due_date']) ? $_POST['due_date'] : null;
    $tags = isset($_POST['tags']) ? $_POST['tags'] : '';

    if (empty($title) || empty($project_id)) {
        echo json_encode(['status' => 'error', 'message' => 'Title and project ID are required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare(
            "INSERT INTO tasks (title, description, project_id, status, priority, due_date, tags) 
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        
        $stmt->execute([
            $title,
            $description,
            $project_id,
            $status,
            $priority,
            $due_date,
            $tags
        ]);
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Task added successfully',
            'task_id' => $pdo->lastInsertId()
        ]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error creating task: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}
