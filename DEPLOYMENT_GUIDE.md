# 🚀 Vercel Deployment Guide for Reply Guy

Complete guide to deploy your Reply Guy website and extension to production.

## 📋 Pre-Deployment Checklist

### ✅ 1. Prepare Environment Variables
Create these environment variables in Vercel:

```bash
OPENROUTER_API_KEY=your_actual_openrouter_api_key
NODE_ENV=production
SITE_URL=https://your-app-name.vercel.app
```

### ✅ 2. Update Extension URLs
Before deploying, update the extension to use your production URL.

## 🚀 Vercel Deployment Steps

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy from your project directory**:
```bash
vercel
```

4. **Follow the prompts**:
   - Set up and deploy? **Y**
   - Which scope? **Your account**
   - Link to existing project? **N** (first time)
   - Project name? **reply-guy** (or your preferred name)
   - In which directory is your code located? **./** 
   - Want to override settings? **N**

5. **Set Environment Variables**:
```bash
vercel env add OPENROUTER_API_KEY
# Enter your OpenRouter API key when prompted

vercel env add NODE_ENV
# Enter: production

vercel env add SITE_URL
# Enter: https://your-app-name.vercel.app
```

6. **Deploy to Production**:
```bash
vercel --prod
```

### Method 2: GitHub Integration

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/reply-guy.git
git push -u origin main
```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import from GitHub
   - Select your repository
   - Configure environment variables
   - Deploy

## ⚙️ Environment Variables Setup

In Vercel Dashboard → Your Project → Settings → Environment Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `OPENROUTER_API_KEY` | `sk-or-v1-your-key...` | Production |
| `NODE_ENV` | `production` | Production |
| `SITE_URL` | `https://your-app.vercel.app` | Production |

## 🔧 Update Extension for Production

### 1. Update Extension URLs

**In `extension/popup.js`** (line 3):
```javascript
// CHANGE FROM:
this.serverUrl = 'http://localhost:3000';

// TO:
this.serverUrl = 'https://your-app-name.vercel.app';
```

**In `extension/update-checker.js`** (line 4):
```javascript
// CHANGE FROM:
this.updateCheckUrl = 'http://localhost:3000/api/extension-version';

// TO:
this.updateCheckUrl = 'https://your-app-name.vercel.app/api/extension-version';
```

**In `extension/manifest.json`**:
```json
{
  "host_permissions": [
    "https://your-app-name.vercel.app/*",
    "https://twitter.com/*",
    "https://x.com/*"
  ]
}
```

### 2. Recreate Extension Package

```bash
# Update extension files with production URLs
./setup-extension.sh

# Recreate CRX with your existing .pem key
# Go to chrome://extensions/ → Pack extension
# Use existing reply-guy-extension.pem file
mv extension.crx public/reply-guy-extension.crx
```

### 3. Update Server Version Endpoint

**In `server.js`**:
```javascript
app.get('/api/extension-version', (req, res) => {
    res.json({
        version: '1.0.0',
        downloadUrl: `${process.env.SITE_URL}/install`, // Uses production URL
        releaseNotes: 'Production release with improved performance.',
        required: false
    });
});
```

## 🌐 Domain Setup (Optional)

### Custom Domain:
1. **Buy domain** (e.g., replyguy.com)
2. **In Vercel Dashboard** → Domains → Add Domain
3. **Update DNS** records as instructed
4. **Update extension URLs** to use custom domain

## 📊 Post-Deployment Checklist

### ✅ Test Production Website:
- [ ] Visit your Vercel URL
- [ ] Test tweet analysis
- [ ] Test reply generation  
- [ ] Test extension download
- [ ] Check privacy policy page
- [ ] Test installation page

### ✅ Test Production Extension:
- [ ] Install extension with production URLs
- [ ] Test auto-fill from Twitter
- [ ] Test paste to Twitter
- [ ] Test update notifications
- [ ] Verify all features work

### ✅ Monitor Performance:
- [ ] Check Vercel Analytics
- [ ] Monitor API usage
- [ ] Watch for errors in logs
- [ ] Test rate limiting

## 🔄 Deployment Workflow

### For Future Updates:

1. **Make changes** to your code
2. **Test locally** with `npm start`
3. **Update version** if needed
4. **Deploy**:
   ```bash
   # If using CLI:
   vercel --prod
   
   # If using GitHub:
   git add .
   git commit -m "Update: description"
   git push origin main
   ```
5. **Update extension** if URLs changed
6. **Test production** deployment

## 🚨 Important Notes

### Security:
- ✅ Environment variables are secure in Vercel
- ✅ API key is not exposed to frontend
- ✅ HTTPS is automatically enabled
- ✅ Rate limiting is configured

### Performance:
- ✅ Vercel Edge Network for fast global access
- ✅ Automatic scaling based on usage
- ✅ Built-in CDN for static files
- ✅ Serverless functions for API endpoints

### Monitoring:
- 📊 Vercel Analytics for traffic insights
- 🔍 Function logs for debugging
- ⚡ Performance metrics
- 🚨 Error tracking

## 🎯 Expected Results

After successful deployment:

- **Website**: `https://your-app-name.vercel.app`
- **Extension Install**: `https://your-app-name.vercel.app/install`
- **Privacy Policy**: `https://your-app-name.vercel.app/privacy`
- **API Endpoints**: All working with production URLs
- **Extension**: Updated to use production backend

## 🎉 Go Live Checklist

- [ ] Website deployed and accessible
- [ ] Extension updated with production URLs
- [ ] All features tested and working
- [ ] Analytics and monitoring set up
- [ ] Ready to share with users!

Your Reply Guy is ready for the world! 🚀