#!/bin/bash

# Script to check a file against VirusTotal API
# Requires: curl, jq
# Environment variable: virustotal_apikey

set -e

# Configuration
FILE_PATH="${VIRUS_TOTAL_FILE:-vision-start.zip}"
API_KEY="${virustotal_apikey}"
BASE_URL="https://www.virustotal.com/vtapi/v2"

# Check if API key is set
if [ -z "$API_KEY" ]; then
    echo "Error: virustotal_apikey environment variable is not set"
    exit 1
fi

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
    echo "Error: File $FILE_PATH not found"
    exit 1
fi

# Check if required tools are available
if ! command -v curl &> /dev/null; then
    echo "Error: curl is required but not installed"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed"
    exit 1
fi

echo "Uploading $FILE_PATH to VirusTotal for analysis..."

# Upload file to VirusTotal
UPLOAD_RESPONSE=$(curl -s -X POST \
    -F "apikey=$API_KEY" \
    -F "file=@$FILE_PATH" \
    "$BASE_URL/file/scan")

# Extract scan_id from response
SCAN_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.scan_id')

if [ "$SCAN_ID" == "null" ] || [ -z "$SCAN_ID" ]; then
    echo "Error: Failed to upload file or get scan ID"
    echo "Response: $UPLOAD_RESPONSE"
    exit 1
fi

echo "File uploaded successfully. Scan ID: $SCAN_ID"
echo "Waiting for analysis to complete..."

# Wait for analysis to complete and get results
MAX_ATTEMPTS=60
ATTEMPT=0
SLEEP_INTERVAL=10

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    echo "Checking analysis status (attempt $((ATTEMPT + 1))/$MAX_ATTEMPTS)..."

    # Get scan report
    REPORT_RESPONSE=$(curl -s -X POST \
        -d "apikey=$API_KEY" \
        -d "resource=$SCAN_ID" \
        "$BASE_URL/file/report")

    # Check if analysis is complete
    RESPONSE_CODE=$(echo "$REPORT_RESPONSE" | jq -r '.response_code')

    if [ "$RESPONSE_CODE" == "1" ]; then
        # Analysis complete
        echo "Analysis completed!"

        # Extract results
        POSITIVES=$(echo "$REPORT_RESPONSE" | jq -r '.positives')
        TOTAL=$(echo "$REPORT_RESPONSE" | jq -r '.total')
        PERMALINK=$(echo "$REPORT_RESPONSE" | jq -r '.permalink')

        echo "Analysis URL: $PERMALINK"
        echo "Detection ratio: $POSITIVES/$TOTAL"

        # Check if file is safe
        if [ "$POSITIVES" -eq 0 ]; then
            echo "✅ File is clean (no threats detected)"
            exit 0
        else
            echo "❌ File contains threats ($POSITIVES detections out of $TOTAL scanners)"
            exit 1
        fi
    elif [ "$RESPONSE_CODE" == "0" ]; then
        # File not found or analysis not complete yet
        echo "Analysis still in progress..."
    elif [ "$RESPONSE_CODE" == "-2" ]; then
        # Still queued for analysis
        echo "File still queued for analysis..."
    else
        echo "Unexpected response code: $RESPONSE_CODE"
        echo "Response: $REPORT_RESPONSE"
        exit 1
    fi

    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        sleep $SLEEP_INTERVAL
    fi
done

echo "Timeout: Analysis did not complete within expected time"
exit 1