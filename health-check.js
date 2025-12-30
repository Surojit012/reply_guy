#!/usr/bin/env node

const https = require('https');

const SITE_URL = 'https://reply-guy-eta.vercel.app';

async function checkHealth() {
    console.log('🔍 Checking deployment health...');
    
    try {
        // Check main page
        await checkEndpoint('/', 'Main page');
        
        // Check API health
        await checkEndpoint('/api/health', 'API health');
        
        // Check installation page
        await checkEndpoint('/install', 'Installation page');
        
        console.log('✅ All health checks passed!');
        
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        process.exit(1);
    }
}

function checkEndpoint(path, name) {
    return new Promise((resolve, reject) => {
        const url = `${SITE_URL}${path}`;
        
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                console.log(`✅ ${name}: OK (${res.statusCode})`);
                resolve();
            } else {
                reject(new Error(`${name} returned ${res.statusCode}`));
            }
        }).on('error', (error) => {
            reject(new Error(`${name} request failed: ${error.message}`));
        });
    });
}

// Run health check
checkHealth();