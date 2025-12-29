// Content script for Twitter integration - DISABLED
// This script is intentionally minimal to avoid adding buttons to tweets

(function() {
    'use strict';
    
    // Listen for messages from popup only
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'getTweetText') {
            const tweetText = extractTweetText();
            sendResponse({ tweetText });
        }
    });
    
    function extractTweetText() {
        const tweetSelectors = [
            '[data-testid="tweet"] [data-testid="tweetText"]',
            '[role="article"] [data-testid="tweetText"]'
        ];
        
        for (const selector of tweetSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                for (const element of elements) {
                    if (element.offsetParent !== null) {
                        return element.textContent.trim();
                    }
                }
            }
        }
        
        return null;
    }
})();