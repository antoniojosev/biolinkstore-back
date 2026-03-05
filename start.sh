#!/bin/sh
set -e

echo "Running database migrations..."
pnpm prisma migrate deploy

echo "Starting server..."
node dist/main
