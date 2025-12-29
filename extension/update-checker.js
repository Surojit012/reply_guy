// Auto-update checker for Reply Guy extension
class UpdateChecker {
    constructor() {
        this.currentVersion = chrome.runtime.getManifest().version;
        this.updateCheckUrl = 'http://localhost:3000/api/extension-version'; // Change to your production URL
        this.checkInterval = 24 * 60 * 60 * 1000; // Check daily
        
        this.init();
    }

    init() {
        // Check for updates when extension starts
        this.checkForUpdates();
        
        // Set up periodic checks
        setInterval(() => {
            this.checkForUpdates();
        }, this.checkInterval);
    }

    async checkForUpdates() {
        try {
            const response = await fetch(this.updateCheckUrl);
            const data = await response.json();
            
            if (data.version && this.isNewerVersion(data.version, this.currentVersion)) {
                this.showUpdateNotification(data);
            }
        } catch (error) {
            console.log('Update check failed:', error);
            // Fail silently - don't bother users with network errors
        }
    }

    isNewerVersion(remoteVersion, currentVersion) {
        const remote = remoteVersion.split('.').map(Number);
        const current = currentVersion.split('.').map(Number);
        
        for (let i = 0; i < Math.max(remote.length, current.length); i++) {
            const r = remote[i] || 0;
            const c = current[i] || 0;
            
            if (r > c) return true;
            if (r < c) return false;
        }
        
        return false;
    }

    showUpdateNotification(updateData) {
        // Create notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iIzMzMDA2NiIvPgo8dGV4dCB4PSIyNCIgeT0iMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2ZmNmIzNSI+8J+UpTwvdGV4dD4KPC9zdmc+',
            title: 'Reply Guy Update Available!',
            message: `Version ${updateData.version} is available. Click to download the latest version with new features and improvements.`
        }, (notificationId) => {
            // Store update info for when user clicks
            chrome.storage.local.set({
                pendingUpdate: updateData,
                updateNotificationId: notificationId
            });
        });

        // Handle notification click
        chrome.notifications.onClicked.addListener((notificationId) => {
            chrome.storage.local.get(['updateNotificationId', 'pendingUpdate'], (result) => {
                if (result.updateNotificationId === notificationId) {
                    // Open update page
                    chrome.tabs.create({
                        url: updateData.downloadUrl || 'http://localhost:3000/install'
                    });
                    
                    // Clear notification
                    chrome.notifications.clear(notificationId);
                    chrome.storage.local.remove(['pendingUpdate', 'updateNotificationId']);
                }
            });
        });
    }
}

// Initialize update checker
new UpdateChecker();