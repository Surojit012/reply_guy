# 🚀 Production Setup for Reply Guy Extension

## Important: Update Server URL for Production

Before publishing your extension, you need to update the server URL from localhost to your production domain.

### 1. Update popup.js

In `extension/popup.js`, change line 3:

```javascript
// CHANGE THIS:
this.serverUrl = 'http://localhost:3000';

// TO YOUR PRODUCTION URL:
this.serverUrl = 'https://your-domain.com';
```

### 2. Update manifest.json

In `extension/manifest.json`, update the host_permissions:

```json
{
  "host_permissions": [
    "https://your-domain.com/*"
  ]
}
```

Remove the localhost permission for production.

### 3. Deploy Your Backend

Make sure your Reply Guy backend is deployed and accessible at your production URL:

- Deploy to platforms like Heroku, Railway, Vercel, or DigitalOcean
- Ensure HTTPS is enabled
- Test all API endpoints work correctly
- Update CORS settings to allow your extension

### 4. Test Production Extension

1. Update the URLs as described above
2. Create new extension package: `./setup-extension.sh`
3. Load the updated extension in Chrome
4. Test all features work with your production backend

### 5. Environment Variables for Production

Make sure your production server has:

```bash
OPENROUTER_API_KEY=your_actual_api_key
NODE_ENV=production
PORT=443 (or your server's port)
SITE_URL=https://your-domain.com
```

## Security Considerations

- Use HTTPS for all production communications
- Implement rate limiting on your backend
- Monitor API usage and costs
- Consider implementing user authentication for heavy usage
- Set up proper error logging and monitoring

## Deployment Checklist

- [ ] Backend deployed to production
- [ ] HTTPS enabled and working
- [ ] Environment variables set correctly
- [ ] API endpoints tested and working
- [ ] Extension URLs updated to production
- [ ] Extension tested with production backend
- [ ] Rate limiting configured
- [ ] Error monitoring set up
- [ ] Privacy policy updated with correct URLs

Your extension will now work for all users without requiring them to get their own API keys! 🎉