import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Book,
  SavedTerm,
  ReadingProgress,
  AppSettings,
} from '../types/models';
import StorageService from '../services/storage';

/**
 * App Context - Global state management for the ELI5 Reader app
 * Provides centralized access to books, terms, progress, and settings
 */

interface AppContextType {
  // State
  books: Book[];
  savedTerms: SavedTerm[];
  currentBook: Book | null;
  settings: AppSettings;
  isLoading: boolean;

  // Book operations
  getAllBooks: () => Promise<void>;
  getBook: (id: string) => Promise<Book | null>;
  addBook: (book: Book) => Promise<void>;
  updateBook: (id: string, updates: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  openBook: (book: Book) => Promise<void>;
  setCurrentBook: (book: Book | null) => void;

  // Saved term operations
  getAllSavedTerms: () => Promise<void>;
  getSavedTermsByBook: (bookId: string) => SavedTerm[];
  saveTerm: (term: SavedTerm) => Promise<void>;
  deleteTerm: (id: string) => Promise<void>;

  // Reading progress operations
  getReadingProgress: (bookId: string) => Promise<ReadingProgress | null>;
  updateReadingProgress: (progress: ReadingProgress) => Promise<void>;

  // Settings operations
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;

  // Utility
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // State
  const [books, setBooks] = useState<Book[]>([]);
  const [savedTerms, setSavedTerms] = useState<SavedTerm[]>([]);
  const [currentBook, setCurrentBookState] = useState<Book | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    cacheEnabled: true,
    cacheExpirationDays: 30,
    preferredModel: 'gpt-4o-mini',
  });
  const [isLoading, setIsLoading] = useState(true);

  // =============== INITIALIZATION ===============

  /**
   * Load all data from AsyncStorage on mount
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);

        // Load all data in parallel
        const [loadedBooks, loadedTerms, loadedSettings] = await Promise.all([
          StorageService.getAllBooks(),
          StorageService.getAllSavedTerms(),
          StorageService.getSettings(),
        ]);

        setBooks(loadedBooks);
        setSavedTerms(loadedTerms);
        setSettings(loadedSettings);

        // Set current book to the one marked as current read
        const current = loadedBooks.find(book => book.isCurrentRead);
        if (current) {
          setCurrentBookState(current);
        }

        // Clear expired cache entries
        await StorageService.clearExpiredCache();
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // =============== BOOK OPERATIONS ===============

  const setCurrentBook = useCallback((book: Book | null) => {
    setCurrentBookState(book);
  }, []);

  const getAllBooks = useCallback(async () => {
    try {
      const loadedBooks = await StorageService.getAllBooks();
      setBooks(loadedBooks);
    } catch (error) {
      console.error('Error loading books:', error);
      throw error;
    }
  }, []);

  const getBook = useCallback(async (id: string): Promise<Book | null> => {
    try {
      return await StorageService.getBook(id);
    } catch (error) {
      console.error('Error getting book:', error);
      return null;
    }
  }, []);

  const addBook = useCallback(async (book: Book) => {
    try {
      await StorageService.saveBook(book);
      setBooks(prev => [...prev, book]);
    } catch (error) {
      console.error('Error adding book:', error);
      throw error;
    }
  }, []);

  const updateBook = useCallback(async (id: string, updates: Partial<Book>) => {
    try {
      await StorageService.updateBook(id, updates);

      // Update local state
      setBooks(prev =>
        prev.map(book => (book.id === id ? { ...book, ...updates } : book))
      );

      // Update current book if it's the one being updated
      if (currentBook?.id === id) {
        setCurrentBookState(prev => (prev ? { ...prev, ...updates } : null));
      }
    } catch (error) {
      console.error('Error updating book:', error);
      throw error;
    }
  }, [currentBook]);

  const deleteBook = useCallback(async (id: string) => {
    try {
      // Delete from storage (this also deletes associated terms and progress)
      await StorageService.deleteBook(id);

      // Update local state
      setBooks(prev => prev.filter(book => book.id !== id));
      setSavedTerms(prev => prev.filter(term => term.bookId !== id));

      // Clear current book if it was deleted
      if (currentBook?.id === id) {
        setCurrentBookState(null);
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  }, [currentBook]);

  const openBook = useCallback(async (book: Book) => {
    try {
      const openedAt = Date.now();
      const hasBook = books.some((existingBook) => existingBook.id === book.id);
      const baseBooks = hasBook ? books : [...books, book];
      const updatedBooks = baseBooks.map((existingBook) => ({
        ...existingBook,
        isCurrentRead: existingBook.id === book.id,
        lastOpenedAt: existingBook.id === book.id ? openedAt : existingBook.lastOpenedAt,
      }));

      await Promise.all(updatedBooks.map((updatedBook) => StorageService.saveBook(updatedBook)));

      const openedBook = updatedBooks.find((updatedBook) => updatedBook.id === book.id) || {
        ...book,
        isCurrentRead: true,
        lastOpenedAt: openedAt,
      };

      setBooks(updatedBooks);
      setCurrentBookState(openedBook);
    } catch (error) {
      console.error('Error opening book:', error);
      throw error;
    }
  }, [books]);

  // =============== SAVED TERM OPERATIONS ===============

  const getAllSavedTerms = useCallback(async () => {
    try {
      const loadedTerms = await StorageService.getAllSavedTerms();
      setSavedTerms(loadedTerms);
    } catch (error) {
      console.error('Error loading saved terms:', error);
      throw error;
    }
  }, []);

  const getSavedTermsByBook = useCallback(
    (bookId: string): SavedTerm[] => {
      return savedTerms.filter(term => term.bookId === bookId);
    },
    [savedTerms]
  );

  const saveTerm = useCallback(async (term: SavedTerm) => {
    try {
      await StorageService.saveTerm(term);

      // Update local state
      setSavedTerms(prev => {
        const existingIndex = prev.findIndex(t => t.id === term.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = term;
          return updated;
        }
        return [...prev, term];
      });
    } catch (error) {
      console.error('Error saving term:', error);
      throw error;
    }
  }, []);

  const deleteTerm = useCallback(async (id: string) => {
    try {
      await StorageService.deleteTerm(id);
      setSavedTerms(prev => prev.filter(term => term.id !== id));
    } catch (error) {
      console.error('Error deleting term:', error);
      throw error;
    }
  }, []);

  // =============== READING PROGRESS OPERATIONS ===============

  const getReadingProgress = useCallback(
    async (bookId: string): Promise<ReadingProgress | null> => {
      try {
        return await StorageService.getReadingProgress(bookId);
      } catch (error) {
        console.error('Error getting reading progress:', error);
        return null;
      }
    },
    []
  );

  const updateReadingProgress = useCallback(
    async (progress: ReadingProgress) => {
      try {
        await StorageService.saveReadingProgress(progress);

        // Update the book's reading progress in local state
        setBooks(prev =>
          prev.map(book =>
            book.id === progress.bookId
              ? { ...book, readingProgress: progress }
              : book
          )
        );

        // Update current book if applicable
        if (currentBook?.id === progress.bookId) {
          setCurrentBookState(prev =>
            prev ? { ...prev, readingProgress: progress } : null
          );
        }
      } catch (error) {
        console.error('Error updating reading progress:', error);
        throw error;
      }
    },
    [currentBook]
  );

  // =============== SETTINGS OPERATIONS ===============

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await StorageService.saveSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }, [settings]);

  // =============== UTILITY ===============

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [loadedBooks, loadedTerms] = await Promise.all([
        StorageService.getAllBooks(),
        StorageService.getAllSavedTerms(),
      ]);
      setBooks(loadedBooks);
      setSavedTerms(loadedTerms);
    } catch (error) {
      console.error('Error refreshing data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =============== CONTEXT VALUE ===============

  const value: AppContextType = {
    // State
    books,
    savedTerms,
    currentBook,
    settings,
    isLoading,

    // Book operations
    getAllBooks,
    getBook,
    addBook,
    updateBook,
    deleteBook,
    openBook,
    setCurrentBook,

    // Saved term operations
    getAllSavedTerms,
    getSavedTermsByBook,
    saveTerm,
    deleteTerm,

    // Reading progress operations
    getReadingProgress,
    updateReadingProgress,

    // Settings operations
    updateSettings,

    // Utility
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
