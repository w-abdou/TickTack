<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

require_once 'db.php';

try {
    $stmt = $pdo->query("SELECT * FROM projects ORDER BY created_at DESC");
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($projects);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error fetching projects: ' . $e->getMessage()]);
}
