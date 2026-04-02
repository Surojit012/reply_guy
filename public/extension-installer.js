// Extension installer script for direct installation
class ExtensionInstaller {
    constructor() {
        this.quickInstallBtn = document.getElementById('quick-install-btn');
        this.statusDiv = document.getElementById('quick-install-status');
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');
        this.initializeTheme();
        this.init();
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

    toggleTheme() {
        const currentTheme = this.getActiveTheme();
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('replyguy-theme', nextTheme);
        this.updateThemeToggleButton();
    }

    init() {
        if (this.quickInstallBtn) {
            this.quickInstallBtn.addEventListener('click', () => this.attemptQuickInstall());
        }
        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
            this.updateThemeToggleButton();
        }
        
        // Check if extension is already installed
        this.checkExtensionStatus();
    }

    async checkExtensionStatus() {
        // Try to detect if extension is already installed
        // This is a basic check - Chrome extensions can't be reliably detected from web pages
        try {
            // You could implement a postMessage system between your extension and website
            // For now, we'll just show the install button
            this.updateStatus('ready');
        } catch (error) {
            this.updateStatus('ready');
        }
    }

    async attemptQuickInstall() {
        this.updateStatus('installing');
        
        try {
            // Method 1: Try inline installation (deprecated but might work)
            if (chrome && chrome.webstore && chrome.webstore.install) {
                await this.chromeWebStoreInstall();
                return;
            }
            
            // Method 2: Try direct CRX download
            await this.directCrxInstall();
            
        } catch (error) {
            console.error('Installation error:', error);
            this.updateStatus('error', error.message);
            this.showManualInstructions();
        }
    }

    async chromeWebStoreInstall() {
        // This method is deprecated but included for completeness
        throw new Error('Chrome Web Store inline installation is no longer supported');
    }

    async directCrxInstall() {
        try {
            // Create a download link for the CRX file
            const crxUrl = '/extension/reply-guy-extension.crx';
            
            // Check if CRX file exists
            const response = await fetch(crxUrl, { method: 'HEAD' });
            
            if (response.ok) {
                // Trigger download of CRX file
                const link = document.createElement('a');
                link.href = crxUrl;
                link.download = 'reply-guy-extension.crx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                this.updateStatus('download-started');
                this.showCrxInstructions();
            } else {
                throw new Error('Extension package not found. Please use manual installation.');
            }
        } catch (error) {
            throw new Error('Direct installation not available. Please use manual installation.');
        }
    }

    updateStatus(status, message = '') {
        const statusMessages = {
            ready: '',
            installing: '⏳ Starting installation...',
            'download-started': '📦 Extension downloaded! Follow the instructions below.',
            error: `❌ ${message}`,
            success: '✅ Extension installed successfully!'
        };

        if (this.statusDiv) {
            this.statusDiv.innerHTML = statusMessages[status] || message;
            this.statusDiv.className = `status-${status}`;
        }

        // Update button state
        if (this.quickInstallBtn) {
            switch (status) {
                case 'installing':
                    this.quickInstallBtn.disabled = true;
                    this.quickInstallBtn.textContent = 'Installing...';
                    break;
                case 'download-started':
                    this.quickInstallBtn.textContent = 'Download Started';
                    this.quickInstallBtn.disabled = true;
                    break;
                case 'error':
                    this.quickInstallBtn.disabled = false;
                    this.quickInstallBtn.textContent = 'Try Again';
                    break;
                case 'success':
                    this.quickInstallBtn.textContent = 'Installed!';
                    this.quickInstallBtn.disabled = true;
                    break;
                default:
                    this.quickInstallBtn.disabled = false;
                    this.quickInstallBtn.textContent = 'Install Extension';
            }
        }
    }

    showCrxInstructions() {
        const instructions = document.createElement('div');
        instructions.className = 'crx-instructions';
        instructions.innerHTML = `
            <div style="background: rgba(255, 204, 2, 0.1); border: 1px solid rgba(255, 204, 2, 0.3); border-radius: 8px; padding: 15px; margin-top: 15px;">
                <h4 style="color: #ffcc02; margin-bottom: 10px;">📦 CRX File Downloaded</h4>
                <ol style="margin: 0; padding-left: 20px; color: #ffffff;">
                    <li>Open the downloaded <code>reply-guy-extension.crx</code> file</li>
                    <li>Chrome will ask "Add Reply Guy?"</li>
                    <li>Click "Add extension" to install</li>
                    <li>Look for the Reply Guy icon in your toolbar!</li>
                </ol>
                <p style="margin-top: 10px; font-size: 12px; opacity: 0.8;">
                    If Chrome blocks the installation, use the manual method below.
                </p>
            </div>
        `;
        
        if (this.statusDiv) {
            this.statusDiv.appendChild(instructions);
        }
    }

    showManualInstructions() {
        const manualSection = document.querySelector('.manual-steps');
        if (manualSection) {
            manualSection.scrollIntoView({ behavior: 'smooth' });
            manualSection.style.border = '2px solid #ff6b35';
            manualSection.style.boxShadow = '0 0 20px rgba(255, 107, 53, 0.3)';
            
            setTimeout(() => {
                manualSection.style.border = '1px solid rgba(255, 204, 2, 0.3)';
                manualSection.style.boxShadow = 'none';
            }, 3000);
        }
    }
}

// Initialize installer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ExtensionInstaller();
});

// Add some CSS for status messages
const style = document.createElement('style');
style.textContent = `
    .status-installing { color: #ffc107; }
    .status-download-started { color: #28a745; }
    .status-error { color: #dc3545; }
    .status-success { color: #28a745; }
    
    .crx-instructions code {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 4px;
        border-radius: 3px;
        font-family: monospace;
    }
`;
document.head.appendChild(style);