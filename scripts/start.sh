#!/bin/sh

echo "Waiting for PostgreSQL to be ready..."
while ! nc -z postgres 5432; do
  sleep 1
done

echo "Waiting for Redis to be ready..."
while ! nc -z redis 6379; do
  sleep 1
done

echo "Starting application..."
node dist/src/main.js