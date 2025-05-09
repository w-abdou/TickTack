<?php
// Database configuration
$host = 'localhost';         // Host name (for XAMPP, use 'localhost')
$username = 'root';          // Default MySQL username for XAMPP
$password = '';              // Default password is empty for XAMPP
$dbname = 'ticktack'; // Your database name (replace with your actual database name)

// Create a connection
$conn = new mysqli($host, $username, $password, $dbname);

// Check the connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
echo "Connected successfully to the database.";
?>
