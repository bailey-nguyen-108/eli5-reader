# Book Summary App

A mobile app that transforms PDFs into engaging, interactive learning experiences with AI-powered summaries and gamification.

![App Design](https://img.shields.io/badge/Design-Headway_Inspired-blue)
![React Native](https://img.shields.io/badge/React_Native-Expo-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## Features

### 📚 PDF Processing
- Upload PDF books directly from your device
- Automatic text extraction
- Metadata extraction (title, author)

### 🤖 AI-Powered Summaries
- Generates concise overviews
- Extracts 10 key points from each book
- Identifies actionable insights
- Estimates reading time

### 🎨 Beautiful UI
- Headway-inspired design
- Smooth animations
- Intuitive navigation
- Book cover display with progress tracking

### 📖 Interactive Reading Experience
- Navigate through key points one at a time
- Progress tracking
- Related insights for each key point
- Smooth transitions between content

### 🎮 Gamification
- Knowledge check quizzes after reading
- 10 contextual questions per book
- Immediate feedback with explanations
- Score tracking and performance metrics
- Retry option to improve understanding

### 💾 Persistent Storage
- All books saved locally
- Reading progress tracked
- Quiz scores stored

## Screenshots

### Home Screen
- Library view with all your books
- Book covers with completion badges
- Upload button for new PDFs

### Book Summary Screen
- Book cover and metadata
- Overview and key stats
- Preview of key points
- "Read" and "Listen" buttons

### Reading Screen
- One key point at a time
- Progress bar
- Previous/Next navigation
- Related insights

### Quiz Screen
- Multiple choice questions
- Immediate feedback
- Explanations for each answer
- Score tracking

### Results Screen
- Performance summary
- Detailed statistics
- Retry or finish options

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation
- **UI**: React Native + Expo Linear Gradient
- **Storage**: AsyncStorage
- **PDF Handling**: Expo Document Picker + File System

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo Go app (for testing on physical device)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your device:
- Scan the QR code with Expo Go (Android)
- Scan the QR code with Camera app (iOS)

Or run on simulator:
```bash
npm run ios     # iOS Simulator
npm run android # Android Emulator
npm run web     # Web browser
```

## Project Structure

```
book-summary/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx           # Library view
│   │   ├── BookSummaryScreen.tsx    # Book overview
│   │   ├── ReadingScreen.tsx        # Read key points
│   │   ├── QuizScreen.tsx           # Knowledge check
│   │   └── QuizResultsScreen.tsx    # Quiz results
│   ├── services/
│   │   ├── pdfService.ts            # PDF processing
│   │   ├── aiService.ts             # AI summarization
│   │   └── storageService.ts        # Local storage
│   └── types/
│       └── Book.ts                  # TypeScript types
├── App.tsx                          # Main app component
└── package.json
```

## How It Works

### 1. Upload a PDF
Tap the "Upload PDF" button and select a PDF book from your device.

### 2. Processing
The app:
- Extracts text from the PDF
- Identifies the title and author
- Generates an AI-powered summary with:
  - Concise overview
  - 10 key points
  - Actionable insights
  - Estimated reading time

### 3. Read & Learn
- Browse your book in the library
- Tap to view the summary
- Read key points one at a time
- Progress through the content at your own pace

### 4. Test Your Knowledge
- Complete a quiz after reading
- 10 questions based on key points
- Get immediate feedback
- See explanations for each answer

### 5. Track Progress
- View completion percentage
- See quiz scores
- Retry quizzes to improve understanding

## Customization

### Adding Real AI Integration

The app currently uses demo data for AI summaries. To integrate with real AI:

1. Choose an AI provider (OpenAI, Anthropic Claude, etc.)
2. Update `src/services/aiService.ts`:

```typescript
export async function generateBookSummary(
  bookText: string,
  title: string
): Promise<BookSummary> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': YOUR_API_KEY,
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Analyze this book: ${bookText}...`
      }]
    })
  });
  // Process response...
}
```

### Adding Real PDF Parsing

For production PDF parsing, consider:
- Backend service with `pdf-parse`
- Cloud services (AWS Textract, Google Cloud Vision)
- Native PDF libraries for React Native

Update `src/services/pdfService.ts` with your chosen solution.

## Future Enhancements

- [ ] Listen mode with text-to-speech
- [ ] Flashcards for spaced repetition
- [ ] Social sharing features
- [ ] Cloud sync across devices
- [ ] Highlighting and note-taking
- [ ] Reading streaks and achievements
- [ ] Multiple language support
- [ ] Dark mode

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for learning or building your own book summary app!

## Acknowledgments

- Design inspired by Headway
- Built with React Native and Expo
- TypeScript for type safety
- React Navigation for seamless navigation

---

Built with ❤️ using Claude Code
