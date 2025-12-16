#!/bin/bash

# Test script to generate sample errors for testing the ingest command
echo "Starting test application..."
sleep 1

echo "Application initialized successfully" >&1

# Generate some errors
echo "ERROR: Database connection failed" >&2
sleep 0.5

echo "WARNING: API rate limit approaching" >&2
sleep 0.5

echo "ERROR: Null pointer exception at line 42" >&2
sleep 0.5

echo "Processing user request..." >&1

echo "CRITICAL: Out of memory error" >&2
sleep 0.5

echo "ERROR: Failed to parse JSON response" >&2
sleep 0.5

echo "Request completed" >&1

echo "ERROR: Timeout connecting to service" >&2
sleep 0.5

echo "Application shutting down..."
