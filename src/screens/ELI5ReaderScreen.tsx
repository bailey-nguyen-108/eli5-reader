import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Clipboard from 'expo-clipboard';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import ELI5Sheet from '../components/ELI5Sheet';
import SelectionMenu from '../components/SelectionMenu';
import { ELI5Term } from '../types/ELI5';
import { useAppContext } from '../context/AppContext';
import { generateId, debounce, calculateReadingProgress } from '../utils/helpers';
import AIService from '../services/aiService';

type ELI5ReaderScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Reader'
>;

interface ELI5ReaderScreenProps {
  navigation: ELI5ReaderScreenNavigationProp;
}

export default function ELI5ReaderScreen({ navigation }: ELI5ReaderScreenProps) {
  const insets = useSafeAreaInsets();
  const { currentBook, saveTerm, updateReadingProgress, getReadingProgress } = useAppContext();
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedTerm, setSelectedTerm] = useState<ELI5Term | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [selectionMenuPosition, setSelectionMenuPosition] = useState({ x: 0, y: 0 });
  const [currentSelection, setCurrentSelection] = useState('');
  const [currentSelectionContext, setCurrentSelectionContext] = useState('');
  const [currentChapterId, setCurrentChapterId] = useState('');
  const [isHighlightedSelection, setIsHighlightedSelection] = useState(false);
  const [eli5Phrases, setEli5Phrases] = useState<string[]>([]); // Track ELI5'd phrases
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [nativeSelectionAnchor, setNativeSelectionAnchor] = useState<{ x: number; y: number } | null>(null);
  const nativeSelectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Redirect to library if no book is selected
  useEffect(() => {
    if (!currentBook) {
      Alert.alert('No Book Selected', 'Please select a book to read', [
        { text: 'OK', onPress: () => navigation.navigate('Library') },
      ]);
    }
  }, [currentBook, navigation]);

  // Restore scroll position when book loads
  useEffect(() => {
    if (currentBook && scrollViewRef.current) {
      const restorePosition = async () => {
        const progress = await getReadingProgress(currentBook.id);
        if (progress && progress.currentPosition > 0) {
          // Small delay to ensure content is rendered
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({
              y: progress.currentPosition,
              animated: false,
            });
          }, 100);
        }
      };
      restorePosition();
    }
  }, [currentBook, getReadingProgress]);

  // If no book, show loading or empty state
  if (!currentBook || !currentBook.content || currentBook.content.chapters.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff', fontSize: 18 }}>No book content available</Text>
        <TouchableOpacity
          style={{ marginTop: 20, padding: 12, backgroundColor: '#4DFF7E', borderRadius: 8 }}
          onPress={() => navigation.navigate('Library')}
        >
          <Text style={{ color: '#000', fontWeight: '600' }}>Back to Library</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleTextSelection = () => {
    if (Platform.OS !== 'web') {
      return;
    }

    // Get selected text from the window selection
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0) {
      setCurrentSelection(selectedText);

      // Check if the selected text is already highlighted
      const isAlreadyHighlighted = eli5Phrases.some(
        phrase => phrase.toLowerCase() === selectedText.toLowerCase()
      );
      setIsHighlightedSelection(isAlreadyHighlighted);

      // Get selection position for menu placement
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();

      if (rect) {
        const menuWidth = isAlreadyHighlighted ? 90 : 60; // Adjust width for Remove button
        setSelectionMenuPosition({
          x: rect.left + rect.width / 2 - menuWidth,
          y: rect.top - 40,
        });
      }

      setShowSelectionMenu(true);
    }
  };

  const requestELI5Explanation = async (
    selectionValue: string,
    contextValue: string
  ) => {
    setShowSelectionMenu(false);

    // Show loading state
    const loadingTerm: ELI5Term = {
      id: generateId(),
      term: selectionValue,
      simpleTerm: selectionValue.split(' ')[0],
      complexity: 'Medium',
      field: 'General',
      relatedCount: 2,
      readingTime: 15,
      explanation: 'Loading AI explanation...',
    };

    setSelectedTerm(loadingTerm);
    setShowSheet(true);

    try {
      // Get AI explanation with context
      const aiResponse = await AIService.getELI5Explanation(
        selectionValue,
        contextValue
      );

      // Update with real explanation
      const newTerm: ELI5Term = {
        id: generateId(),
        term: selectionValue,
        simpleTerm: aiResponse.simpleTerm,
        complexity: aiResponse.complexity,
        field: aiResponse.field,
        relatedCount: 2,
        readingTime: Math.ceil(aiResponse.explanation.split(' ').length / 200 * 60), // ~200 words per minute
        explanation: aiResponse.explanation,
      };

      setSelectedTerm(newTerm);
    } catch (error) {
      console.error('Error getting AI explanation:', error);

      // Show error in the explanation
      const errorTerm: ELI5Term = {
        ...loadingTerm,
        explanation: `Failed to get AI explanation. Please check your OpenAI API key. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };

      setSelectedTerm(errorTerm);
    }
  };

  const handleELI5Click = async () => {
    await requestELI5Explanation(currentSelection, currentSelectionContext);
  };

  const handleNativeSelectionChange = (
    paragraph: string,
    chapterId: string,
    start: number,
    end: number
  ) => {
    if (Platform.OS === 'web') return;

    if (nativeSelectionTimerRef.current) {
      clearTimeout(nativeSelectionTimerRef.current);
      nativeSelectionTimerRef.current = null;
    }

    const selectionStart = Math.min(start, end);
    const selectionEnd = Math.max(start, end);

    if (selectionStart === selectionEnd) {
      setShowSelectionMenu(false);
      return;
    }

    const selectedText = paragraph.substring(selectionStart, selectionEnd).trim();
    if (!selectedText) {
      setShowSelectionMenu(false);
      return;
    }

    setCurrentChapterId(chapterId);
    setCurrentSelection(selectedText);
    setCurrentSelectionContext(paragraph);

    const isAlreadyHighlighted = eli5Phrases.some(
      phrase => phrase.toLowerCase() === selectedText.toLowerCase()
    );
    setIsHighlightedSelection(isAlreadyHighlighted);

    const menuWidth = isAlreadyHighlighted ? 240 : 170;
    const { width, height } = Dimensions.get('window');
    const anchorX = nativeSelectionAnchor?.x ?? width / 2;
    const anchorY = nativeSelectionAnchor?.y ?? height * 0.45;

    setSelectionMenuPosition({
      x: Math.max(12, Math.min(width - menuWidth - 12, anchorX - menuWidth / 2)),
      y: Math.max(
        insets.top + 72,
        Math.min(height - 140 - insets.bottom, anchorY - 62)
      ),
    });

    nativeSelectionTimerRef.current = setTimeout(() => {
      setShowSelectionMenu(true);
    }, 180);
  };

  const handleCopy = async () => {
    // Copy to clipboard
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(currentSelection);
    } else {
      await Clipboard.setStringAsync(currentSelection);
    }
    setShowSelectionMenu(false);
    if (Platform.OS === 'web') {
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleRemove = () => {
    // Remove the phrase from ELI5'd phrases
    setEli5Phrases(eli5Phrases.filter(
      phrase => phrase.toLowerCase() !== currentSelection.toLowerCase()
    ));
    setShowSelectionMenu(false);
    if (Platform.OS === 'web') {
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleSave = async () => {
    if (!selectedTerm || !currentBook) return;

    try {
      // Create a saved term object
      const savedTermData = {
        id: selectedTerm.id,
        bookId: currentBook.id,
        chapterId: currentChapterId,
        term: selectedTerm.term,
        explanation: selectedTerm.explanation,
        complexity: selectedTerm.complexity,
        field: selectedTerm.field,
        contextSnippet: currentSelectionContext,
        savedAt: Date.now(),
      };

      // Save to storage via context
      await saveTerm(savedTermData);

      // Add the current term to ELI5'd phrases for highlighting
      if (!eli5Phrases.includes(selectedTerm.term)) {
        setEli5Phrases([...eli5Phrases, selectedTerm.term]);
      }

      Alert.alert('Saved', 'Term saved to your notebook!');
      setShowSheet(false);
    } catch (error) {
      console.error('Error saving term:', error);
      Alert.alert('Error', 'Failed to save term. Please try again.');
    }
  };

  const handleCloseSheet = () => {
    // Mark as ELI5'd even if not saved
    if (selectedTerm && !eli5Phrases.includes(selectedTerm.term)) {
      setEli5Phrases([...eli5Phrases, selectedTerm.term]);
    }
    setShowSheet(false);
    if (Platform.OS === 'web') {
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleShare = () => {
    Alert.alert('Share', 'Sharing functionality coming soon!');
  };

  const handleMore = () => {
    Alert.alert('More', 'Additional options coming soon!');
  };

  // Helper function to handle clicking on highlighted text
  const handleHighlightedTextPress = (phrase: string, event: any) => {
    setCurrentSelection(phrase);
    setIsHighlightedSelection(true);

    // Get position from the click event
    const { pageX, pageY } = event.nativeEvent;
    setSelectionMenuPosition({
      x: pageX - 90,
      y: pageY - 50,
    });

    setShowSelectionMenu(true);
  };

  // Helper function to render text with ELI5'd phrases highlighted
  const renderHighlightedText = (text: string) => {
    if (eli5Phrases.length === 0) {
      return text;
    }

    // Sort phrases by length (longest first) to handle overlapping matches
    const sortedPhrases = [...eli5Phrases].sort((a, b) => b.length - a.length);

    let result: any[] = [];
    let currentIndex = 0;
    let key = 0;

    while (currentIndex < text.length) {
      let matchFound = false;

      // Try to find a match at current position
      for (const phrase of sortedPhrases) {
        const remainingText = text.substring(currentIndex);
        const lowerRemaining = remainingText.toLowerCase();
        const lowerPhrase = phrase.toLowerCase();

        if (lowerRemaining.startsWith(lowerPhrase)) {
          // Found a match
          const matchedText = remainingText.substring(0, phrase.length);
          result.push(
            <Text
              key={key++}
              style={styles.highlightActive}
              onPress={(e) => handleHighlightedTextPress(matchedText, e)}
            >
              {matchedText}
            </Text>
          );
          currentIndex += phrase.length;
          matchFound = true;
          break;
        }
      }

      if (!matchFound) {
        // No match, collect regular text until next potential match
        let regularText = '';
        while (currentIndex < text.length) {
          let nextMatchIndex = text.length;

          // Find the nearest match
          for (const phrase of sortedPhrases) {
            const index = text.toLowerCase().indexOf(phrase.toLowerCase(), currentIndex);
            if (index !== -1 && index < nextMatchIndex) {
              nextMatchIndex = index;
            }
          }

          if (nextMatchIndex === currentIndex) {
            break; // Match found at current position
          }

          regularText = text.substring(currentIndex, nextMatchIndex);
          currentIndex = nextMatchIndex;
          break;
        }

        if (regularText) {
          result.push(regularText);
        }
      }
    }

    return result;
  };

  const handleCloseSelectionMenu = () => {
    setShowSelectionMenu(false);
    if (Platform.OS === 'web') {
      window.getSelection()?.removeAllRanges();
    }
  };

  useEffect(() => {
    return () => {
      if (nativeSelectionTimerRef.current) {
        clearTimeout(nativeSelectionTimerRef.current);
      }
    };
  }, []);

  const handleNavigateFromMenu = (screen: 'Library' | 'Notebook') => {
    setShowNavMenu(false);
    navigation.navigate(screen);
  };

  // Save reading progress with debouncing
  const saveProgress = useCallback(
    debounce(async (scrollY: number, maxScroll: number) => {
      if (!currentBook) return;

      const percentComplete = calculateReadingProgress(scrollY, maxScroll);
      const firstChapterId = currentBook.content.chapters[0]?.id || '';

      await updateReadingProgress({
        bookId: currentBook.id,
        currentChapterId: firstChapterId,
        currentPosition: scrollY,
        lastReadAt: Date.now(),
        percentComplete,
      });
    }, 2000),
    [currentBook, updateReadingProgress]
  );

  // Handle scroll event
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollY = contentOffset.y;
    const maxScroll = contentSize.height - layoutMeasurement.height;

    // Save progress
    saveProgress(scrollY, maxScroll);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.brand}>
          <Text style={styles.brandMain} numberOfLines={1} ellipsizeMode="tail">
            {currentBook.title}
          </Text>
          <Text style={styles.brandSubtitle} numberOfLines={1} ellipsizeMode="tail">
            {currentBook.author}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setShowNavMenu(prev => !prev)}
        >
          <Svg width="20" height="20" viewBox="0 0 24 24">
            <Path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {showNavMenu && (
        <View style={[styles.navMenu, { top: insets.top + 62 }]}>
          <TouchableOpacity
            style={styles.navMenuItem}
            onPress={() => handleNavigateFromMenu('Library')}
            activeOpacity={0.75}
          >
            <Text style={styles.navMenuText}>Library</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navMenuItem, styles.navMenuItemLast]}
            onPress={() => handleNavigateFromMenu('Notebook')}
            activeOpacity={0.75}
          >
            <Text style={styles.navMenuText}>Notebook</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Reader Content - Infinite Scroll */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.readerContainer}
        contentContainerStyle={styles.readerContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        {/* Reading Content - All Chapters */}
        <View style={styles.readingContent}>
          {currentBook.content.chapters.map((chapter, chapterIndex) => (
            <View key={chapter.id} style={styles.chapterSection}>
              {/* Chapter Content */}
              {chapter.content.split('\n\n').filter(p => p.trim()).map((paragraph, paraIndex) => (
                Platform.OS === 'web' ? (
                  <Text
                    key={`${chapter.id}-${paraIndex}`}
                    style={styles.paragraph}
                    selectable
                    {...({
                      onMouseUp: () => {
                        setCurrentChapterId(chapter.id);
                        setCurrentSelectionContext(paragraph.trim());
                        handleTextSelection();
                      },
                    } as any)}
                  >
                    {renderHighlightedText(paragraph.trim())}
                  </Text>
                ) : (
                  <TextInput
                    key={`${chapter.id}-${paraIndex}`}
                    style={styles.nativeParagraphInput}
                    value={paragraph.trim()}
                    editable={false}
                    multiline
                    scrollEnabled={false}
                    contextMenuHidden
                    onTouchStart={(event) => {
                      const { pageX, pageY } = event.nativeEvent;
                      setNativeSelectionAnchor({ x: pageX, y: pageY });
                    }}
                    onSelectionChange={(event) => {
                      const { start, end } = event.nativeEvent.selection;
                      handleNativeSelectionChange(paragraph.trim(), chapter.id, start, end);
                    }}
                  />
                )
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Selection Menu */}
      {showSelectionMenu && (
        <SelectionMenu
          onELI5={handleELI5Click}
          onCopy={handleCopy}
          onRemove={handleRemove}
          onClose={handleCloseSelectionMenu}
          position={selectionMenuPosition}
          showRemove={isHighlightedSelection}
          showCopy
        />
      )}

      {/* ELI5 Sheet */}
      {showSheet && selectedTerm && (
        <ELI5Sheet
          term={selectedTerm}
          onSave={handleSave}
          onShare={handleShare}
          onMore={handleMore}
          onClose={handleCloseSheet}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
    gap: 12,
  },
  brand: {
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  brandMain: {
    fontSize: 32,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -1.28,
    textTransform: 'uppercase',
    color: '#ffffff',
  },
  brandSubtitle: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 29,
    fontWeight: '400',
    color: '#ffffff',
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  navMenu: {
    position: 'absolute',
    top: 100,
    right: 24,
    minWidth: 164,
    backgroundColor: 'rgba(16,16,16,0.98)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    zIndex: 20,
  },
  navMenuItem: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  navMenuItemLast: {
    borderBottomWidth: 0,
  },
  navMenuText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  readerContainer: {
    flex: 1,
  },
  readerContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 80,
  },
  readingContent: {
    maxWidth: 600,
  },
  paragraph: {
    fontFamily: 'Georgia',
    fontSize: 20,
    lineHeight: 34,
    color: '#f0f0f0',
    marginBottom: 28,
  },
  nativeParagraphInput: {
    fontFamily: 'Georgia',
    fontSize: 20,
    lineHeight: 34,
    color: '#f0f0f0',
    marginBottom: 28,
    padding: 0,
    borderWidth: 0,
  },
  highlightActive: {
    backgroundColor: '#4DFF7E',
    color: '#000000',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  chapterSection: {
    marginBottom: 60,
  },
});
