#!/usr/bin/env bash
# Exit immediately on error
set -e

echo "=== 1. Installing Backend Dependencies ==="
cd backend
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..

echo "=== 2. Building Frontend Application ==="
cd frontend
npm install
npm run build
cd ..

echo "=== 3. Build Completed Successfully ==="
