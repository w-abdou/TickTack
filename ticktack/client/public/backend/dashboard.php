<?php
header('Content-Type: application/json');
include('db.php'); 

$sql = "SELECT * FROM projects"; 
$result = $conn->query($sql);

$projects = array();
while ($row = $result->fetch_assoc()) {
    $projects[] = $row;
}

echo json_encode($projects);

$conn->close();
?>
