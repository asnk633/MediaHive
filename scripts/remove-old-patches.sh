#!/bin/bash

# scripts/remove-old-patches.sh
# Script to safely remove all old patch files

echo "Removing old patch files..."

# Remove all mX-*.patch files
rm -f mX-*.patch*
rm -f *.patch
rm -f *.work
rm -f *.orig

echo "✅ Old patch files removed successfully!"