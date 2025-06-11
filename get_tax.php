<?php

header('Content-Type: application/json'); // Set content type for JSON response

// 1. Read and Validate JSON Input from POST body
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Check if JSON was valid
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Invalid JSON in request body.']);
    exit();
}

$county = $data['county'] ?? '';
$state = $data['state'] ?? '';

// Basic input validation: check if required parameters are present and not empty
if (empty($county) || empty($state)) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Missing "county" or "state" parameters.']);
    exit(); // Stop script execution
}

// 2. Database Interaction
try {
    // It's generally good practice to store sensitive info like database paths
    // outside the web root or in environment variables. For this example, it's inline.
    $dbPath = 'sqlite:taxrates.db';
    $pdo = new PDO($dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // Set error mode to throw exceptions

    $stmt = $pdo->prepare(
        "SELECT tax_rate FROM sales_tax WHERE LOWER(county) = LOWER(:county) AND LOWER(state) = LOWER(:state)"
    );
    $stmt->execute([
        ':county' => $county,
        ':state' => $state
    ]);

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    // 3. Prepare and Send Response
    if ($row) {
        // Data found
        http_response_code(200); // OK
        echo json_encode(['tax' => (float)$row['tax_rate']]); // Ensure tax is a float
    } else {
        // No matching data found for the given county/state
        http_response_code(404); // Not Found
        echo json_encode(['tax' => null, 'message' => "Sales tax data not found for $county in $state"]);
    }

} catch (PDOException $e) {
    // 4. Handle Database Errors
    http_response_code(500); // Internal Server Error
    // Log the actual error message for debugging, but don't expose it to the client
    error_log("Database error in get_tax.php: " . $e->getMessage());
    echo json_encode(['error' => 'A server error occurred. Please try again later.']);
} catch (Exception $e) {
    // 5. Catch any other unexpected errors
    http_response_code(500); // Internal Server Error
    error_log("Unexpected error in get_tax.php: " . $e->getMessage());
    echo json_encode(['error' => 'An unexpected server error occurred.']);
}

?>