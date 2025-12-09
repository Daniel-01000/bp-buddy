#!/bin/bash
cd "$(dirname "$0")"
echo "🚀 Starting BP Buddy Backend on port 3001..."
PORT=3001 node server-express.js
