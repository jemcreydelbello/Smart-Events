<?php
require_once 'db_config.php';

echo "<h2>Updating Test Users with Company, Job Title, and Phone</h2>";

// Data to update
$userData = [
    'Guest 4' => ['company' => 'Company 4', 'job_title' => 'Coordinator', 'phone' => '555-01004'],
    'Guest 5' => ['company' => 'Company 5', 'job_title' => 'Specialist', 'phone' => '555-01005'],
    'Guest 6' => ['company' => 'Company 1', 'job_title' => 'Manager', 'phone' => '555-01001'],
    'Guest 7' => ['company' => 'Company 2', 'job_title' => 'Director', 'phone' => '555-01002'],
    'Guest 8' => ['company' => 'Company 3', 'job_title' => 'Analyst', 'phone' => '555-01003'],
    'Guest 9' => ['company' => 'Company 9', 'job_title' => 'Consultant', 'phone' => '555-01009'],
    'Guest 10' => ['company' => 'Company 10', 'job_title' => 'Engineer', 'phone' => '555-01010'],
    'Guest 11' => ['company' => 'Company 11', 'job_title' => 'Developer', 'phone' => '555-01011'],
];

$updateQuery = "UPDATE users SET company = ?, job_title = ?, phone = ? WHERE full_name = ?";
$stmt = $conn->prepare($updateQuery);

foreach ($userData as $name => $data) {
    $stmt->bind_param('ssss', $data['company'], $data['job_title'], $data['phone'], $name);
    
    if ($stmt->execute()) {
        echo "<p>✓ Updated {$name}: {$data['company']} | {$data['job_title']} | {$data['phone']}</p>";
    } else {
        echo "<p>✗ Failed to update {$name}: " . $stmt->error . "</p>";
    }
}

echo "<hr>";
echo "<h3><a href='admin/event-details.html?id=1'>View Event Details (Attendees)</a></h3>";
?>
