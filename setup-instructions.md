# Setup Instructions

## 1. Install Node.js

### Option A: Using Homebrew (Recommended for macOS)
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

### Option B: Download from Official Website
1. Go to [nodejs.org](https://nodejs.org/)
2. Download the LTS version for macOS
3. Run the installer

## 2. Get OpenRouter API Key
1. Go to [openrouter.ai](https://openrouter.ai/)
2. Sign up for a free account
3. Get your API key from the dashboard

## 3. Setup the Project
```bash
# Install dependencies
npm install

# Edit the .env file and add your API key
# Replace "your_openrouter_api_key_here" with your actual API key
nano .env

# Start the server
npm start
```

## 4. Access the Website
Open your browser and go to: http://localhost:3000

## Troubleshooting

If you see "Failed to fetch":
1. Make sure the server is running (you should see "Server running on port 3000")
2. Check that you're accessing http://localhost:3000 (not just opening the HTML file)
3. Verify your API key is correctly set in the .env file
4. Check the browser console for more detailed error messages

## Quick Test
After setup, you can test if everything works:
1. Paste any tweet in the text area
2. Click "Generate Reply"
3. You should see a generated response