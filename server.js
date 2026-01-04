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
                content: `You are a crypto Twitter expert. Generate a reply that strictly follows these requirements:

LENGTH: ${preferences.length === 'ultra-short' ? 'Maximum 10 words' : preferences.length === 'short' ? '1-2 sentences maximum' : preferences.length === 'medium' ? '2-3 sentences maximum' : '3-4 sentences maximum'}
EMOJIS: ${preferences.emoji ? 'Include relevant emojis' : 'NO EMOJIS - do not use any emojis at all'}
STYLE: ${preferences.style}
TONE: ${preferences.tone}
PERSONA: ${persona} perspective
ENGAGEMENT: ${engagementMode}

CRITICAL RULES:
- Respect the length limit strictly
- ${preferences.emoji ? 'Use emojis appropriately' : 'NEVER use emojis'}
- Return only the reply text, nothing else
- Be crypto-native and authentic`
            },
            {
                role: 'user',
                content: `Reply to: "${tweet}"`
            }
        ];

        if (generateVariants) {
            // Generate 3 variants: Safe, Bold, Alpha
            const variants = await generateReplyVariants(messages, tweet, preferences, persona, engagementMode);
            
            // Clean and enforce preferences for each variant
            const cleanedVariants = {
                safe: enforceUserPreferences(cleanAIResponse(variants.safe), preferences),
                bold: enforceUserPreferences(cleanAIResponse(variants.bold), preferences),
                alpha: enforceUserPreferences(cleanAIResponse(variants.alpha), preferences)
            };
            
            res.json({ variants: cleanedVariants });
        } else {
            const reply = await makeOpenRouterRequest(messages, 280);
            const cleanedReply = enforceUserPreferences(cleanAIResponse(reply), preferences);
            res.json({ reply: cleanedReply, context: tweetContext });
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
        console.log('Quote generation request:', req.body);
        const { tweet, persona, engagementMode, preferences } = req.body;

        if (!tweet || tweet.trim().length === 0) {
            return res.status(400).json({ error: 'Tweet content is required' });
        }

        const tweetContext = detectTweetContext(tweet);
        const personaPrompt = buildPersonaPrompt(persona || 'builder');
        
        const emojiInstruction = preferences?.emoji ? 'Include relevant emojis' : 'NO EMOJIS - do not use any emojis at all';
        
        console.log('Quote generation params:', { tweetContext, persona, engagementMode, emojiInstruction });
        
        const messages = [
            {
                role: 'system',
                content: `You are a crypto Twitter expert creating quote tweets. ${personaPrompt}

Generate a compelling quote tweet with:
1. A strong, quotable hook (main insight/reaction)
2. A supporting line that adds context or value

Context: ${tweetContext}
Engagement: ${engagementMode}
EMOJIS: ${emojiInstruction}

Make it crypto-native, authentic, and engaging. Use appropriate crypto terminology.

CRITICAL: Return in this exact format:
[Hook line]
[Supporting line]

No labels, no "Line 1:" or "Line 2:" prefixes. Just the two lines.`
            },
            {
                role: 'user',
                content: `Create a quote tweet for: "${tweet}"`
            }
        ];

        console.log('Making OpenRouter request for quote...');
        const quote = await makeOpenRouterRequest(messages, 200);
        console.log('Raw quote response:', quote);
        
        const cleanedQuote = cleanAIResponse(quote);
        console.log('Cleaned quote:', cleanedQuote);
        
        const finalQuote = enforceUserPreferences(cleanedQuote, preferences || { emoji: false });
        console.log('Final quote:', finalQuote);
        
        res.json({ quote: finalQuote, context: tweetContext });

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
        builder: "You're a crypto builder/developer. Focus on: technical implementation, code quality, developer experience, building in public, shipping products. Use terms like 'shipping', 'building', 'devs', 'tech stack', 'open source'.",
        trader: "You're an active crypto trader. Focus on: price action, market structure, trading setups, risk management, market psychology. Use terms like 'PA', 'levels', 'invalidation', 'R:R', 'confluence', 'degen plays'.",
        researcher: "You're a crypto researcher/analyst. Focus on: fundamentals, tokenomics, protocol analysis, data-driven insights, due diligence. Use terms like 'fundamentals', 'tokenomics', 'TVL', 'metrics', 'alpha research'.",
        degen: "You're a crypto degen. Focus on: high-risk plays, meme coins, aping, FOMO, community vibes, quick flips. Use terms like 'aping', 'moon mission', 'diamond hands', 'wagmi', 'send it', casual/meme language.",
        founder: "You're a crypto founder/entrepreneur. Focus on: building ecosystems, scaling, partnerships, vision, adoption, business strategy. Use terms like 'ecosystem', 'scaling', 'adoption', 'partnerships', 'vision'.",
        community: "You're a crypto community builder. Focus on: education, onboarding, collaboration, inclusivity, helping newcomers. Use terms like 'fren', 'community', 'together', 'learning', 'welcome to crypto'."
    };
    
    return personas[persona] || personas.builder;
}

function buildEngagementPrompt(mode) {
    const modes = {
        engagement_max: "ENGAGEMENT STRATEGY: Create hooks and conversation starters. Ask thought-provoking questions, use engaging language, include calls-to-action. Make people want to reply and discuss.",
        neutral: "ENGAGEMENT STRATEGY: Provide balanced, helpful responses. Be informative and valuable without being pushy or controversial. Focus on adding genuine insight.",
        signal_only: "ENGAGEMENT STRATEGY: Pure signal, minimal noise. Be concise and insight-heavy. Focus on valuable information, data, or unique perspectives. No fluff or engagement tactics."
    };
    
    return modes[mode] || modes.neutral;
}

