// Core data models for ELI5 Reader app

export interface Book {
  id: string;
  title: string;
  author: string;
  abbr: string[]; // abbreviation letters for cover display
  format: 'PDF' | 'EPUB' | 'TXT' | 'MOBI' | 'DOCX';
  accentColor: string; // hex color for visual styling

  // File information
  fileName: string;
  fileSize: number; // in bytes
  filePath: string; // local file URI

  // Content (parsed text)
  content: BookContent;

  // Metadata
  uploadedAt: number; // timestamp
  lastOpenedAt?: number; // timestamp
  isCurrentRead?: boolean;

  // Reading progress
  readingProgress?: ReadingProgress;
}

export interface BookContent {
  chapters: Chapter[];
  totalWords: number;
}

export interface Chapter {
  id: string;
  title: string;
  content: string; // plain text content
  startPosition: number; // character position in full book
  endPosition: number; // character position in full book
  wordCount: number;
}

export interface ReadingProgress {
  bookId: string;
  currentChapterId: string;
  currentPosition: number; // scroll position or character index
  lastReadAt: number; // timestamp
  percentComplete: number; // 0-100
}

// Saved term with book relationship
export interface SavedTerm {
  id: string;
  bookId: string; // which book this term came from
  chapterId: string; // which chapter in the book

  term: string; // the highlighted term/phrase
  explanation: string; // ELI5 explanation from AI

  // Metadata from ELI5
  complexity: 'Easy' | 'Medium' | 'Hard';
  field: string; // e.g., 'Physics', 'Biology', 'Philosophy'

  // Context tracking
  contextSnippet: string; // surrounding text for context (±100 chars)

  savedAt: number; // timestamp
}

// AI response cache to minimize API costs
export interface ELI5Cache {
  term: string; // the term that was explained
  context: string; // hash or snippet of surrounding text
  explanation: string; // cached AI response
  cachedAt: number; // timestamp
  expiresAt: number; // timestamp (30 days from cache)
}

// App settings
export interface AppSettings {
  openaiApiKey?: string;
  claudeApiKey?: string;
  preferredModel?: string; // e.g. 'gpt-4o-mini'
  cacheEnabled?: boolean;
  cacheExpirationDays?: number;
}

// Storage keys constants
export const STORAGE_KEYS = {
  BOOKS: '@eli5_books',
  SAVED_TERMS: '@eli5_saved_terms',
  READING_PROGRESS: '@eli5_reading_progress',
  ELI5_CACHE: '@eli5_cache',
  APP_SETTINGS: '@eli5_settings',
} as const;
