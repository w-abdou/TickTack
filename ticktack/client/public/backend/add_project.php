<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = isset($_POST['name']) ? $_POST['name'] : '';
    $description = isset($_POST['description']) ? $_POST['description'] : '';

    if (empty($name)) {
        echo json_encode(['status' => 'error', 'message' => 'Project name is required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO projects (name, description) VALUES (?, ?)");
        $stmt->execute([$name, $description]);
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Project created successfully',
            'project_id' => $pdo->lastInsertId()
        ]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error creating project: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}