async function generateReplyVariants(baseMessages, tweet, preferences, persona, engagementMode) {
    const variants = {};
    
    const lengthInstruction = preferences.length === 'ultra-short' ? 'Maximum 10 words' : 
                             preferences.length === 'short' ? '1-2 sentences maximum' : 
                             preferences.length === 'medium' ? '2-3 sentences maximum' : 
                             '3-4 sentences maximum';
    
    const emojiInstruction = preferences.emoji ? 'Include relevant emojis' : 'NO EMOJIS - do not use any emojis at all';
    
    // Safe variant
    const safeMessages = [
        {
            role: 'system',
            content: `Generate a SAFE crypto reply that is conservative and broadly acceptable.

LENGTH: ${lengthInstruction}
EMOJIS: ${emojiInstruction}
STYLE: ${preferences.style}
TONE: ${preferences.tone}

Return only the reply text, no labels or prefixes.`
        },
        {
            role: 'user',
            content: `Safe reply to: "${tweet}"`
        }
    ];
    variants.safe = await makeOpenRouterRequest(safeMessages, 100);
    
    // Bold variant  
    const boldMessages = [
        {
            role: 'system',
            content: `Generate a BOLD crypto reply that is confident and opinionated.

LENGTH: ${lengthInstruction}
EMOJIS: ${emojiInstruction}
STYLE: ${preferences.style}
TONE: ${preferences.tone}

Return only the reply text, no labels or prefixes.`
        },
        {
            role: 'user',
            content: `Bold reply to: "${tweet}"`
        }
    ];
    variants.bold = await makeOpenRouterRequest(boldMessages, 100);
    
    // Alpha variant
    const alphaMessages = [
        {
            role: 'system',
            content: `Generate an ALPHA crypto reply that is high-conviction and contrarian.

LENGTH: ${lengthInstruction}
EMOJIS: ${emojiInstruction}
STYLE: ${preferences.style}
TONE: ${preferences.tone}

Return only the reply text, no labels or prefixes.`
        },
        {
            role: 'user',
            content: `Alpha reply to: "${tweet}"`
        }
    ];
    variants.alpha = await makeOpenRouterRequest(alphaMessages, 100);
    
    return variants;
}

app.get('/api/extension-version', (req, res) => {
    res.json({
        version: '1.1.0', // Update this when you release new versions
        downloadUrl: `${process.env.SITE_URL || 'http://localhost:3000'}/install`,
        releaseNotes: 'New crypto features: personas, variants, quote tweets, and dark blue theme.',
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

// Enforce user preferences on the response
function enforceUserPreferences(text, preferences) {
    if (!text) return '';
    
    let result = text;
    
    // Enforce emoji preference
    if (!preferences.emoji) {
        // Remove all emojis if user doesn't want them
        result = result.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
    }
    
    // Enforce length preference
    if (preferences.length === 'ultra-short') {
        const words = result.split(' ');
        if (words.length > 10) {
            result = words.slice(0, 10).join(' ');
            // Add ellipsis if we cut it off
            if (!result.endsWith('.') && !result.endsWith('!') && !result.endsWith('?')) {
                result += '...';
            }
        }
    }
    
    return result.trim();
}
// Clean AI response from unwanted tags and artifacts
function cleanAIResponse(text) {
    if (!text) return '';
    
    let cleaned = text;
    
    const artifactsToRemove = [
        /<s>/g, /<\/s>/g, /\[s\]/g, /\[\/s\]/g,
        /\[BOT\]/g, /\[\/BOT\]/g, /\[B_INST\]/g, /\[\/B_INST\]/g,
        /\[INST\]/g, /\[\/INST\]/g, /\[SYS\]/g, /\[\/SYS\]/g,
        /<\|im_start\|>/g, /<\|im_end\|>/g, /<\|system\|>/g,
        /<\|user\|>/g, /<\|assistant\|>/g, /\[SYSTEM\]/g,
        /\[\/SYSTEM\]/g, /\[USER\]/g, /\[\/USER\]/g,
        /\[ASSISTANT\]/g, /\[\/ASSISTANT\]/g, /<[^>]*>/g,
        /\[[A-Z_\/]+\]/g, /\[[^\]]*INST[^\]]*\]/g,
        /\[[^\]]*BOT[^\]]*\]/g, /\[[^\]]*SYS[^\]]*\]/g,
        // Remove variant labels and formatting
        /\*\*SAFE:\*\*/g, /\*\*BOLD:\*\*/g, /\*\*ALPHA:\*\*/g,
        /Safe:/g, /Bold:/g, /Alpha:/g,
        /Safe Reply:/g, /Bold Reply:/g, /Alpha Reply:/g,
        /\*\*Safe\*\*/g, /\*\*Bold\*\*/g, /\*\*Alpha\*\*/g,
        // Remove line labels
        /Line 1:/g, /Line 2:/g, /Hook:/g, /Supporting:/g,
        // Remove extra asterisks and formatting
        /\*\*\*+/g, /\*\*/g
    ];
    
    artifactsToRemove.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
    });
    
    // Clean up extra whitespace and newlines
    cleaned = cleaned.trim().replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n');
    
    // Remove leading/trailing quotes
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1).trim();
    }
    
    return cleaned;
}