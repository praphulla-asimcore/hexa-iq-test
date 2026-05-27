#!/bin/bash

# Hexa IQ Test - Installation Script

echo "======================================"
echo "Hexa IQ Test - Complete Setup"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Backend Setup
echo "📦 Installing Backend Dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"
echo ""

# Frontend Setup
echo "📦 Installing Frontend Dependencies..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"
echo ""

# Copy Hexa Logo to public folder
echo "📸 Copying Hexa Logo..."
if [ -f "../Hexa Logo.png" ]; then
    cp "../Hexa Logo.png" "public/hexa-logo.png"
    echo "✅ Hexa Logo copied"
else
    echo "⚠️  Hexa Logo not found. Make sure Hexa Logo.png exists in the root directory"
fi

echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "To start the application:"
echo "1. Terminal 1 - Backend:"
echo "   cd backend && npm start"
echo ""
echo "2. Terminal 2 - Frontend:"
echo "   cd frontend && npm start"
echo ""
echo "Then open: http://localhost:3000"
echo "Admin Email: praphulla@hexamatics.com"
echo "Admin Password: Asim@1212"
echo ""
