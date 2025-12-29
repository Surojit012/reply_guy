#!/bin/bash

echo "🚀 Reply Guy Production Setup"
echo "============================"

# Get production URL from user
read -p "Enter your Vercel app URL (e.g., https://reply-guy.vercel.app): " PRODUCTION_URL

if [ -z "$PRODUCTION_URL" ]; then
    echo "❌ Production URL is required"
    exit 1
fi

echo ""
echo "🔧 Updating extension files for production..."

# Update popup.js
sed -i.bak "s|this\.serverUrl = 'http://localhost:3000'|this.serverUrl = '$PRODUCTION_URL'|g" extension/popup.js
echo "✅ Updated extension/popup.js"

# Update update-checker.js
sed -i.bak "s|this\.updateCheckUrl = 'http://localhost:3000/api/extension-version'|this.updateCheckUrl = '$PRODUCTION_URL/api/extension-version'|g" extension/update-checker.js
echo "✅ Updated extension/update-checker.js"

# Update manifest.json host permissions
sed -i.bak "s|\"http://localhost:3000/\*\"|\"$PRODUCTION_URL/*\"|g" extension/manifest.json
echo "✅ Updated extension/manifest.json"

# Clean up backup files
rm -f extension/*.bak

echo ""
echo "📦 Creating production extension package..."
./setup-extension.sh

echo ""
echo "🎯 Next Steps:"
echo "1. Deploy to Vercel:"
echo "   vercel --prod"
echo ""
echo "2. Set environment variables in Vercel:"
echo "   OPENROUTER_API_KEY=your_api_key"
echo "   NODE_ENV=production"
echo "   SITE_URL=$PRODUCTION_URL"
echo ""
echo "3. Recreate CRX file:"
echo "   - Go to chrome://extensions/"
echo "   - Pack extension with your existing .pem key"
echo "   - Move extension.crx to public/reply-guy-extension.crx"
echo ""
echo "4. Test your production deployment:"
echo "   $PRODUCTION_URL"
echo ""
echo "🔥 Your Reply Guy is ready for production!"