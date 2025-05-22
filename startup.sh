#!/bin/bash
# This script sets up and runs the Personal Budget Tracker application.

echo "Starting Personal Budget Tracker Application Setup..."

# Ensure the script exits on any error
set -e

# If the script needs to be run from its own directory (e.g., if not run from project root),
# uncomment the following lines. This makes the script more robust to invocation location.
# SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
# cd "$SCRIPT_DIR" || exit

echo "Ensuring Python 3 pip is available and up-to-date..."
# Ensure pip for Python 3 is available and upgrade it.
# Using python3 explicitly ensures the correct Python version is used.
python3 -m ensurepip --upgrade
python3 -m pip install --upgrade pip

echo "Installing Python dependencies from requirements.txt..."
python3 -m pip install -r requirements.txt

# The Flask application (app.py) is configured to initialize the database
# automatically on startup using init_db() from database.py.

echo "Starting Flask development server on port 9000..."
# The app.py is configured to run on 0.0.0.0:9000.
# Using python3 explicitly to run the application.
python3 app.py

echo "Application startup script finished.
