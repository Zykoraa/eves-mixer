#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "🎵 Starting Eve's Mixer..."
echo "Opening browser at http://localhost:5173"

npx vite --open
