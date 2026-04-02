class TweetReplyGenerator {
    constructor() {
        this.initializeTheme();
        this.initializeElements();
        this.bindEvents();
    }

    initializeTheme() {
        try {
            const savedTheme = localStorage.getItem('replyguy-theme');
            if (savedTheme === 'light' || savedTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', savedTheme);
            }
        } catch (error) {
            console.warn('Unable to read theme preference:', error);
        }
    }

    initializeElements() {
        this.tweetInput = document.getElementById('tweet-input');
        this.analyzeBtn = document.getElementById('analyze-btn');
        this.generateBtn = document.getElementById('generate-btn');
        this.copyBtn = document.getElementById('copy-btn');
        this.regenerateBtn = document.getElementById('regenerate-btn');
        
        this.analysisSection = document.getElementById('analysis-section');
        this.analysisResult = document.getElementById('analysis-result');
        this.outputSection = document.getElementById('output-section');
        this.generatedReply = document.getElementById('generated-reply');
        this.loading = document.getElementById('loading');
        
        this.replyLength = document.getElementById('reply-length');
        this.writingStyle = document.getElementById('writing-style');
        this.tone = document.getElementById('tone');
        this.includeEmoji = document.getElementById('include-emoji');
    }

    bindEvents() {
        this.analyzeBtn.addEventListener('click', () => this.analyzeTweet());
        this.generateBtn.addEventListener('click', () => this.generateReply());
        this.copyBtn.addEventListener('click', () => this.copyReply());
        this.regenerateBtn.addEventListener('click', () => this.generateReply());
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
        
        // Remove existing errors
        document.querySelectorAll('.error').forEach(el => el.remove());
        
        // Add new error
        this.loading.parentNode.insertBefore(errorDiv, this.loading);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.textContent = message;
        
        // Remove existing success messages
        document.querySelectorAll('.success').forEach(el => el.remove());
        
        // Add new success message
        this.loading.parentNode.insertBefore(successDiv, this.loading);
        
        setTimeout(() => successDiv.remove(), 3000);
    }

    async makeAPIRequest(endpoint, data) {
        const response = await fetch(`/api/${endpoint}`, {
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
            
            // Scroll to result
            this.outputSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
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
            
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = 'Copied! ✓';
            this.copyBtn.style.background = '#28a745';
            
            setTimeout(() => {
                this.copyBtn.textContent = originalText;
                this.copyBtn.style.background = '';
            }, 2000);
            
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = this.generatedReply.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.showSuccess('Reply copied to clipboard!');
            } catch (err) {
                this.showError('Failed to copy to clipboard');
            }
            
            document.body.removeChild(textArea);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TweetReplyGenerator();
    
    // Add rate limit info
    const container = document.querySelector('.container');
    const rateLimitInfo = document.createElement('div');
    rateLimitInfo.className = 'rate-limit-info';
    rateLimitInfo.textContent = '⚡ Free service with rate limits: 10 requests per minute';
    container.appendChild(rateLimitInfo);
});

async function downloadExtension() {
    // Redirect to installation page
    window.location.href = '/install';
}

function showDownloadSuccess() {
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.innerHTML = `
        <strong>Extension Downloaded! 🎉</strong><br>
        1. Unzip the file<br>
        2. Go to chrome://extensions/<br>
        3. Enable "Developer mode"<br>
        4. Click "Load unpacked" and select the folder
    `;
    
    const downloadBtn = document.getElementById('download-extension-btn');
    downloadBtn.parentNode.insertBefore(successDiv, downloadBtn.nextSibling);
    
    setTimeout(() => successDiv.remove(), 10000);
}

function showManualInstructions() {
    const instructionsDiv = document.createElement('div');
    instructionsDiv.className = 'success';
    instructionsDiv.innerHTML = `
        <strong>📦 Extension Files Ready!</strong><br>
        <div style="margin: 10px 0;">
            <a href="/extension/EXTENSION_README.md" target="_blank" style="color: #ffcc02; text-decoration: underline;">📖 View Installation Guide</a>
        </div>
        <strong>Quick Setup:</strong><br>
        1. <a href="/extension/" target="_blank" style="color: #ffcc02;">Browse extension files</a> and download all<br>
        2. Go to <code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px;">chrome://extensions/</code><br>
        3. Enable "Developer mode" (top right)<br>
        4. Click "Load unpacked" and select the extension folder<br>
        5. Enter your OpenRouter API key in the extension
    `;
    
    const downloadBtn = document.getElementById('download-extension-btn');
    downloadBtn.parentNode.insertBefore(instructionsDiv, downloadBtn.nextSibling);
    
    // Change button text
    downloadBtn.innerHTML = '<span class="download-icon">📁</span>View Extension Files';
    downloadBtn.onclick = () => window.open('/extension/', '_blank');
    
    setTimeout(() => {
        if (instructionsDiv.parentNode) {
            instructionsDiv.remove();
        }
    }, 15000);
}