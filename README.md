# Tweet Reply Generator

A full-stack AI-powered web application that analyzes tweets and generates personalized replies. Built with secure backend API handling and rate limiting for public use.

## Features

- **Tweet Analysis**: AI analyzes the original tweet's purpose, tone, and context
- **Customizable Replies**: Control length, writing style, tone, and emoji usage
- **Dark Theme**: Beautiful gradient design optimized for dark mode
- **Secure Backend**: API key stored safely on server, not exposed to users
- **Rate Limiting**: Built-in protection against abuse (10 requests/minute per IP)
- **Responsive Design**: Works on desktop and mobile devices
- **Production Ready**: Includes security headers, CORS, and error handling

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

## Usage

1. **Paste Tweet**: Copy and paste the tweet you want to reply to
2. **Analyze (Optional)**: Click "Analyze Tweet" to understand the context
3. **Set Preferences**: Choose your reply length, style, tone, and emoji preference
4. **Generate**: Click "Generate Reply" to create your response
5. **Copy & Use**: Copy the generated reply to use on Twitter

## Customization Options

- **Length**: Short (1-2 sentences), Medium (2-3 sentences), Long (3-4 sentences)
- **Style**: Casual, Professional, Friendly, Witty, Supportive, Informative
- **Tone**: Neutral, Positive, Enthusiastic, Empathetic, Humorous, Thoughtful
- **Emojis**: Toggle emoji inclusion on/off

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
- `POST /api/analyze` - Analyze tweet content
- `POST /api/generate-reply` - Generate personalized replies
- `GET /api/health` - Health check endpoint

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