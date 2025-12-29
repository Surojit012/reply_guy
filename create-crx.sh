#!/bin/bash

echo "🔥 Creating CRX file for direct installation"
echo "==========================================="

# Check if we have the extension folder
if [ ! -d "extension" ]; then
    echo "❌ Extension folder not found"
    exit 1
fi

echo "📦 Creating CRX package..."

# Method 1: Use Chrome to create CRX (recommended)
echo ""
echo "🎯 RECOMMENDED METHOD:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode' (top right toggle)"
echo "3. Click 'Pack extension'"
echo "4. Select the 'extension' folder"
echo "5. Leave 'Private key file' empty for first time"
echo "6. Click 'Pack Extension'"
echo "7. Chrome will create:"
echo "   - extension.crx (the installable file)"
echo "   - extension.pem (private key - keep this safe!)"
echo "8. Move the .crx file to public/ folder"
echo ""

# Method 2: Command line (if available)
if command -v google-chrome &> /dev/null; then
    echo "🔧 ALTERNATIVE: Command line method"
    echo "google-chrome --pack-extension=./extension --pack-extension-key=./extension.pem"
    echo ""
fi

echo "📋 After creating CRX:"
echo "1. Move extension.crx to public/reply-guy-extension.crx"
echo "2. Keep extension.pem safe (needed for updates)"
echo "3. Test installation at http://localhost:3000/install"
echo ""

echo "🚀 Your extension will be installable directly from your website!"
echo "No Chrome Web Store fees required! 🎉"