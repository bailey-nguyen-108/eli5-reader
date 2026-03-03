# Quick Start Guide

## Running the App

### Option 1: Run on iOS Simulator (Mac only)
```bash
npm run ios
```

### Option 2: Run on Android Emulator
```bash
npm run android
```

### Option 3: Run on Your Physical Device

1. Install Expo Go app:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Start the development server:
```bash
npm start
```

3. Scan the QR code:
   - **iOS**: Use the Camera app
   - **Android**: Use the Expo Go app scanner

## Testing the App

Since PDF text extraction requires native implementation, the app includes **demo data** that simulates the full flow:

### Demo Flow:

1. **Upload a PDF** - Select any PDF file
2. **Processing Simulation** - The app simulates:
   - Text extraction
   - AI summarization
   - Key points generation
3. **Pre-loaded Content** - Shows "Raise Your Game" book with:
   - 10 key points
   - 10 insights
   - 14-minute reading time
   - Full quiz with 10 questions

### What You'll See:

✅ **Home Screen** - Empty library with upload button
✅ **Upload Flow** - File picker and processing overlay
✅ **Book Summary** - Beautiful Headway-style summary screen
✅ **Reading Mode** - Navigate through key points
✅ **Quiz** - Test your knowledge with 10 questions
✅ **Results** - See your score and performance

## Next Steps for Production

To make this production-ready:

### 1. Add Real PDF Parsing

Replace the demo data in `src/services/pdfService.ts`:

```typescript
// Option A: Backend service
export async function extractTextFromPDF(pdfUri: string) {
  const formData = new FormData();
  formData.append('file', {
    uri: pdfUri,
    type: 'application/pdf',
    name: 'book.pdf'
  });

  const response = await fetch('YOUR_BACKEND_URL/extract-pdf', {
    method: 'POST',
    body: formData
  });

  return await response.json();
}

// Option B: Cloud service (AWS Textract, Google Cloud Vision)
// Option C: Native library integration
```

### 2. Add Real AI Integration

Update `src/services/aiService.ts` with your AI provider:

```typescript
export async function generateBookSummary(text: string, title: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: `Analyze this book titled "${title}" and provide:
        1. A concise overview (2-3 sentences)
        2. 10 key points with detailed descriptions
        3. 10 actionable insights
        4. Estimated reading time in minutes

        Book content: ${text}

        Format as JSON matching the BookSummary interface.`
      }]
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
```

### 3. Add Cloud Storage (Optional)

For syncing across devices:
- Firebase Firestore
- AWS Amplify
- Supabase

### 4. Monetization Options

- Freemium model (5 free books, then subscription)
- One-time purchase
- Ad-supported free version

## Troubleshooting

### "Metro bundler won't start"
```bash
# Clear cache and restart
npm start -- --clear
```

### "Dependencies not installed"
```bash
# Reinstall all dependencies
rm -rf node_modules
npm install
```

### "iOS build fails"
```bash
# Install CocoaPods dependencies
cd ios && pod install && cd ..
npm run ios
```

### "Android build fails"
```bash
# Clean Android build
cd android && ./gradlew clean && cd ..
npm run android
```

## Features Demonstrated

✅ PDF file upload
✅ Book library with covers
✅ AI-powered summaries (demo)
✅ Interactive reading with key points
✅ Progress tracking
✅ Knowledge check quizzes
✅ Performance metrics
✅ Local data persistence
✅ Smooth animations
✅ Beautiful Headway-inspired UI

## Need Help?

Check out:
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)

---

Happy building! 🚀
