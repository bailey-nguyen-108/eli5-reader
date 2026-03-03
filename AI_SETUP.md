# How to Enable AI-Powered ELI5 Explanations

Your ELI5 Reader now supports real AI explanations using Claude API! Follow these steps to set it up.

## Step 1: Get Your Claude API Key

1. **Create an Anthropic account:**
   - Go to https://console.anthropic.com/
   - Sign up for an account (if you don't have one)

2. **Add credits to your account:**
   - Go to Settings → Billing
   - Add at least $5 in credits
   - Claude Haiku costs ~$0.001 per explanation (very cheap!)

3. **Generate an API key:**
   - Go to Settings → API Keys
   - Click "Create Key"
   - Copy your API key (starts with `sk-ant-`)
   - Save it somewhere safe!

## Step 2: Add API Key to Your App

### Method 1: Using Browser Console (Quick & Easy)

1. Open your app in the browser
2. Open Developer Tools (F12 or Cmd+Option+I on Mac)
3. Go to the "Console" tab
4. Paste this code and replace `YOUR_API_KEY` with your actual key:

```javascript
// Add your Claude API key
localStorage.setItem('@eli5_settings', JSON.stringify({
  claudeApiKey: 'sk-ant-api03-YOUR_ACTUAL_KEY_HERE',
  cacheEnabled: true,
  cacheExpirationDays: 30,
  preferredModel: 'haiku'
}));

// Verify it was saved
console.log('Settings saved!');
```

5. Refresh the page

### Method 2: Create a Settings Screen (Future Enhancement)

We'll add a proper Settings screen where you can:
- Add/update your API key
- Toggle caching on/off
- Choose between Haiku (faster/cheaper) and Sonnet (smarter/pricier)
- View your usage stats

## Step 3: Test It Out

1. Import a book (TXT or EPUB)
2. Open the book in Reader
3. Highlight any word or phrase
4. Click "ELI5"
5. Wait 1-2 seconds for the AI explanation!

## How It Works

### AI Model
- **Claude 3 Haiku** - Fast and affordable AI model
- **Cost**: ~$0.001 per explanation (100 explanations ≈ $0.10)
- **Speed**: 1-2 seconds per response

### Caching
- Explanations are cached for 30 days
- Same term in same context = instant (free) response
- Reduces API costs significantly

### Fallback
- If no API key is configured, you'll see a placeholder explanation
- If the API call fails, you'll get an error message

## Troubleshooting

### "Please configure your Claude API key in Settings"
- You haven't added your API key yet
- Follow Method 1 above to add it

### "Failed to get AI explanation"
- Check your API key is correct
- Ensure you have credits in your Anthropic account
- Check browser console for detailed error

### "No response from AI"
- Your API key might be invalid
- You might be out of credits
- Network issue - check your internet connection

## Cost Estimation

Claude Haiku pricing (as of 2024):
- **Input**: $0.25 per million tokens
- **Output**: $1.25 per million tokens

For ELI5 explanations:
- Average input: ~300 tokens (term + context)
- Average output: ~100 tokens (2-3 sentence explanation)
- **Cost per explanation**: ~$0.0002 to $0.0005

With $5 in credits:
- **~10,000 to 25,000 explanations**
- More than enough for extensive reading!

## Privacy & Security

- Your API key is stored locally in browser storage
- Never shared or sent anywhere except Anthropic's API
- Your books and explanations stay on your device
- Only the selected term + context is sent to Claude

## Next Steps

Future enhancements:
1. **Settings Screen** - Manage API key, preferences, and usage
2. **Usage Dashboard** - Track how many explanations you've used
3. **Multiple Models** - Choose between Haiku, Sonnet, or Opus
4. **Offline Mode** - Use cached explanations without internet
5. **Export Explanations** - Save your notebook to PDF or markdown

---

**Your ELI5 Reader is ready for AI-powered learning! 🚀**

Start reading smarter with personalized explanations for every complex term you encounter.
