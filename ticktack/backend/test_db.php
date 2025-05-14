<?php
header('Content-Type: application/json');
require_once 'db.php';

try {
    // Test database connection
    $pdo->query('SELECT 1');
    echo "Database connection successful\n";

    // Check if tables exist
    $tables = ['users', 'projects', 'tasks'];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "Table $table exists\n";
            
            // Show table structure
            $stmt = $pdo->query("DESCRIBE $table");
            echo "Structure of $table:\n";
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                echo json_encode($row) . "\n";
            }
        } else {
            echo "Table $table does not exist\n";
        }
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
