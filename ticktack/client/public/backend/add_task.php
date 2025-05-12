<?php
// add_task.php
include 'db.php'; 

// Get data from frontend
$title = $_POST['title'];
$description = $_POST['description'];
$project_id = $_POST['project_id']; 

// Insert task into the database
$query = "INSERT INTO tasks (title, description, project_id, status) VALUES ('$title', '$description', '$project_id', 'todo')";
if (mysqli_query($conn, $query)) {
    echo json_encode(['status' => 'success', 'message' => 'Task added successfully!']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to add task!']);
}

mysqli_close($conn);
?>
