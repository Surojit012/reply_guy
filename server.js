const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false // Disable CSP temporarily to fix JavaScript issues
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const strictLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 AI requests per minute
    message: {
        error: 'Rate limit exceeded. Please wait before making another request.'
    }
});

app.use(limiter);

// Serve static files with error handling
app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } catch (error) {
        console.error('Error serving index.html:', error);
        res.status(500).send('Server Error: Unable to load main page');
    }
});

app.get('/privacy', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
    } catch (error) {
        console.error('Error serving privacy.html:', error);
        res.status(500).send('Server Error: Unable to load privacy page');
    }
});

app.get('/install', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'install-extension.html'));
    } catch (error) {
        console.error('Error serving install-extension.html:', error);
        res.status(500).send('Server Error: Unable to load installation page');
    }
});

app.get('/test.html', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'test.html'));
    } catch (error) {
        console.error('Error serving test.html:', error);
        res.status(500).send('Server Error: Unable to load test page');
    }
});

// Serve other static files
app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'script.js'));
});

app.get('/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'styles.css'));
});

app.get('/extension-installer.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'extension-installer.js'));
});

// Serve extension files for download
app.get('/reply-guy-extension.zip', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'reply-guy-extension.zip');
    res.download(filePath, 'reply-guy-extension.zip');
});

app.get('/reply-guy-extension.crx', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'reply-guy-extension.crx');
    res.download(filePath, 'reply-guy-extension.crx');
});

