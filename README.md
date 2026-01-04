# Reply Guy - Crypto Twitter Engagement Tool

A context-aware crypto Twitter engagement tool that generates persona-based replies, variants, and quote tweets. Built with secure backend API and designed specifically for crypto Twitter interactions.

## 🚀 Features

### Core Crypto Features
- **Tweet Context Detection**: Automatically classifies tweets (announcement, technical thread, hot take, opinion, partnership/launch)
- **Crypto Personas**: Builder, Trader, Researcher, Degen, Founder, Community personas
- **Engagement Modes**: Engagement Max, Neutral, Signal-only modes
- **Reply Variants**: Generate Safe, Bold, and Alpha variants for each tweet
- **Quote Tweet Generator**: Create compelling quote tweets with hooks and supporting lines
- **Session Memory**: Saves user preferences locally

### Advanced Capabilities
- **Thread-Aware Mode**: Detects and responds appropriately to tweet threads
- **Crypto-Native Language**: Uses proper crypto terminology and context
- **Context-Aware Responses**: Adjusts tone and structure based on tweet type
- **Mobile-First Design**: Optimized for crypto Twitter's mobile-heavy usage

### Technical Features
- **Chrome Extension**: Direct Twitter integration with auto-fill and paste
- **Secure Backend**: API key stored safely on server
- **Rate Limiting**: 10 requests/minute protection
- **Responsive Design**: Works perfectly on all devices
- **Zero Chrome Store Cost**: Direct installation without store approval

## Quick Start

### 1. Installation
```bash
# Clone or download the project
npm install
```

### 2. Environment Setup
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your OpenRouter API key
OPENROUTER_API_KEY=your_api_key_here
PORT=3000
SITE_URL=http://localhost:3000
```

### 3. Get OpenRouter API Key
1. Sign up at [OpenRouter](https://openrouter.ai/)
2. Get your free API key from the dashboard
3. Add it to your `.env` file

### 4. Run the Application
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

Visit `http://localhost:3000` to use the app!

## 🎯 Usage

### Website (reply-guy-eta.vercel.app)
1. **Paste Tweet**: Copy any crypto tweet you want to engage with
2. **Choose Persona**: Select your crypto persona (Builder, Trader, etc.)
3. **Set Engagement Mode**: Choose your engagement strategy
4. **Generate Options**:
   - **Single Reply**: Generate one optimized reply
   - **3 Variants**: Get Safe, Bold, and Alpha versions
   - **Quote Tweet**: Create a compelling quote tweet
5. **Copy & Engage**: Use the generated content on Twitter

### Chrome Extension
1. **Install**: Download and install the extension directly
2. **Auto-Fill**: Click to extract tweet text from Twitter
3. **Generate**: Create replies without leaving Twitter
4. **Paste**: Directly insert replies into Twitter's reply box

## ⚙️ Crypto Engagement Settings

### Personas
- **🔨 Builder**: Technical focus, development-oriented responses
- **📈 Trader**: Market-focused, price action commentary
- **🔬 Researcher**: Data-driven, analytical insights
- **🎲 Degen**: High-risk plays, meme-friendly, casual
- **🚀 Founder**: Strategic thinking, ecosystem development
- **🤝 Community**: Collaborative, educational, inclusive

### Engagement Modes
- **⚖️ Neutral**: Balanced, safe engagement
- **🔥 Engagement Max**: Hooks, questions, conversation starters
- **🎯 Signal Only**: Pure insights, minimal fluff

### Customization Options
- **Length**: Ultra-short to long responses
- **Style**: Casual, Professional, Technical, Alpha, etc.
- **Tone**: Neutral, Confident, Contrarian, Bullish, Analytical
- **Emojis**: Toggle crypto-appropriate emojis

## Technical Architecture

### Backend (Node.js/Express)
- **Security**: Helmet.js for security headers, CORS protection
- **Rate Limiting**: 50 requests/15min general, 10 requests/min for AI endpoints
- **API Integration**: Secure OpenRouter API handling
- **Error Handling**: Comprehensive error responses and logging

### Frontend
- **Pure JavaScript**: No frameworks, lightweight and fast
- **Responsive Design**: CSS Grid and Flexbox
- **User Experience**: Loading states, error handling, success feedback
- **Accessibility**: Proper ARIA labels and keyboard navigation

### API Endpoints
- `POST /api/analyze` - Analyze tweet content and context
- `POST /api/generate-reply` - Generate crypto-aware replies with persona/mode
- `POST /api/generate-quote` - Generate quote tweets with hooks
- `GET /api/extension-version` - Extension update checking
- `GET /api/health` - Health check endpoint

## 🔧 Crypto Context Detection

The AI automatically detects tweet types:
- **Partnership/Launch**: Announcements, partnerships, product launches
- **Technical Thread**: Deep dives, technical explanations, tutorials
- **Hot Take**: Controversial opinions, debate starters
- **Opinion**: Personal views, market commentary
- **Announcement**: News, updates, breaking information
- **General**: Standard crypto discussion

## 🎨 Reply Variants Explained

- **🛡️ Safe**: Conservative, broadly acceptable, low-risk responses
- **🔥 Bold**: Confident, opinionated, conversation-starting replies
- **⚡ Alpha**: High-conviction, contrarian, thought-leadership content

## Deployment

### Environment Variables
```bash
OPENROUTER_API_KEY=your_openrouter_api_key
PORT=3000
NODE_ENV=production
SITE_URL=https://yourdomain.com
```

### Production Deployment
The app is ready for deployment on platforms like:
- **Heroku**: `git push heroku main`
- **Railway**: Connect your GitHub repo
- **DigitalOcean App Platform**: Deploy from GitHub
- **Vercel/Netlify**: For static hosting + serverless functions

## Security Features

- API key stored securely on backend
- Rate limiting to prevent abuse
- Input validation and sanitization
- Security headers (CSP, HSTS, etc.)
- CORS protection
- Request size limits

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers supported

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.