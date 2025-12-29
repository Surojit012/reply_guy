#!/bin/bash

# Tweet Reply Generator - Startup Script

echo "🐦 Starting Tweet Reply Generator..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file and add your OpenRouter API key:"
    echo "   OPENROUTER_API_KEY=your_api_key_here"
    echo ""
    echo "Get your free API key from: https://openrouter.ai/"
    exit 1
fi

# Check if API key is set
if ! grep -q "OPENROUTER_API_KEY=sk-" .env 2>/dev/null; then
    echo "⚠️  OpenRouter API key not found in .env file."
    echo "📝 Please edit .env file and add your API key:"
    echo "   OPENROUTER_API_KEY=your_api_key_here"
    echo ""
    echo "Get your free API key from: https://openrouter.ai/"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🚀 Starting server..."
echo "📱 Open http://localhost:3000 in your browser"
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

npm start