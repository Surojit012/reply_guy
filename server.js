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
app.use(express.json({ limit: '50mb' }));
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

// Reply generation endpoint with crypto context awareness
app.post('/api/generate-reply', strictLimiter, async (req, res) => {
    try {
        const { tweet, preferences, persona, engagementMode, generateVariants } = req.body;

        if (!tweet || tweet.trim().length === 0) {
            return res.status(400).json({ error: 'Tweet content is required' });
        }

        if (!preferences) {
            return res.status(400).json({ error: 'Reply preferences are required' });
        }

        // Detect tweet context
        const tweetContext = detectTweetContext(tweet);
        
        // Build persona-specific prompt
        const personaPrompt = buildPersonaPrompt(persona || 'builder');
        const engagementPrompt = buildEngagementPrompt(engagementMode || 'neutral');
        
        const messages = [
            {
                role: 'system',
                content: `You are a crypto Twitter expert generating contextually aware replies. ${personaPrompt} ${engagementPrompt}

Tweet Context: ${tweetContext}

Reply Guidelines:
- Match the detected context and adjust tone accordingly
- Use crypto-native language and terminology
- Be authentic and add genuine value
- Keep replies concise and engaging
- Avoid generic responses`
            },
            {
                role: 'user',
                content: `Generate a ${preferences.style} reply to this crypto tweet:

"${tweet}"

Requirements:
- Length: ${preferences.length}
- Tone: ${preferences.tone}
- Include emojis: ${preferences.emoji ? 'Yes' : 'No'}
- Context: ${tweetContext}
- Persona: ${persona || 'builder'}
- Engagement Mode: ${engagementMode || 'neutral'}`
            }
        ];

        if (generateVariants) {
            // Generate 3 variants: Safe, Bold, Alpha
            const variants = await generateReplyVariants(messages, tweet, preferences, persona, engagementMode);
            res.json({ variants });
        } else {
            const reply = await makeOpenRouterRequest(messages, 280);
            res.json({ reply, context: tweetContext });
        }

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
// Quote tweet generation endpoint
app.post('/api/generate-quote', strictLimiter, async (req, res) => {
    try {
        const { tweet, persona, engagementMode } = req.body;

        if (!tweet || tweet.trim().length === 0) {
            return res.status(400).json({ error: 'Tweet content is required' });
        }

        const tweetContext = detectTweetContext(tweet);
        const personaPrompt = buildPersonaPrompt(persona || 'builder');
        
        const messages = [
            {
                role: 'system',
                content: `You are a crypto Twitter expert generating quote tweets. ${personaPrompt}

Generate a quote tweet with:
1. One strong, quotable line (hook/insight)
2. One supporting line (context/value-add)

Keep it concise, impactful, and crypto-native.`
            },
            {
                role: 'user',
                content: `Generate a quote tweet for this crypto tweet:

"${tweet}"

Context: ${tweetContext}
Persona: ${persona || 'builder'}
Mode: ${engagementMode || 'neutral'}

Format:
Line 1: [Strong hook/insight]
Line 2: [Supporting context]`
            }
        ];

        const quote = await makeOpenRouterRequest(messages, 200);
        res.json({ quote, context: tweetContext });

    } catch (error) {
        console.error('Quote generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate quote tweet. Please try again.' 
        });
    }
});

// Helper functions for crypto context detection
function detectTweetContext(tweet) {
    const text = tweet.toLowerCase();
    
    // Partnership/Launch indicators
    if (text.includes('partnership') || text.includes('launch') || text.includes('announcing') || 
        text.includes('excited to') || text.includes('proud to') || text.includes('introducing')) {
        return 'partnership_launch';
    }
    
    // Technical thread indicators
    if (text.includes('thread') || text.includes('1/') || text.includes('🧵') ||
        text.includes('technical') || text.includes('deep dive') || text.includes('breakdown')) {
        return 'technical_thread';
    }
    
    // Hot take indicators
    if (text.includes('unpopular opinion') || text.includes('hot take') || text.includes('controversial') ||
        text.includes('change my mind') || text.includes('fight me') || text.includes('🔥')) {
        return 'hot_take';
    }
    
    // Opinion indicators
    if (text.includes('i think') || text.includes('imo') || text.includes('in my opinion') ||
        text.includes('believe') || text.includes('feel like') || text.includes('personally')) {
        return 'opinion';
    }
    
    // Announcement indicators
    if (text.includes('announcement') || text.includes('news') || text.includes('update') ||
        text.includes('breaking') || text.includes('just dropped') || text.includes('live now')) {
        return 'announcement';
    }
    
    return 'general';
}

function buildPersonaPrompt(persona) {
    const personas = {
        builder: "You're a crypto builder focused on technology, development, and practical solutions. Use technical terms confidently but accessibly.",
        trader: "You're an active crypto trader focused on markets, price action, and trading opportunities. Use market terminology and be direct about risk/reward.",
        researcher: "You're a crypto researcher focused on fundamentals, analysis, and deep insights. Provide thoughtful, data-driven perspectives.",
        degen: "You're a crypto degen focused on high-risk plays, memes, and community vibes. Use casual language, memes, and show appetite for risk.",
        founder: "You're a crypto founder focused on building, scaling, and ecosystem development. Think strategically about growth and adoption.",
        community: "You're a community-focused crypto enthusiast. Emphasize collaboration, education, and bringing people together."
    };
    
    return personas[persona] || personas.builder;
}

function buildEngagementPrompt(mode) {
    const modes = {
        engagement_max: "Maximize engagement with hooks, questions, and light CTAs. Be bold and conversation-starting.",
        neutral: "Maintain balanced, safe engagement. Be helpful without being pushy.",
        signal_only: "Focus purely on insights and value. Be concise and signal-heavy with minimal fluff."
    };
    
    return modes[mode] || modes.neutral;
}

async function generateReplyVariants(baseMessages, tweet, preferences, persona, engagementMode) {
    const variants = {};
    
    // Safe variant
    const safeMessages = [...baseMessages];
    safeMessages[0].content += "\n\nGenerate a SAFE variant: Conservative, low-risk, broadly acceptable.";
    variants.safe = await makeOpenRouterRequest(safeMessages, 200);
    
    // Bold variant  
    const boldMessages = [...baseMessages];
    boldMessages[0].content += "\n\nGenerate a BOLD variant: Confident, opinionated, conversation-starting.";
    variants.bold = await makeOpenRouterRequest(boldMessages, 200);
    
    // Alpha variant
    const alphaMessages = [...baseMessages];
    alphaMessages[0].content += "\n\nGenerate an ALPHA variant: High-conviction, contrarian, thought-leadership.";
    variants.alpha = await makeOpenRouterRequest(alphaMessages, 200);
    
    return variants;
}

app.get('/api/extension-version', (req, res) => {
    res.json({
        version: '1.0.0', // Update this when you release new versions
        downloadUrl: `${process.env.SITE_URL || 'http://localhost:3000'}/install`,
        releaseNotes: 'Latest version with improved AI responses and bug fixes.',
        required: false // Set to true for critical updates
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