// AI request handler
async function makeOpenRouterRequest(messages, maxTokens = 500) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
            'X-Title': 'Tweet Reply Generator'
        },
        body: JSON.stringify({
            model: 'mistralai/mistral-7b-instruct:free',
            messages: messages,
            max_tokens: maxTokens,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenRouter API Error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
        });
        throw new Error(errorData.error?.message || `API request failed: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Tweet analysis endpoint
app.post('/api/analyze', strictLimiter, async (req, res) => {
    try {
        const { tweet } = req.body;

        if (!tweet || tweet.trim().length === 0) {
            return res.status(400).json({ error: 'Tweet content is required' });
        }

        if (tweet.length > 2000) {
            return res.status(400).json({ error: 'Tweet content is too long' });
        }

        const messages = [
            {
                role: 'system',
                content: 'You are an expert at analyzing social media content. Analyze tweets to understand their purpose, tone, context, and suggest appropriate response strategies.'
            },
            {
                role: 'user',
                content: `Analyze this tweet and provide insights about:
1. Main purpose/intent
2. Tone and sentiment
3. Key topics/themes
4. Suggested response approach
5. Any context clues

Tweet: "${tweet}"`
            }
        ];

        const analysis = await makeOpenRouterRequest(messages, 300);
        
        res.json({ analysis });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ 
            error: 'Failed to analyze tweet. Please try again.' 
        });
    }
});

// Reply generation endpoint
app.post('/api/generate-reply', strictLimiter, async (req, res) => {
    try {
        const { tweet, preferences } = req.body;

        if (!tweet || tweet.trim().length === 0) {
            return res.status(400).json({ error: 'Tweet content is required' });
        }

        if (!preferences) {
            return res.status(400).json({ error: 'Reply preferences are required' });
        }

        if (tweet.length > 2000) {
            return res.status(400).json({ error: 'Tweet content is too long' });
        }

        const lengthGuide = {
            'ultra-short': 'under 10 words, extremely concise',
            short: '1-2 sentences, concise and direct',
            medium: '2-3 sentences, balanced detail',
            long: '3-4 sentences, comprehensive response'
        };

        const messages = [
            {
                role: 'system',
                content: `You are an expert at writing engaging Twitter replies. Create replies that are authentic, relevant, and match the requested style perfectly. Always stay respectful and constructive.`
            },
            {
                role: 'user',
                content: `Generate a Twitter reply to this tweet with these specifications:

Original Tweet: "${tweet}"

Reply Requirements:
- Length: ${lengthGuide[preferences.length] || lengthGuide.medium}
- Writing Style: ${preferences.style || 'casual'}
- Tone: ${preferences.tone || 'neutral'}
- Include Emojis: ${preferences.emoji ? 'Yes' : 'No'}

Make the reply engaging, relevant, and natural. Don't mention that you're following specifications - just write a great reply.`
            }
        ];

        const reply = await makeOpenRouterRequest(messages, 280);
        
        res.json({ reply });

    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate reply. Please try again.' 
        });
    }
});

// Chatbot FAQ endpoint
app.post('/api/chatbot', strictLimiter, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (message.length > 500) {
            return res.status(400).json({ error: 'Message is too long (max 500 characters)' });
        }

        const messages = [
            {
                role: 'system',
                content: `You are a helpful assistant for Reply Guy, an AI-powered Twitter reply generator. Answer questions about:

ABOUT REPLY GUY:
- Reply Guy is a free AI tool that generates personalized Twitter replies
- It analyzes tweets and creates replies based on user preferences (length, style, tone, emojis)
- Available as both a website and Chrome extension
- Uses AI to understand tweet context and generate appropriate responses

FEATURES:
- Tweet analysis to understand context and purpose
- Customizable reply length (ultra-short, short, medium, long)
- Multiple writing styles (casual, professional, friendly, witty, supportive, informative)
- Various tones (neutral, positive, enthusiastic, empathetic, humorous, thoughtful)
- Optional emoji inclusion
- Chrome extension for direct Twitter integration

INSTALLATION:
- Website: Just visit the site and start using
- Extension: Download ZIP file, extract, go to chrome://extensions/, enable developer mode, load unpacked
- No Chrome Web Store account needed - direct installation
- Free to use with rate limits (10 requests per minute)

USAGE:
- Paste tweet text into the input field
- Choose your preferences (length, style, tone)
- Click "Generate Reply" to create response
- Copy and paste to Twitter
- Extension users can auto-fill directly on Twitter

TECHNICAL:
- Uses OpenRouter API with Mistral AI model
- Secure backend handles API calls
- Rate limited for fair usage
- No user data stored
- Open source and safe

Keep answers concise, helpful, and friendly. If asked about something not related to Reply Guy, politely redirect to Reply Guy topics.`
            },
            {
                role: 'user',
                content: message
            }
        ];

        const response = await makeOpenRouterRequest(messages, 200);
        
        res.json({ response });

    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ 
            error: 'Sorry, I\'m having trouble right now. Please try again in a moment.' 
        });
    }
});
app.get('/api/extension-version', (req, res) => {
    res.json({
        version: '1.0.0', // Update this when you release new versions
        downloadUrl: `${process.env.SITE_URL || 'http://localhost:3000'}/install`,
        releaseNotes: 'Latest version with improved AI responses and bug fixes.',
        required: false // Set to true for critical updates
    });
});

// Debug endpoint for extension testing
app.get('/api/debug', (req, res) => {
    res.json({
        message: 'Extension debug endpoint working',
        timestamp: new Date().toISOString(),
        headers: req.headers,
        method: req.method,
        url: req.url
    });
});

app.post('/api/debug', (req, res) => {
    res.json({
        message: 'Extension POST debug endpoint working',
        timestamp: new Date().toISOString(),
        headers: req.headers,
        method: req.method,
        url: req.url,
        body: req.body
    });
});

// Health check endpoint with detailed status
app.get('/api/health', (req, res) => {
    const healthStatus = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        apiKey: process.env.OPENROUTER_API_KEY ? 'configured' : 'missing'
    };
    
    res.json(healthStatus);
});

// Extension download endpoint
app.get('/api/download-extension', (req, res) => {
    // Simple fallback - redirect to extension folder
    res.json({ 
        message: 'Extension files available',
        instructions: [
            '1. Download all files from /extension/ folder',
            '2. Go to chrome://extensions/',
            '3. Enable Developer mode',
            '4. Click "Load unpacked" and select the extension folder'
        ],
        files: [
            '/extension/manifest.json',
            '/extension/popup.html',
            '/extension/popup.css',
            '/extension/popup.js',
            '/extension/content.js',
            '/extension/content.css',
            '/extension/background.js',
            '/extension/EXTENSION_README.md'
        ]
    });
});

// Serve extension files statically
app.use('/extension', express.static('extension'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Validate environment variables on startup
function validateEnvironment() {
    const required = ['OPENROUTER_API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing);
        console.error('💡 Please check your Vercel environment variables');
        // Don't exit in production, just log the error
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    } else {
        console.log('✅ All required environment variables are configured');
    }
}

// Validate on startup
validateEnvironment();

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} to view the app`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⚡ API Key: ${process.env.OPENROUTER_API_KEY ? 'configured' : 'missing'}`);
});