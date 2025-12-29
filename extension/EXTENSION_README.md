# Reply Guy Chrome Extension

Transform your Reply Guy website into a powerful Chrome extension for seamless Twitter integration!

## 🚀 Features

- **One-Click Access**: Generate replies directly from Twitter/X
- **Auto-Fill Tweet Text**: Extract tweet content automatically
- **Paste to Twitter**: Insert generated replies directly into Twitter
- **Persistent Settings**: Your preferences and API key are saved
- **Twitter Integration**: Reply Guy buttons appear on every tweet
- **Compact Design**: Optimized popup interface

## 📦 Installation

### Method 1: Load as Unpacked Extension (Development)

1. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

2. **Load the Extension**
   - Click "Load unpacked"
   - Select the `reply_guy` folder containing `manifest.json`

3. **Setup API Key**
   - Click the Reply Guy extension icon
   - Enter your OpenRouter API key
   - Your settings will be saved automatically

### Method 2: Create Extension Package (Distribution)

1. **Create Icons** (Required)
   - Open `create-icons.html` in your browser
   - It will automatically download icon files
   - Move the downloaded PNG files to the `icons/` folder

2. **Package Extension**
   - Go to `chrome://extensions/`
   - Click "Pack extension"
   - Select the `reply_guy` folder
   - This creates a `.crx` file for distribution

## 🔧 Setup Requirements

1. **OpenRouter API Key**
   - Sign up at [openrouter.ai](https://openrouter.ai/)
   - Get your free API key
   - Enter it in the extension popup

2. **Permissions**
   - The extension needs access to Twitter/X websites
   - Storage permission for saving settings
   - These are automatically requested during installation

## 🎯 How to Use

### Method 1: Extension Popup
1. **Click the Reply Guy icon** in your browser toolbar
2. **Paste tweet text** or use "Auto-fill from Twitter"
3. **Choose your preferences** (length, style, tone, emojis)
4. **Generate reply** and copy or paste directly to Twitter

### Method 2: Twitter Integration
1. **Visit Twitter/X** - you'll see 🔥 buttons on tweets
2. **Click the 🔥 button** on any tweet
3. **Open Reply Guy extension** to generate your reply
4. **Use "Paste to Twitter"** to insert the reply

## ⚙️ Extension Structure

```
reply_guy/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── content.js            # Twitter page integration
├── content.css           # Twitter button styles
├── background.js         # Background service worker
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── create-icons.html     # Icon generator tool
```

## 🔒 Privacy & Security

- **API Key Storage**: Stored securely in Chrome's sync storage
- **No Data Collection**: Extension doesn't collect or transmit user data
- **Local Processing**: All preferences stored locally
- **Secure API Calls**: Direct communication with OpenRouter API

## 🛠️ Development

### Testing Changes
1. Make your changes to the extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Reply Guy extension
4. Test your changes

### Adding Features
- **Popup Interface**: Edit `popup.html`, `popup.css`, `popup.js`
- **Twitter Integration**: Edit `content.js`, `content.css`
- **Background Tasks**: Edit `background.js`
- **Permissions**: Update `manifest.json`

## 🚀 Distribution

### Chrome Web Store (Recommended)
1. Create a developer account at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Package your extension
3. Upload and submit for review
4. Once approved, users can install directly from the store

### Manual Distribution
1. Package the extension using Chrome's "Pack extension" feature
2. Share the `.crx` file
3. Users need to enable "Developer mode" to install

## 🎨 Customization

### Changing Colors
- Edit the CSS gradient values in `popup.css` and `content.css`
- Update the icon colors in `create-icons.html`

### Adding New Features
- **New Preferences**: Add to `popup.html` and save in `popup.js`
- **Twitter Features**: Extend `content.js` for more Twitter integration
- **API Features**: Add new endpoints in `popup.js`

## 🐛 Troubleshooting

### Extension Not Loading
- Check that `manifest.json` is valid JSON
- Ensure all referenced files exist
- Check Chrome's extension error console

### Twitter Integration Not Working
- Refresh the Twitter page after installing
- Check if Twitter has updated their DOM structure
- Update selectors in `content.js` if needed

### API Errors
- Verify your OpenRouter API key is correct
- Check if the free model is still available
- Try switching to a different model in `popup.js`

## 📱 Browser Compatibility

- **Chrome**: Full support (Manifest V3)
- **Edge**: Compatible with Chromium-based Edge
- **Firefox**: Requires manifest conversion for Firefox add-ons
- **Safari**: Requires Safari extension conversion

Your Reply Guy extension is now ready to help users generate perfect Twitter replies with just one click! 🔥