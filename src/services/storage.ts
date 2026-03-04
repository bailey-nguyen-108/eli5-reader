import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Book,
  SavedTerm,
  ReadingProgress,
  ELI5Cache,
  AppSettings,
  STORAGE_KEYS,
} from '../types/models';

/**
 * Storage Service - AsyncStorage wrapper with CRUD operations
 * Handles all data persistence for the ELI5 Reader app
 */
class StorageService {
  // =============== BOOKS ===============

  async getAllBooks(): Promise<Book[]> {
    try {
      const booksJSON = await AsyncStorage.getItem(STORAGE_KEYS.BOOKS);
      return booksJSON ? JSON.parse(booksJSON) : [];
    } catch (error) {
      console.error('Error loading books:', error);
      return [];
    }
  }

  async getBook(id: string): Promise<Book | null> {
    try {
      const books = await this.getAllBooks();
      return books.find((book) => book.id === id) || null;
    } catch (error) {
      console.error('Error getting book:', error);
      return null;
    }
  }

  async saveBook(book: Book): Promise<void> {
    try {
      const books = await this.getAllBooks();
      const existingIndex = books.findIndex((b) => b.id === book.id);

      if (existingIndex >= 0) {
        // Update existing book
        books[existingIndex] = book;
      } else {
        // Add new book
        books.push(book);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    } catch (error) {
      console.error('Error saving book:', error);
      throw error;
    }
  }

  async deleteBook(id: string): Promise<void> {
    try {
      // Delete book
      const books = await this.getAllBooks();
      const filteredBooks = books.filter((book) => book.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(filteredBooks));

      // Delete associated saved terms
      const terms = await this.getAllSavedTerms();
      const filteredTerms = terms.filter((term) => term.bookId !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_TERMS, JSON.stringify(filteredTerms));

      // Delete reading progress
      await this.deleteReadingProgress(id);

      // Note: Cached explanations are kept (they may be useful for other books)
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  }

  async updateBook(id: string, updates: Partial<Book>): Promise<void> {
    try {
      const book = await this.getBook(id);
      if (!book) {
        throw new Error(`Book with id ${id} not found`);
      }

      const updatedBook = { ...book, ...updates };
      await this.saveBook(updatedBook);
    } catch (error) {
      console.error('Error updating book:', error);
      throw error;
    }
  }

  // =============== SAVED TERMS ===============

  async getAllSavedTerms(): Promise<SavedTerm[]> {
    try {
      const termsJSON = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_TERMS);
      return termsJSON ? JSON.parse(termsJSON) : [];
    } catch (error) {
      console.error('Error loading saved terms:', error);
      return [];
    }
  }

  async getSavedTermsByBook(bookId: string): Promise<SavedTerm[]> {
    try {
      const terms = await this.getAllSavedTerms();
      return terms.filter((term) => term.bookId === bookId);
    } catch (error) {
      console.error('Error getting terms by book:', error);
      return [];
    }
  }

  async saveTerm(term: SavedTerm): Promise<void> {
    try {
      const terms = await this.getAllSavedTerms();
      const existingIndex = terms.findIndex((t) => t.id === term.id);

      if (existingIndex >= 0) {
        terms[existingIndex] = term;
      } else {
        terms.push(term);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_TERMS, JSON.stringify(terms));
    } catch (error) {
      console.error('Error saving term:', error);
      throw error;
    }
  }

  async deleteTerm(id: string): Promise<void> {
    try {
      const terms = await this.getAllSavedTerms();
      const filteredTerms = terms.filter((term) => term.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_TERMS, JSON.stringify(filteredTerms));
    } catch (error) {
      console.error('Error deleting term:', error);
      throw error;
    }
  }

  // =============== READING PROGRESS ===============

  async getAllReadingProgress(): Promise<ReadingProgress[]> {
    try {
      const progressJSON = await AsyncStorage.getItem(STORAGE_KEYS.READING_PROGRESS);
      return progressJSON ? JSON.parse(progressJSON) : [];
    } catch (error) {
      console.error('Error loading reading progress:', error);
      return [];
    }
  }

  async getReadingProgress(bookId: string): Promise<ReadingProgress | null> {
    try {
      const progressList = await this.getAllReadingProgress();
      return progressList.find((p) => p.bookId === bookId) || null;
    } catch (error) {
      console.error('Error getting reading progress:', error);
      return null;
    }
  }

  async saveReadingProgress(progress: ReadingProgress): Promise<void> {
    try {
      const progressList = await this.getAllReadingProgress();
      const existingIndex = progressList.findIndex((p) => p.bookId === progress.bookId);

      if (existingIndex >= 0) {
        progressList[existingIndex] = progress;
      } else {
        progressList.push(progress);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.READING_PROGRESS, JSON.stringify(progressList));
    } catch (error) {
      console.error('Error saving reading progress:', error);
      throw error;
    }
  }

  async deleteReadingProgress(bookId: string): Promise<void> {
    try {
      const progressList = await this.getAllReadingProgress();
      const filteredProgress = progressList.filter((p) => p.bookId !== bookId);
      await AsyncStorage.setItem(STORAGE_KEYS.READING_PROGRESS, JSON.stringify(filteredProgress));
    } catch (error) {
      console.error('Error deleting reading progress:', error);
      throw error;
    }
  }

  // =============== ELI5 CACHE ===============

  private getCacheKey(term: string, context: string): string {
    // Simple hash: combine term and first 50 chars of context
    return `${term.toLowerCase()}_${context.substring(0, 50)}`;
  }

  async getCachedExplanation(cacheKey: string): Promise<any | null> {
    try {
      const cacheJSON = await AsyncStorage.getItem(STORAGE_KEYS.ELI5_CACHE);
      if (!cacheJSON) return null;

      const cache: Record<string, any> = JSON.parse(cacheJSON);
      const entry = cache[cacheKey];

      if (!entry) return null;

      // Check if expired (30 days)
      const now = Date.now();
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      if (entry.cachedAt && now - entry.cachedAt > thirtyDaysInMs) {
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Error getting cached explanation:', error);
      return null;
    }
  }

  async cacheExplanation(cacheKey: string, data: any): Promise<void> {
    try {
      const cacheJSON = await AsyncStorage.getItem(STORAGE_KEYS.ELI5_CACHE);
      const cache: Record<string, any> = cacheJSON ? JSON.parse(cacheJSON) : {};

      cache[cacheKey] = {
        data,
        cachedAt: Date.now(),
      };

      await AsyncStorage.setItem(STORAGE_KEYS.ELI5_CACHE, JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching explanation:', error);
      // Don't throw - caching is optional
    }
  }

  async clearExpiredCache(): Promise<void> {
    try {
      const cacheJSON = await AsyncStorage.getItem(STORAGE_KEYS.ELI5_CACHE);
      if (!cacheJSON) return;

      const cache: ELI5Cache[] = JSON.parse(cacheJSON);
      const now = Date.now();

      const validCache = cache.filter((item) => item.expiresAt > now);

      await AsyncStorage.setItem(STORAGE_KEYS.ELI5_CACHE, JSON.stringify(validCache));
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  // =============== APP SETTINGS ===============

  async getSettings(): Promise<AppSettings> {
    try {
      const settingsJSON = await AsyncStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      return settingsJSON
        ? JSON.parse(settingsJSON)
        : {
            cacheEnabled: true,
            cacheExpirationDays: 30,
            preferredModel: 'gpt-4o-mini',
          };
    } catch (error) {
      console.error('Error loading settings:', error);
      return {
        cacheEnabled: true,
        cacheExpirationDays: 30,
        preferredModel: 'gpt-4o-mini',
      };
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  // =============== UTILITY ===============

  async clearAll(): Promise<void> {
    try {
      await Promise.all([
        STORAGE_KEYS.BOOKS,
        STORAGE_KEYS.SAVED_TERMS,
        STORAGE_KEYS.READING_PROGRESS,
        STORAGE_KEYS.ELI5_CACHE,
        STORAGE_KEYS.APP_SETTINGS,
      ].map((key) => AsyncStorage.removeItem(key)));
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new StorageService();
