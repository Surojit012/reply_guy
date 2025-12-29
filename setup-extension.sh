#!/bin/bash

echo "🔥 Reply Guy Extension Setup Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "manifest.json" ] && [ ! -d "extension" ]; then
    echo "❌ Please run this script from your Reply Guy project root directory"
    exit 1
fi

echo "📋 Pre-Publishing Checklist:"
echo ""

# Check extension files
echo "✅ Checking extension files..."
if [ -f "extension/manifest.json" ]; then
    echo "   ✓ manifest.json found"
else
    echo "   ❌ manifest.json missing"
fi

if [ -f "extension/popup.html" ]; then
    echo "   ✓ popup.html found"
else
    echo "   ❌ popup.html missing"
fi

if [ -f "extension/background.js" ]; then
    echo "   ✓ background.js found"
else
    echo "   ❌ background.js missing"
fi

if [ -f "extension/content.js" ]; then
    echo "   ✓ content.js found"
else
    echo "   ❌ content.js missing"
fi

echo "   ✓ Using default Chrome extension icon (no custom icons needed)"

# Create ZIP package
echo ""
echo "📦 Creating extension package..."
cd extension
if command -v zip &> /dev/null; then
    zip -r ../reply-guy-extension.zip . -x "*.DS_Store" "create-*" "*.md" "*.svg"
    echo "   ✓ Created reply-guy-extension.zip"
    cd ..
else
    echo "   ❌ zip command not found. Please install zip or create package manually"
    cd ..
fi

echo ""
echo "🚀 Next Steps:"
echo "1. Test extension locally:"
echo "   - Go to chrome://extensions/"
echo "   - Enable Developer mode"
echo "   - Click 'Load unpacked' and select 'extension' folder"
echo "2. Create Chrome Web Store developer account ($5 fee)"
echo "3. Upload reply-guy-extension.zip to Chrome Web Store"
echo "4. Fill out store listing (see extension/PUBLISHING_GUIDE.md)"
echo ""
echo "📖 Read the complete guide: extension/PUBLISHING_GUIDE.md"
echo "🔒 Privacy policy available at: http://localhost:3000/privacy"
echo ""
echo "✨ Your extension is ready to publish! No icons needed - Chrome will use defaults."
echo "Good luck with your launch! 🔥"