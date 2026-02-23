#!/bin/bash
# Test coordinator creation via curl
cd /c/xampp/htdocs/Smart-Events

TEST_TIME=$(date +%s)
EMAIL="testcoord${TEST_TIME}@example.com"

echo "=== Testing Coordinator Creation ==="
echo "Email: $EMAIL"
echo ""

# Test with JSON
curl -X POST \
  "http://localhost/Smart-Events/api/coordinators.php?action=create" \
  -H "Content-Type: application/json" \
  -d "{
    \"coordinator_name\": \"Test Coordinator $TEST_TIME\",
    \"email\": \"$EMAIL\",
    \"contact_number\": \"1234567890\",
    \"company\": \"TestCorp\",
    \"job_title\": \"Test Manager\"
  }" \
  2>/dev/null | python3 -m json.tool

echo ""
echo "Exit code: $?"
