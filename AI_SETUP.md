# How to Enable AI-Powered ELI5 Explanations

Your ELI5 Reader supports real AI explanations using the OpenAI GPT API.

## Step 1: Get Your OpenAI API Key

1. Create or sign in to your OpenAI account at https://platform.openai.com/
2. Go to API keys and create a new secret key
3. Copy the key and keep it private

## Step 2: Add the Key to the App

### Recommended: Expo environment variable

Create a `.env` file in the project root:

```bash
EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-your-key-here
```

Then restart Expo so the env var is picked up.

### Alternative: Save it in local app settings

If you are testing in the browser, you can save it directly:

```javascript
localStorage.setItem('@eli5_settings', JSON.stringify({
  openaiApiKey: 'sk-proj-your-key-here',
  cacheEnabled: true,
  cacheExpirationDays: 30,
  preferredModel: 'gpt-4o-mini'
}));
```

## Step 3: Test It Out

1. Import a book (TXT or EPUB)
2. Open the book in Reader
3. Highlight any word or phrase
4. Click "ELI5"
5. Wait 1-2 seconds for the AI explanation!

## How It Works

### AI Model
- **GPT-4o mini** - Fast and affordable model for short explanations
- **Cost**: typically very low for short ELI5 responses
- **Speed**: 1-2 seconds per response

### Caching
- Explanations are cached for 30 days
- Same term in same context = instant (free) response
- Reduces API costs significantly

### Fallback
- If no API key is configured, you'll see a placeholder explanation
- If the API call fails, you'll get an error message

## Troubleshooting

### "OpenAI API key not configured"
- You haven't added your API key yet
- Add `EXPO_PUBLIC_OPENAI_API_KEY` or save `openaiApiKey` in local storage

### "Failed to get AI explanation"
- Check your API key is correct
- Ensure your OpenAI account has billing enabled
- Check browser console for detailed error

### "No response from AI"
- Your API key might be invalid
- You might be out of credits
- Network issue - check your internet connection

## Privacy & Security

- Your API key is stored locally if you use browser storage
- Never shared or sent anywhere except OpenAI's API
- Your books and explanations stay on your device
- Only the selected term + context is sent to OpenAI

## Next Steps

Future enhancements:
1. **Settings Screen** - Manage API key, preferences, and usage
2. **Usage Dashboard** - Track how many explanations you've used
3. **Model Selection** - Choose between GPT models
4. **Offline Mode** - Use cached explanations without internet
5. **Export Explanations** - Save your notebook to PDF or markdown
