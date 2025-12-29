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
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", "https://openrouter.ai"]
        }
    }
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

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

app.get('/install', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'install-extension.html'));
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

// Extension version check endpoint
app.get('/api/extension-version', (req, res) => {
    res.json({
        version: '1.0.0', // Update this when you release new versions
        downloadUrl: `${process.env.SITE_URL || 'http://localhost:3000'}/install`,
        releaseNotes: 'Latest version with improved AI responses and bug fixes.',
        required: false // Set to true for critical updates
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
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

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} to view the app`);
});