#!/bin/sh
set -e

echo "Running database migrations..."
if /app/bin/cli migrate; then
    echo "Migrations completed successfully"
else
    echo "ERROR: Migrations failed"
    exit 1
fi

echo "Starting server..."
exec /app/bin/server
