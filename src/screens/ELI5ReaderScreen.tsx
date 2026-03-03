import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import ELI5Sheet from '../components/ELI5Sheet';
import SelectionMenu from '../components/SelectionMenu';
import { ELI5Term } from '../types/ELI5';
import { useAppContext } from '../context/AppContext';
import { generateId, debounce, calculateReadingProgress } from '../utils/helpers';

type ELI5ReaderScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Reader'
>;

interface ELI5ReaderScreenProps {
  navigation: ELI5ReaderScreenNavigationProp;
}

export default function ELI5ReaderScreen({ navigation }: ELI5ReaderScreenProps) {
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
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(0);

  // Redirect to library if no book is selected
  useEffect(() => {
    if (!currentBook) {
      Alert.alert('No Book Selected', 'Please select a book to read', [
        { text: 'OK', onPress: () => navigation.navigate('Library') },
      ]);
    }
  }, [currentBook, navigation]);

  // Add global selection listener for Safari compatibility
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (selectedText && selectedText.length > 0) {
        // Only show menu if selection is within our reading content
        const range = selection?.getRangeAt(0);
        const container = range?.commonAncestorContainer;

        // Check if selection is within our reading content
        let isInReadingContent = false;
        let node = container;
        while (node) {
          if (node.nodeType === 1 && (node as Element).classList?.contains('reading-content')) {
            isInReadingContent = true;
            break;
          }
          node = node.parentNode;
        }

        if (isInReadingContent) {
          handleTextSelection();
        }
      } else {
        setShowSelectionMenu(false);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [eli5Phrases]);

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

  const handleTextSelection = (e?: any) => {
    // Prevent Safari's native context menu
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    // Small delay to ensure selection is complete on Safari
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (selectedText && selectedText.length > 0) {
        setCurrentSelection(selectedText);

        // Check if the selected text is already highlighted
        const isAlreadyHighlighted = eli5Phrases.some(
          phrase => phrase.toLowerCase() === selectedText.toLowerCase()
        );
        setIsHighlightedSelection(isAlreadyHighlighted);

        // Get selection position for menu placement (fixed positioning)
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();

        if (rect) {
          const menuWidth = isAlreadyHighlighted ? 90 : 60;
          // For fixed positioning, use rect directly without scrollY
          setSelectionMenuPosition({
            x: rect.left + rect.width / 2 - menuWidth,
            y: rect.top - 50,
          });
        }

        setShowSelectionMenu(true);
      }
    }, 100);
  };

  const handleELI5Click = () => {
    setShowSelectionMenu(false);

    // Create an ELI5 term object from the selected text
    const newTerm: ELI5Term = {
      id: generateId(),
      term: currentSelection,
      simpleTerm: currentSelection.split(' ')[0],
      complexity: 'Medium',
      field: 'General',
      relatedCount: 2,
      readingTime: 15,
      explanation: `This is a simplified explanation of "${currentSelection}". In the future, this will be powered by AI to provide contextual explanations tailored to your reading level.`,
    };

    setSelectedTerm(newTerm);
    setShowSheet(true);
  };

  const handleCopy = () => {
    // Copy to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentSelection);
    }
    setShowSelectionMenu(false);
    window.getSelection()?.removeAllRanges();
  };

  const handleRemove = () => {
    // Remove the phrase from ELI5'd phrases
    setEli5Phrases(eli5Phrases.filter(
      phrase => phrase.toLowerCase() !== currentSelection.toLowerCase()
    ));
    setShowSelectionMenu(false);
    window.getSelection()?.removeAllRanges();
  };

  const handleTermPress = () => {
    setSelectedTerm(sampleTerm);
    setShowSheet(true);
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
    window.getSelection()?.removeAllRanges();
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
    window.getSelection()?.removeAllRanges();
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

    setContentHeight(contentSize.height);
    setScrollHeight(layoutMeasurement.height);

    // Save progress
    saveProgress(scrollY, maxScroll);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
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
          onPress={() => navigation.navigate('Library')}
        >
          <Svg width="20" height="20" viewBox="0 0 24 24">
            <Path
              d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
              stroke="white"
              strokeWidth="2"
              fill="none"
            />
          </Svg>
        </TouchableOpacity>
      </View>

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
        <View
          style={styles.readingContent}
          onStartShouldSetResponder={() => true}
          // @ts-ignore - className is supported on web
          className="reading-content"
          onContextMenu={(e: any) => {
            // Prevent default context menu on web
            if (e && e.preventDefault) {
              e.preventDefault();
            }
          }}
        >
          {currentBook.content.chapters.map((chapter, chapterIndex) => (
            <View key={chapter.id} style={styles.chapterSection}>
              {/* Chapter Title */}
              <View style={styles.chapterHeader}>
                <View style={styles.metaDot} />
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
              </View>

              {/* Chapter Content */}
              {chapter.content.split('\n\n').filter(p => p.trim()).map((paragraph, paraIndex) => (
                <Text
                  key={`${chapter.id}-${paraIndex}`}
                  style={styles.paragraph}
                  selectable={true}
                  onMouseUp={(e) => {
                    setCurrentChapterId(chapter.id);
                    setCurrentSelectionContext(paragraph.trim());
                  }}
                  onContextMenu={(e: any) => {
                    // Prevent default context menu
                    if (e && e.preventDefault) {
                      e.preventDefault();
                    }
                    setCurrentChapterId(chapter.id);
                    setCurrentSelectionContext(paragraph.trim());
                  }}
                >
                  {renderHighlightedText(paragraph.trim())}
                </Text>
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
    fontFamily: 'Playfair Display, serif',
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
  readerContainer: {
    flex: 1,
  },
  readerContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 80,
  },
  metaDot: {
    width: 8,
    height: 8,
    backgroundColor: '#4DFF7E',
    borderRadius: 4,
  },
  readingContent: {
    maxWidth: 600,
    // @ts-ignore - WebkitUserSelect is web-only
    WebkitUserSelect: 'text',
    // @ts-ignore - WebkitTouchCallout is web-only
    WebkitTouchCallout: 'none',
    userSelect: 'text',
  },
  paragraph: {
    fontFamily: 'Libre Baskerville, serif',
    fontSize: 20,
    lineHeight: 34,
    color: '#f0f0f0',
    marginBottom: 28,
    // @ts-ignore - WebkitUserSelect is web-only
    WebkitUserSelect: 'text',
    // @ts-ignore - WebkitTouchCallout is web-only (disables Safari's callout menu)
    WebkitTouchCallout: 'none',
    userSelect: 'text',
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
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
    paddingTop: 20,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.8,
  },
});
