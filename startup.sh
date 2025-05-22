#!/bin/bash
# This script sets up and runs the Personal Budget Tracker application.

echo "Starting Personal Budget Tracker Application Setup..."

# Ensure the script exits on any error
set -e

# Navigate to the directory where the script is located, if necessary.
# This assumes the script is run from the project root.
# APP_DIR=$(dirname "$0")
# cd "$APP_DIR" || exit

echo "Installing Python dependencies from requirements.txt..."
# Ensure pip is available and upgrade it if necessary for compatibility
python -m ensurepip --upgrade
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# The Flask application (app.py) is configured to initialize the database
# automatically on startup using init_db() from database.py.

echo "Starting Flask development server on port 9000..."
# The app.py is configured to run on 0.0.0.0:9000
python app.py

echo "Application startup script finished."
