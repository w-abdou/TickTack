<?php
require_once 'db.php';

// Get JSON data from the request
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['email']) || !isset($data['password'])) {
    echo json_encode(["success" => false, "message" => "Missing credentials"]);
    exit();
}

$email = $data['email'];
$password = $data['password'];

// Prepare SQL to get user by email
$sql = "SELECT * FROM users WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result && $result->num_rows === 1) {
    $user = $result->fetch_assoc();

    // Compare password exactly (replace with password_verify() if using hashes)
    if ($password === $user['password']) {
        echo json_encode(["success" => true, "username" => $user['username']]);
    } else {
        echo json_encode(["success" => false, "message" => "Incorrect password"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "User not found"]);
}

$conn->close();
?>
