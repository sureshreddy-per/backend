#!/bin/bash

# Create SSL directory if it doesn't exist
mkdir -p ssl

# Generate self-signed certificate
openssl req -x509 \
    -newkey rsa:4096 \
    -keyout ssl/privkey.pem \
    -out ssl/fullchain.pem \
    -days 365 \
    -nodes \
    -subj "/CN=localhost"

# Generate chain file (same as fullchain for self-signed)
cp ssl/fullchain.pem ssl/chain.pem

# Set proper permissions
chmod 644 ssl/*.pem 