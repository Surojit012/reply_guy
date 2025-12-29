class ReplyGuyExtension {
    constructor() {
        this.serverUrl = 'https://reply-guy-eta.vercel.app'; // Production URL
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
    }

    initializeElements() {
        this.tweetInput = document.getElementById('tweet-input');
        this.analyzeBtn = document.getElementById('analyze-btn');
        this.generateBtn = document.getElementById('generate-btn');
        this.copyBtn = document.getElementById('copy-btn');
        this.pasteTwitterBtn = document.getElementById('paste-twitter-btn');
        this.regenerateBtn = document.getElementById('regenerate-btn');
        this.autoFillBtn = document.getElementById('auto-fill-btn');
        
        this.analysisSection = document.getElementById('analysis-section');
        this.analysisResult = document.getElementById('analysis-result');
        this.outputSection = document.getElementById('output-section');
        this.generatedReply = document.getElementById('generated-reply');
        this.loading = document.getElementById('loading');
        
        this.replyLength = document.getElementById('reply-length');
        this.writingStyle = document.getElementById('writing-style');
        this.tone = document.getElementById('tone');
        this.includeEmoji = document.getElementById('include-emoji');
        
        // Hide API key section since we're using backend
        const apiSection = document.getElementById('api-section');
        if (apiSection) {
            apiSection.style.display = 'none';
        }
    }

    bindEvents() {
        this.analyzeBtn.addEventListener('click', () => this.analyzeTweet());
        this.generateBtn.addEventListener('click', () => this.generateReply());
        this.copyBtn.addEventListener('click', () => this.copyReply());
        this.pasteTwitterBtn.addEventListener('click', () => this.pasteToTwitter());
        this.regenerateBtn.addEventListener('click', () => this.generateReply());
        this.autoFillBtn.addEventListener('click', () => this.autoFillFromTwitter());
        
        // Save preferences when changed
        [this.replyLength, this.writingStyle, this.tone, this.includeEmoji].forEach(element => {
            element.addEventListener('change', () => this.saveSettings());
        });
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'replyLength', 'writingStyle', 'tone', 'includeEmoji'
            ]);
            
            if (result.replyLength) this.replyLength.value = result.replyLength;
            if (result.writingStyle) this.writingStyle.value = result.writingStyle;
            if (result.tone) this.tone.value = result.tone;
            if (result.includeEmoji !== undefined) this.includeEmoji.checked = result.includeEmoji;
            
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.sync.set({
                replyLength: this.replyLength.value,
                writingStyle: this.writingStyle.value,
                tone: this.tone.value,
                includeEmoji: this.includeEmoji.checked
            });
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    showLoading() {
        this.loading.style.display = 'block';
        this.analyzeBtn.disabled = true;
        this.generateBtn.disabled = true;
    }

    hideLoading() {
        this.loading.style.display = 'none';
        this.analyzeBtn.disabled = false;
        this.generateBtn.disabled = false;
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        
        document.querySelectorAll('.error').forEach(el => el.remove());
        this.loading.parentNode.insertBefore(errorDiv, this.loading);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.textContent = message;
        
        document.querySelectorAll('.success').forEach(el => el.remove());
        this.loading.parentNode.insertBefore(successDiv, this.loading);
        
        setTimeout(() => successDiv.remove(), 3000);
    }

    async makeAPIRequest(endpoint, data) {
        const response = await fetch(`${this.serverUrl}/api/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `Request failed: ${response.status}`);
        }

        return result;
    }

    // Clean AI response from unwanted tags and artifacts
    cleanAIResponse(text) {
        if (!text) return '';
        
        let cleaned = text;
        
        // Remove common AI artifacts and tags
        const artifactsToRemove = [
            /<s>/g,
            /<\/s>/g,
            /\[s\]/g,
            /\[\/s\]/g,
            /\[BOT\]/g,
            /\[\/BOT\]/g,
            /\[B_INST\]/g,
            /\[\/B_INST\]/g,
            /\[INST\]/g,
            /\[\/INST\]/g,
            /\[SYS\]/g,
            /\[\/SYS\]/g,
            /<\|im_start\|>/g,
            /<\|im_end\|>/g,
            /<\|system\|>/g,
            /<\|user\|>/g,
            /<\|assistant\|>/g,
            /\[SYSTEM\]/g,
            /\[\/SYSTEM\]/g,
            /\[USER\]/g,
            /\[\/USER\]/g,
            /\[ASSISTANT\]/g,
            /\[\/ASSISTANT\]/g,
            // Remove any remaining XML-like tags
            /<[^>]*>/g,
            // Remove square bracket tags with underscores and slashes
            /\[[A-Z_\/]+\]/g,
            // Remove any remaining square bracket patterns
            /\[[^\]]*INST[^\]]*\]/g,
            /\[[^\]]*BOT[^\]]*\]/g,
            /\[[^\]]*SYS[^\]]*\]/g
        ];
        
        // Apply all cleaning rules
        artifactsToRemove.forEach(pattern => {
            cleaned = cleaned.replace(pattern, '');
        });
        
        // Clean up extra whitespace
        cleaned = cleaned.trim();
        cleaned = cleaned.replace(/\s+/g, ' ');
        
        // Remove leading/trailing quotes if they wrap the entire response
        if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
            (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
            cleaned = cleaned.slice(1, -1).trim();
        }
        
        return cleaned;
    }

    async analyzeTweet() {
        const tweet = this.tweetInput.value.trim();
        
        if (!tweet) {
            this.showError('Please paste a tweet to analyze');
            return;
        }

        try {
            this.showLoading();
            
            const result = await this.makeAPIRequest('analyze', { tweet });
            
            const cleanedAnalysis = this.cleanAIResponse(result.analysis);
            this.analysisResult.textContent = cleanedAnalysis;
            this.analysisSection.style.display = 'block';
            
        } catch (error) {
            console.error('Analysis error:', error);
            if (error.message.includes('Rate limit')) {
                this.showError('Rate limit exceeded. Please wait a moment before trying again.');
            } else {
                this.showError(error.message || 'Failed to analyze tweet. Please try again.');
            }
        } finally {
            this.hideLoading();
        }
    }

    async generateReply() {
        const tweet = this.tweetInput.value.trim();
        
        if (!tweet) {
            this.showError('Please paste a tweet first');
            return;
        }

        try {
            this.showLoading();
            
            const preferences = {
                length: this.replyLength.value,
                style: this.writingStyle.value,
                tone: this.tone.value,
                emoji: this.includeEmoji.checked
            };

            const result = await this.makeAPIRequest('generate-reply', { 
                tweet, 
                preferences 
            });
            
            const cleanedReply = this.cleanAIResponse(result.reply);
            this.generatedReply.textContent = cleanedReply;
            this.outputSection.style.display = 'block';
            
        } catch (error) {
            console.error('Generation error:', error);
            if (error.message.includes('Rate limit')) {
                this.showError('Rate limit exceeded. Please wait a moment before trying again.');
            } else {
                this.showError(error.message || 'Failed to generate reply. Please try again.');
            }
        } finally {
            this.hideLoading();
        }
    }

    async copyReply() {
        try {
            await navigator.clipboard.writeText(this.generatedReply.textContent);
            this.showSuccess('Reply copied to clipboard!');
            
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = 'Copied! ✓';
            this.copyBtn.style.background = '#28a745';
            
            setTimeout(() => {
                this.copyBtn.textContent = originalText;
                this.copyBtn.style.background = '';
            }, 2000);
            
        } catch (error) {
            this.showError('Failed to copy to clipboard');
        }
    }

    async autoFillFromTwitter() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('twitter.com') && !tab.url.includes('x.com')) {
                this.showError('Please navigate to Twitter/X first');
                return;
            }

            // Check if we have permission to access the tab
            try {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: extractTweetText
                });

                if (results && results[0] && results[0].result) {
                    this.tweetInput.value = results[0].result;
                    this.showSuccess('Tweet text auto-filled!');
                } else {
                    this.showError('No tweet found. Please click on a tweet or scroll to make one visible.');
                }
            } catch (scriptError) {
                console.error('Script execution error:', scriptError);
                this.showError('Cannot access Twitter page. Please refresh Twitter and try again.');
            }
        } catch (error) {
            console.error('Auto-fill error:', error);
            this.showError('Failed to auto-fill tweet text. Make sure you\'re on Twitter and try refreshing the page.');
        }
    }

    async pasteToTwitter() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('twitter.com') && !tab.url.includes('x.com')) {
                this.showError('Please navigate to Twitter/X first');
                return;
            }

            if (!this.generatedReply.textContent.trim()) {
                this.showError('No reply to paste. Generate a reply first.');
                return;
            }

            try {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: pasteReplyToTwitter,
                    args: [this.generatedReply.textContent]
                });

                if (results && results[0] && results[0].result) {
                    this.showSuccess('Reply pasted to Twitter!');
                } else {
                    this.showError('Could not find Twitter reply box. Please click "Reply" on a tweet first.');
                }
            } catch (scriptError) {
                console.error('Script execution error:', scriptError);
                this.showError('Cannot access Twitter page. Please refresh Twitter and try again.');
            }
        } catch (error) {
            console.error('Paste error:', error);
            this.showError('Failed to paste to Twitter. Make sure you\'re on Twitter and try refreshing the page.');
        }
    }
}

// Functions to inject into Twitter pages
function extractTweetText() {
    // Try multiple selectors for different Twitter layouts
    const tweetSelectors = [
        // New Twitter/X selectors
        '[data-testid="tweetText"]',
        '[data-testid="tweet"] [data-testid="tweetText"]',
        '[role="article"] [data-testid="tweetText"]',
        // Fallback selectors
        '.tweet-text',
        '[lang] span',
        // Article content
        'article [lang] span'
    ];
    
    for (const selector of tweetSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            // Get the first visible tweet text
            for (const element of elements) {
                if (element.offsetParent !== null && element.textContent.trim().length > 10) {
                    return element.textContent.trim();
                }
            }
        }
    }
    
    // If no tweet found, try to get any visible text that looks like a tweet
    const allTextElements = document.querySelectorAll('[lang] span, [dir="auto"] span');
    for (const element of allTextElements) {
        const text = element.textContent.trim();
        if (text.length > 20 && text.length < 500 && element.offsetParent !== null) {
            return text;
        }
    }
    
    return null;
}

function pasteReplyToTwitter(replyText) {
    // Try multiple selectors for reply input
    const replySelectors = [
        // New Twitter/X selectors
        '[data-testid="tweetTextarea_0"]',
        '[role="textbox"][data-testid="tweetTextarea_0"]',
        // Alternative selectors
        '[contenteditable="true"][role="textbox"]',
        '.public-DraftEditor-content',
        '[contenteditable="true"]',
        // Compose tweet selectors
        '[data-testid="tweetTextarea_0"] .public-DraftEditor-content',
        '.notranslate'
    ];
    
    for (const selector of replySelectors) {
        const element = document.querySelector(selector);
        if (element && element.offsetParent !== null) {
            try {
                // Focus the element
                element.focus();
                
                // Clear existing content
                element.textContent = '';
                
                // Set new content
                element.textContent = replyText;
                
                // Trigger events to make Twitter recognize the change
                const inputEvent = new Event('input', { bubbles: true });
                const changeEvent = new Event('change', { bubbles: true });
                
                element.dispatchEvent(inputEvent);
                element.dispatchEvent(changeEvent);
                
                // Alternative method for contenteditable
                if (element.contentEditable === 'true') {
                    element.innerHTML = replyText;
                    
                    // Set cursor to end
                    const range = document.createRange();
                    const selection = window.getSelection();
                    range.selectNodeContents(element);
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
                
                return true;
            } catch (error) {
                console.error('Error pasting to element:', error);
                continue;
            }
        }
    }
    
    return false;
}

// Initialize the extension when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ReplyGuyExtension();
});