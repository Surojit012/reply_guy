class CryptoReplyGuyExtension {
    constructor() {
        this.serverUrl = 'https://reply-guy-eta.vercel.app';
        this.lastRequestTime = 0;
        this.cooldownDuration = 3000; // 3 seconds cooldown
        console.log('Crypto Extension initialized with server URL:', this.serverUrl);
        this.initializeTheme();
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        console.log('Extension fully initialized');
    }

    async initializeTheme() {
        try {
            const result = await chrome.storage.sync.get(['uiTheme']);
            const savedTheme = result.uiTheme;
            if (savedTheme === 'light' || savedTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', savedTheme);
            }
        } catch (error) {
            console.warn('Unable to read extension theme preference:', error);
        }
    }

    getActiveTheme() {
        const explicitTheme = document.documentElement.getAttribute('data-theme');
        if (explicitTheme === 'light' || explicitTheme === 'dark') {
            return explicitTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    updateThemeToggleButton() {
        if (!this.themeToggleBtn) return;
        const activeTheme = this.getActiveTheme();
        this.themeToggleBtn.textContent = activeTheme === 'dark' ? '🌙' : '☀️';
        this.themeToggleBtn.setAttribute('aria-label', `Switch to ${activeTheme === 'dark' ? 'light' : 'dark'} theme`);
        this.themeToggleBtn.title = `Switch to ${activeTheme === 'dark' ? 'light' : 'dark'} theme`;
    }

    async toggleTheme() {
        const currentTheme = this.getActiveTheme();
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        this.updateThemeToggleButton();
        try {
            await chrome.storage.sync.set({ uiTheme: nextTheme });
        } catch (error) {
            console.warn('Unable to save extension theme preference:', error);
        }
    }

    initializeElements() {
        console.log('Initializing elements...');
        this.tweetInput = document.getElementById('tweet-input');
        this.analyzeBtn = document.getElementById('analyze-btn');
        this.generateBtn = document.getElementById('generate-btn');
        this.variantsBtn = document.getElementById('variants-btn');
        this.quoteBtn = document.getElementById('quote-btn');
        this.copyBtn = document.getElementById('copy-btn');
        this.pasteTwitterBtn = document.getElementById('paste-twitter-btn');
        this.regenerateBtn = document.getElementById('regenerate-btn');
        this.autoFillBtn = document.getElementById('auto-fill-btn');
        this.testConnectionBtn = document.getElementById('test-connection-btn');
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');
        
        // Thread modal elements
        this.threadModal = document.getElementById('thread-modal');
        this.fillSingleBtn = document.getElementById('fill-single-btn');
        this.fillThreadBtn = document.getElementById('fill-thread-btn');
        this.modalCancelBtn = document.getElementById('modal-cancel-btn');
        this.pendingThreadData = null;
        
        this.analysisSection = document.getElementById('analysis-section');
        this.analysisResult = document.getElementById('analysis-result');
        this.outputSection = document.getElementById('output-section');
        this.variantsSection = document.getElementById('variants-section');
        this.quoteSection = document.getElementById('quote-section');
        this.generatedReply = document.getElementById('generated-reply');
        this.contextInfo = document.getElementById('context-info');
        this.loading = document.getElementById('loading');
        
        // Crypto settings
        this.personaSelect = document.getElementById('persona-select');
        this.engagementMode = document.getElementById('engagement-mode');
        this.replyLength = document.getElementById('reply-length');
        this.writingStyle = document.getElementById('writing-style');
        this.tone = document.getElementById('tone');
        this.includeEmoji = document.getElementById('include-emoji');
        
        // Variant elements
        this.safeVariant = document.getElementById('safe-variant');
        this.boldVariant = document.getElementById('bold-variant');
        this.alphaVariant = document.getElementById('alpha-variant');
        this.generatedQuote = document.getElementById('generated-quote');
        
        console.log('Elements found:', {
            tweetInput: !!this.tweetInput,
            generateBtn: !!this.generateBtn,
            variantsBtn: !!this.variantsBtn,
            quoteBtn: !!this.quoteBtn,
            outputSection: !!this.outputSection,
            generatedReply: !!this.generatedReply,
            personaSelect: !!this.personaSelect,
            engagementMode: !!this.engagementMode,
            replyLength: !!this.replyLength,
            writingStyle: !!this.writingStyle,
            tone: !!this.tone,
            includeEmoji: !!this.includeEmoji
        });
        
        // Hide API key section since we're using backend
        const apiSection = document.getElementById('api-section');
        if (apiSection) {
            apiSection.style.display = 'none';
        }
    }

    bindEvents() {
        console.log('Binding events...');
        if (this.analyzeBtn) {
            this.analyzeBtn.addEventListener('click', () => this.analyzeTweet());
            console.log('Analyze button event bound');
        }
        if (this.generateBtn) {
            this.generateBtn.addEventListener('click', () => this.generateReply());
            console.log('Generate button event bound');
        }
        if (this.variantsBtn) {
            this.variantsBtn.addEventListener('click', () => this.generateVariants());
            console.log('Variants button event bound');
        }
        if (this.quoteBtn) {
            this.quoteBtn.addEventListener('click', () => this.generateQuote());
            console.log('Quote button event bound');
        }
        if (this.copyBtn) {
            this.copyBtn.addEventListener('click', () => this.copyReply());
        }
        if (this.pasteTwitterBtn) {
            this.pasteTwitterBtn.addEventListener('click', () => this.pasteToTwitter());
        }
        if (this.regenerateBtn) {
            this.regenerateBtn.addEventListener('click', () => this.generateReply());
        }
        if (this.autoFillBtn) {
            this.autoFillBtn.addEventListener('click', () => this.autoFillFromTwitter());
        }
        if (this.testConnectionBtn) {
            this.testConnectionBtn.addEventListener('click', () => this.testConnection());
            console.log('Test connection button event bound');
        }
        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
            this.updateThemeToggleButton();
        }
        
        // Thread modal event bindings
        if (this.fillSingleBtn) {
            this.fillSingleBtn.addEventListener('click', () => this.handleThreadChoice('single'));
        }
        if (this.fillThreadBtn) {
            this.fillThreadBtn.addEventListener('click', () => this.handleThreadChoice('thread'));
        }
        if (this.modalCancelBtn) {
            this.modalCancelBtn.addEventListener('click', () => this.hideThreadModal());
        }
        if (this.threadModal) {
            this.threadModal.addEventListener('click', (e) => {
                if (e.target === this.threadModal) this.hideThreadModal();
            });
        }
        
        // Copy variant buttons
        document.querySelectorAll('.copy-variant').forEach(btn => {
            btn.addEventListener('click', (e) => this.copyVariant(e.target.dataset.variant));
        });
        
        // Quote tweet buttons
        const copyQuoteBtn = document.getElementById('copy-quote-btn');
        const regenerateQuoteBtn = document.getElementById('regenerate-quote-btn');
        if (copyQuoteBtn) {
            copyQuoteBtn.addEventListener('click', () => this.copyQuote());
        }
        if (regenerateQuoteBtn) {
            regenerateQuoteBtn.addEventListener('click', () => this.generateQuote());
        }
        
        // Save preferences when changed
        [this.personaSelect, this.engagementMode, this.replyLength, this.writingStyle, this.tone, this.includeEmoji].forEach(element => {
            if (element) {
                element.addEventListener('change', () => this.saveSettings());
            }
        });
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'persona', 'engagementMode', 'replyLength', 'writingStyle', 'tone', 'includeEmoji'
            ]);
            
            if (this.personaSelect && result.persona) this.personaSelect.value = result.persona;
            if (this.engagementMode && result.engagementMode) this.engagementMode.value = result.engagementMode;
            if (this.replyLength && result.replyLength) this.replyLength.value = result.replyLength;
            if (this.writingStyle && result.writingStyle) this.writingStyle.value = result.writingStyle;
            if (this.tone && result.tone) this.tone.value = result.tone;
            if (this.includeEmoji && result.includeEmoji !== undefined) this.includeEmoji.checked = result.includeEmoji;
            
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.sync.set({
                persona: this.personaSelect?.value,
                engagementMode: this.engagementMode?.value,
                replyLength: this.replyLength?.value,
                writingStyle: this.writingStyle?.value,
                tone: this.tone?.value,
                includeEmoji: this.includeEmoji?.checked
            });
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    showLoading() {
        this.loading.style.display = 'block';
        if (this.analyzeBtn) this.analyzeBtn.disabled = true;
        if (this.generateBtn) this.generateBtn.disabled = true;
        if (this.variantsBtn) this.variantsBtn.disabled = true;
        if (this.quoteBtn) this.quoteBtn.disabled = true;
    }

    hideLoading() {
        this.loading.style.display = 'none';
        if (this.analyzeBtn) this.analyzeBtn.disabled = false;
        if (this.generateBtn) this.generateBtn.disabled = false;
        if (this.variantsBtn) this.variantsBtn.disabled = false;
        if (this.quoteBtn) this.quoteBtn.disabled = false;
    }

    startCooldown() {
        const now = Date.now();
        this.lastRequestTime = now;
        
        // Disable buttons during cooldown
        if (this.generateBtn) this.generateBtn.disabled = true;
        if (this.variantsBtn) this.variantsBtn.disabled = true;
        if (this.quoteBtn) this.quoteBtn.disabled = true;
        if (this.analyzeBtn) this.analyzeBtn.disabled = true;
        
        // Show countdown on generate button
        let remainingTime = Math.ceil(this.cooldownDuration / 1000);
        const originalText = this.generateBtn ? this.generateBtn.textContent : 'Generate Reply';
        
        const updateCountdown = () => {
            if (remainingTime > 0 && this.generateBtn) {
                this.generateBtn.textContent = `Wait ${remainingTime}s...`;
                remainingTime--;
                setTimeout(updateCountdown, 1000);
            } else {
                if (this.generateBtn) this.generateBtn.textContent = originalText;
                if (this.generateBtn) this.generateBtn.disabled = false;
                if (this.variantsBtn) this.variantsBtn.disabled = false;
                if (this.quoteBtn) this.quoteBtn.disabled = false;
                if (this.analyzeBtn) this.analyzeBtn.disabled = false;
            }
        };
        
        updateCountdown();
    }

    checkCooldown() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.cooldownDuration) {
            const remainingCooldown = Math.ceil((this.cooldownDuration - timeSinceLastRequest) / 1000);
            this.showError(`Please wait ${remainingCooldown} seconds before making another request.`);
            return false;
        }
        
        return true;
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

    updateRateLimitDisplay(rateLimitInfo) {
        // Rate limiting disabled - no display needed
        return;
    }

    async testConnection() {
        console.log('Testing connection to server...');
        try {
            // Test health endpoint first
            const healthResponse = await fetch(`${this.serverUrl}/api/health`);
            const healthData = await healthResponse.json();
            console.log('Health check:', healthData);
            
            // Test Fireworks API directly
            console.log('Testing Fireworks API...');
            const testResponse = await fetch(`${this.serverUrl}/api/test-fireworks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})
            });
            
            console.log('Test Fireworks response status:', testResponse.status);
            const testData = await testResponse.json();
            console.log('Test Fireworks response:', testData);
            
            if (testResponse.ok && testData.success) {
                this.showSuccess(`Connection test successful! Result: ${testData.result}`);
            } else {
                this.showError(`Fireworks test failed: ${testData.error || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.error('Connection test error:', error);
            this.showError(`Connection test error: ${error.message}`);
        }
    }

    async makeAPIRequest(endpoint, data) {
        const fullUrl = `${this.serverUrl}/api/${endpoint}`;
        console.log('Making API request to:', fullUrl);
        console.log('Request data:', data);
        
        try {
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            const result = await response.json();
            console.log('Response data:', result);

            // Handle rate limit responses specifically
            if (response.status === 429) {
                const rateLimitInfo = result.rateLimitInfo;
                if (rateLimitInfo) {
                    const resetTime = rateLimitInfo.resetTime ? new Date(parseInt(rateLimitInfo.resetTime) * 1000) : null;
                    const resetTimeStr = resetTime ? resetTime.toLocaleTimeString() : 'soon';
                    const remaining = rateLimitInfo.remaining || 0;
                    const limit = rateLimitInfo.limit || 50;
                    
                    throw new Error(`Request limit reached. Please wait a moment before trying again.`);
                } else {
                    throw new Error('Rate limit exceeded. Please wait before making another request.');
                }
            }

            if (!response.ok) {
                console.error('API Error Response:', result);
                throw new Error(result.error || `Request failed: ${response.status}`);
            }

            // Update rate limit display if available
            if (result.rateLimitInfo) {
                this.updateRateLimitDisplay(result.rateLimitInfo);
            }

            return result;
        } catch (error) {
            console.error('API Request Error:', error.message);
            console.error('Full error:', error);
            throw error;
        }
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
            /\[[^\]]*SYS[^\]]*\]/g,
            // Remove variant labels and formatting
            /\*\*SAFE:\*\*/g,
            /\*\*BOLD:\*\*/g,
            /\*\*ALPHA:\*\*/g,
            /Safe:/g,
            /Bold:/g,
            /Alpha:/g,
            /Safe Reply:/g,
            /Bold Reply:/g,
            /Alpha Reply:/g,
            /\*\*Safe\*\*/g,
            /\*\*Bold\*\*/g,
            /\*\*Alpha\*\*/g,
            // Remove line labels
            /Line 1:/g,
            /Line 2:/g,
            /Hook:/g,
            /Supporting:/g,
            // Remove extra asterisks and formatting
            /\*\*\*+/g,
            /\*\*/g
        ];
        
        // Apply all cleaning rules
        artifactsToRemove.forEach(pattern => {
            cleaned = cleaned.replace(pattern, '');
        });
        
        // Clean up extra whitespace and newlines
        cleaned = cleaned.trim();
        cleaned = cleaned.replace(/\s+/g, ' ');
        cleaned = cleaned.replace(/\n\s*\n/g, '\n');
        
        // Remove leading/trailing quotes if they wrap the entire response
        if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
            (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
            cleaned = cleaned.slice(1, -1).trim();
        }
        
        return cleaned;
    }

    // Enforce user preferences on the response
    enforceUserPreferences(text, preferences) {
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

    async analyzeTweet() {
        const tweet = this.tweetInput.value.trim();
        
        if (!tweet) {
            this.showError('Please paste a tweet to analyze');
            return;
        }

        if (!this.checkCooldown()) {
            return;
        }

        try {
            this.showLoading();
            
            const result = await this.makeAPIRequest('analyze', { tweet });
            
            const cleanedAnalysis = this.cleanAIResponse(result.analysis);
            this.analysisResult.textContent = cleanedAnalysis;
            this.analysisSection.style.display = 'block';
            
            this.startCooldown();
            
        } catch (error) {
            console.error('Analysis error:', error);
            if (error.message.includes('Rate limit') || error.message.includes('Daily limit')) {
                this.showError(error.message);
            } else {
                this.showError(error.message || 'Failed to analyze tweet. Please try again.');
            }
        } finally {
            this.hideLoading();
        }
    }

    async generateReply() {
        console.log('generateReply called');
        const tweet = this.tweetInput.value.trim();
        console.log('Tweet input:', tweet);
        
        if (!tweet) {
            this.showError('Please paste a tweet first');
            return;
        }

        if (!this.checkCooldown()) {
            return;
        }

        try {
            this.showLoading();
            
            const preferences = {
                length: this.replyLength?.value || 'medium',
                style: this.writingStyle?.value || 'casual',
                tone: this.tone?.value || 'neutral',
                emoji: this.includeEmoji?.checked || false
            };

            const persona = this.personaSelect?.value || 'builder';
            const engagementMode = this.engagementMode?.value || 'neutral';

            console.log('Request parameters:', { tweet, preferences, persona, engagementMode });

            const result = await this.makeAPIRequest('generate-reply', { 
                tweet, 
                preferences,
                persona,
                engagementMode
            });
            
            console.log('API result:', result);
            
            const cleanedReply = this.cleanAIResponse(result.reply);
            console.log('Cleaned reply:', cleanedReply);
            
            const finalReply = this.enforceUserPreferences(cleanedReply, preferences);
            console.log('Final reply:', finalReply);
            
            this.generatedReply.textContent = finalReply;
            
            // Show context info if available
            if (result.context && this.contextInfo) {
                this.contextInfo.textContent = `Context: ${result.context.replace('_', ' ')}`;
                this.contextInfo.style.display = 'block';
            }
            
            this.outputSection.style.display = 'block';
            if (this.variantsSection) this.variantsSection.style.display = 'none';
            if (this.quoteSection) this.quoteSection.style.display = 'none';
            
            this.startCooldown();
            
        } catch (error) {
            console.error('Generation error:', error);
            if (error.message.includes('Rate limit') || error.message.includes('Daily limit')) {
                this.showError(error.message);
            } else {
                this.showError(error.message || 'Failed to generate reply. Please try again.');
            }
        } finally {
            this.hideLoading();
        }
    }

    async generateVariants() {
        const tweet = this.tweetInput.value.trim();
        
        if (!tweet) {
            this.showError('Please paste a tweet first');
            return;
        }

        try {
            this.showLoading();
            
            const preferences = {
                length: this.replyLength?.value || 'medium',
                style: this.writingStyle?.value || 'casual',
                tone: this.tone?.value || 'neutral',
                emoji: this.includeEmoji?.checked || false
            };

            const persona = this.personaSelect?.value || 'builder';
            const engagementMode = this.engagementMode?.value || 'neutral';

            const result = await this.makeAPIRequest('generate-reply', { 
                tweet, 
                preferences,
                persona,
                engagementMode,
                generateVariants: true
            });
            
            if (result.variants && this.safeVariant && this.boldVariant && this.alphaVariant) {
                this.safeVariant.textContent = this.enforceUserPreferences(this.cleanAIResponse(result.variants.safe), preferences);
                this.boldVariant.textContent = this.enforceUserPreferences(this.cleanAIResponse(result.variants.bold), preferences);
                this.alphaVariant.textContent = this.enforceUserPreferences(this.cleanAIResponse(result.variants.alpha), preferences);
                
                if (this.variantsSection) {
                    this.variantsSection.style.display = 'block';
                    this.outputSection.style.display = 'none';
                    if (this.quoteSection) this.quoteSection.style.display = 'none';
                }
            }
            
        } catch (error) {
            console.error('Variants generation error:', error);
            if (error.message.includes('Rate limit')) {
                this.showError('Rate limit exceeded. Please wait a moment before trying again.');
            } else {
                this.showError(error.message || 'Failed to generate variants. Please try again.');
            }
        } finally {
            this.hideLoading();
        }
    }

    async generateQuote() {
        const tweet = this.tweetInput.value.trim();
        
        if (!tweet) {
            this.showError('Please paste a tweet first');
            return;
        }

        try {
            this.showLoading();
            
            const persona = this.personaSelect?.value || 'builder';
            const engagementMode = this.engagementMode?.value || 'neutral';
            const preferences = {
                length: this.replyLength?.value || 'medium',
                style: this.writingStyle?.value || 'casual',
                tone: this.tone?.value || 'neutral',
                emoji: this.includeEmoji?.checked || false
            };

            const result = await this.makeAPIRequest('generate-quote', { 
                tweet,
                persona,
                engagementMode,
                preferences
            });
            
            if (this.generatedQuote) {
                const cleanedQuote = this.cleanAIResponse(result.quote);
                const finalQuote = this.enforceUserPreferences(cleanedQuote, preferences);
                this.generatedQuote.textContent = finalQuote;
                
                if (this.quoteSection) {
                    this.quoteSection.style.display = 'block';
                    this.outputSection.style.display = 'none';
                    if (this.variantsSection) this.variantsSection.style.display = 'none';
                }
            }
            
        } catch (error) {
            console.error('Quote generation error:', error);
            if (error.message.includes('Rate limit')) {
                this.showError('Rate limit exceeded. Please wait a moment before trying again.');
            } else {
                this.showError(error.message || 'Failed to generate quote tweet. Please try again.');
            }
        } finally {
            this.hideLoading();
        }
    }

    async copyVariant(variant) {
        const variantElement = document.getElementById(`${variant}-variant`);
        if (!variantElement) return;
        
        try {
            await navigator.clipboard.writeText(variantElement.textContent);
            this.showSuccess(`${variant} variant copied to clipboard!`);
            
            const btn = document.querySelector(`[data-variant="${variant}"]`);
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = 'Copied! ✓';
                btn.style.background = 'var(--success)';
                btn.style.color = '#ffffff';
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                    btn.style.color = '';
                }, 2000);
            }
            
        } catch (error) {
            this.showError('Failed to copy variant to clipboard');
        }
    }

    async copyQuote() {
        if (!this.generatedQuote) return;
        
        try {
            await navigator.clipboard.writeText(this.generatedQuote.textContent);
            this.showSuccess('Quote tweet copied to clipboard!');
            
            const copyQuoteBtn = document.getElementById('copy-quote-btn');
            if (copyQuoteBtn) {
                const originalText = copyQuoteBtn.textContent;
                copyQuoteBtn.textContent = 'Copied! ✓';
                copyQuoteBtn.style.background = 'var(--success)';
                copyQuoteBtn.style.color = '#ffffff';
                
                setTimeout(() => {
                    copyQuoteBtn.textContent = originalText;
                    copyQuoteBtn.style.background = '';
                    copyQuoteBtn.style.color = '';
                }, 2000);
            }
            
        } catch (error) {
            this.showError('Failed to copy quote to clipboard');
        }
    }

    async copyReply() {
        try {
            await navigator.clipboard.writeText(this.generatedReply.textContent);
            this.showSuccess('Reply copied to clipboard!');
            
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = 'Copied! ✓';
            this.copyBtn.style.background = 'var(--success)';
            this.copyBtn.style.color = '#ffffff';
            
            setTimeout(() => {
                this.copyBtn.textContent = originalText;
                this.copyBtn.style.background = '';
                this.copyBtn.style.color = '';
            }, 2000);
            
        } catch (error) {
            this.showError('Failed to copy to clipboard');
        }
    }

    showThreadModal(threadData) {
        this.pendingThreadData = threadData;
        if (this.threadModal) {
            this.threadModal.style.display = 'flex';
            // Re-initialize Lucide icons for modal
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    hideThreadModal() {
        if (this.threadModal) {
            this.threadModal.style.display = 'none';
        }
        this.pendingThreadData = null;
    }

    handleThreadChoice(choice) {
        if (!this.pendingThreadData) return;
        
        if (choice === 'single') {
            this.tweetInput.value = this.pendingThreadData.singleTweet;
            this.showSuccess('Single tweet auto-filled!');
        } else if (choice === 'thread') {
            this.tweetInput.value = this.pendingThreadData.fullThread;
            this.showSuccess(`Thread auto-filled! (${this.pendingThreadData.tweetCount} tweets)`);
        }
        
        this.hideThreadModal();
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
                // First, check if this is a thread
                const threadResults = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: detectAndExtractThread
                });

                if (threadResults && threadResults[0] && threadResults[0].result) {
                    const result = threadResults[0].result;
                    
                    if (result.isThread && result.tweetCount > 1) {
                        // Show modal to let user choose
                        this.showThreadModal(result);
                    } else if (result.singleTweet) {
                        // Not a thread, just fill the single tweet
                        this.tweetInput.value = result.singleTweet;
                        this.showSuccess('Tweet text auto-filled!');
                    } else {
                        this.showError('No tweet found. Please click on a tweet or scroll to make one visible.');
                    }
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
function detectAndExtractThread() {
    // Get all tweet articles on the page
    const articles = document.querySelectorAll('[data-testid="tweet"]');
    
    if (articles.length === 0) {
        return { isThread: false, singleTweet: null, fullThread: null, tweetCount: 0 };
    }
    
    // Get the main/focused tweet (usually the first one in detail view)
    let mainTweetText = null;
    const mainTweetElement = document.querySelector('[data-testid="tweet"] [data-testid="tweetText"]');
    if (mainTweetElement && mainTweetElement.offsetParent !== null) {
        mainTweetText = mainTweetElement.textContent.trim();
    }
    
    // Check if we're on a tweet detail page (URL contains /status/)
    const isDetailView = window.location.pathname.includes('/status/');
    
    if (!isDetailView) {
        // Not on detail view, just return single tweet
        return { 
            isThread: false, 
            singleTweet: mainTweetText, 
            fullThread: mainTweetText, 
            tweetCount: 1 
        };
    }
    
    // Try to find the author of the main tweet
    let mainAuthor = null;
    const authorElements = document.querySelectorAll('[data-testid="tweet"] [data-testid="User-Name"] a[href^="/"]');
    for (const el of authorElements) {
        const href = el.getAttribute('href');
        if (href && href.startsWith('/') && !href.includes('/status/')) {
            mainAuthor = href.split('/')[1];
            break;
        }
    }
    
    // Collect all tweets from the same author (thread tweets)
    const threadTweets = [];
    const seenTexts = new Set();
    
    articles.forEach((article) => {
        // Check if this tweet is from the same author
        const authorLink = article.querySelector('[data-testid="User-Name"] a[href^="/"]');
        if (authorLink) {
            const href = authorLink.getAttribute('href');
            const author = href ? href.split('/')[1] : null;
            
            // Only include tweets from the main author (thread author)
            if (author && mainAuthor && author.toLowerCase() === mainAuthor.toLowerCase()) {
                const tweetTextEl = article.querySelector('[data-testid="tweetText"]');
                if (tweetTextEl && tweetTextEl.offsetParent !== null) {
                    const text = tweetTextEl.textContent.trim();
                    // Avoid duplicates
                    if (text.length > 0 && !seenTexts.has(text)) {
                        seenTexts.add(text);
                        threadTweets.push(text);
                    }
                }
            }
        }
    });
    
    // Determine if this is a thread (more than 1 tweet from same author)
    const isThread = threadTweets.length > 1;
    
    // Combine thread tweets with separator
    const fullThread = threadTweets.join('\n\n---\n\n');
    
    return {
        isThread: isThread,
        singleTweet: mainTweetText || threadTweets[0] || null,
        fullThread: fullThread || mainTweetText,
        tweetCount: threadTweets.length
    };
}

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
    new CryptoReplyGuyExtension();
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});