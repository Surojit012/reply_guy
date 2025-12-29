// Background script for Reply Guy extension

// Import update checker
importScripts('update-checker.js');

chrome.runtime.onInstalled.addListener(() => {
    console.log('Reply Guy extension installed!');
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fillTweet') {
        // Store tweet text for popup to access
        chrome.storage.local.set({
            pendingTweet: request.tweetText,
            timestamp: Date.now()
        });
        
        // Show notification badge
        chrome.action.setBadgeText({
            text: '1',
            tabId: sender.tab.id
        });
        
        chrome.action.setBadgeBackgroundColor({
            color: '#ff6b35'
        });
        
        // Clear badge after 10 seconds
        setTimeout(() => {
            chrome.action.setBadgeText({
                text: '',
                tabId: sender.tab.id
            });
        }, 10000);
    }
});

// Clear badge when popup is opened
chrome.action.onClicked.addListener((tab) => {
    chrome.action.setBadgeText({
        text: '',
        tabId: tab.id
    });
});