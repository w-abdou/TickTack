<?php
require_once 'db.php';

try {
    // Create cards table
    $sql = "CREATE TABLE IF NOT EXISTS cards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('todo', 'in_progress', 'completed') DEFAULT 'todo',
        project_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )";
    
    $pdo->exec($sql);
    echo "Cards table created successfully\n";
    
} catch (PDOException $e) {
    die("Error creating cards table: " . $e->getMessage());
}
