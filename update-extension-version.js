#!/usr/bin/env node

/**
 * Helper script to update extension version information
 * Usage: node update-extension-version.js <version> <changes...>
 * Example: node update-extension-version.js 1.5.0 "Added new features" "Fixed bugs" "Improved performance"
 */

const fs = require('fs');
const path = require('path');

function updateExtensionVersion(version, changes) {
    const now = new Date();
    const updateTime = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });

    // Update server.js
    const serverPath = path.join(__dirname, 'server.js');
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    const versionRegex = /version: '[^']+'/;
    const updateDateRegex = /updateDate: '[^']+'/;
    const updateTimeRegex = /updateTime: '[^']+'/;
    const changesRegex = /changes: \[[^\]]+\]/s;
    
    serverContent = serverContent.replace(versionRegex, `version: '${version}'`);
    serverContent = serverContent.replace(updateDateRegex, `updateDate: '${now.toISOString()}'`);
    serverContent = serverContent.replace(updateTimeRegex, `updateTime: '${updateTime}'`);
    
    const changesArray = changes.map(change => `            '${change}'`).join(',\n');
    serverContent = serverContent.replace(changesRegex, `changes: [\n${changesArray}\n        ]`);
    
    fs.writeFileSync(serverPath, serverContent);

    // Update extension manifest.json
    const manifestPath = path.join(__dirname, 'extension', 'manifest.json');
    let manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    manifest.version = version;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`✅ Updated extension to version ${version}`);
    console.log(`📅 Update time: ${updateTime}`);
    console.log(`📝 Changes:`);
    changes.forEach((change, index) => {
        console.log(`   ${index + 1}. ${change}`);
    });
    console.log(`\n🔄 Next steps:`);
    console.log(`   1. Test the changes`);
    console.log(`   2. Run: zip -r public/reply-guy-extension.zip extension/`);
    console.log(`   3. Commit and push changes`);
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Usage: node update-extension-version.js <version> <change1> [change2] [change3] ...');
    console.error('Example: node update-extension-version.js 1.5.0 "Added new features" "Fixed bugs"');
    process.exit(1);
}

const version = args[0];
const changes = args.slice(1);

updateExtensionVersion(version, changes);