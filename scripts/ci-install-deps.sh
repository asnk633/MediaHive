#!/bin/bash
# scripts/ci-install-deps.sh
# Install dependencies for CI environment

set -e

echo "Installing system dependencies..."

# Update package list
sudo apt-get update

# Install FFmpeg for media analysis
sudo apt-get install -y ffmpeg

# Install Python and pip
sudo apt-get install -y python3 python3-pip

# Install Python dependencies for face recognition
echo "Installing Python dependencies..."
cd scripts
pip3 install -r requirements.txt

echo "System dependencies installed successfully!"

# Verify installations
echo "Verifying installations..."
ffmpeg -version
python3 --version
pip3 --version

echo "All dependencies verified!"