import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import NavigationBar from '../components/NavigationBar';
import ImportSticker from '../components/ImportSticker';
import { useAppContext } from '../context/AppContext';
import { SavedTerm } from '../types/models';

type NotebookScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Notebook'
>;

interface NotebookScreenProps {
  navigation: NotebookScreenNavigationProp;
}

interface BookCollection {
  id: string;
  title: string;
  author: string;
  termCount: number;
  terms: SavedTerm[];
  expanded: boolean;
}

export default function NotebookScreen({ navigation }: NotebookScreenProps) {
  const { books, savedTerms, deleteTerm } = useAppContext();
  const [searchText, setSearchText] = useState('');
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());

  // Group terms by book and filter by search
  const collections = useMemo(() => {
    // Filter terms by search text
    const filteredTerms = savedTerms.filter((term) => {
      if (!searchText) return true;
      const search = searchText.toLowerCase();
      return (
        term.term.toLowerCase().includes(search) ||
        term.explanation.toLowerCase().includes(search) ||
        term.field.toLowerCase().includes(search)
      );
    });

    // Group terms by bookId
    const termsByBook = filteredTerms.reduce((acc, term) => {
      if (!acc[term.bookId]) {
        acc[term.bookId] = [];
      }
      acc[term.bookId].push(term);
      return acc;
    }, {} as Record<string, SavedTerm[]>);

    // Create collections with book info
    const bookCollections: BookCollection[] = Object.entries(termsByBook).map(
      ([bookId, terms]) => {
        const book = books.find((b) => b.id === bookId);
        return {
          id: bookId,
          title: book?.title.toUpperCase() || 'UNKNOWN',
          author: book?.author || 'Unknown Author',
          termCount: terms.length,
          terms: terms.sort((a, b) => b.savedAt - a.savedAt), // Most recent first
          expanded: expandedBooks.has(bookId),
        };
      }
    );

    // Sort by most recent term saved
    return bookCollections.sort((a, b) => {
      const aLatest = Math.max(...a.terms.map((t) => t.savedAt));
      const bLatest = Math.max(...b.terms.map((t) => t.savedAt));
      return bLatest - aLatest;
    });
  }, [books, savedTerms, searchText, expandedBooks]);

  const toggleCollection = (id: string) => {
    setExpandedBooks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDeleteTerm = (termId: string, termName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${termName}" from your notebook?`
    );

    if (confirmed) {
      deleteTerm(termId)
        .then(() => {
          alert(`"${termName}" has been deleted from your notebook.`);
        })
        .catch((error) => {
          console.error('Error deleting term:', error);
          alert('Failed to delete term. Please try again.');
        });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.pageTitle}>
          <Text style={styles.pageTitleMain}>My</Text>
          <Text style={styles.pageTitleSub}>Notebook</Text>
        </View>
        <ImportSticker />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Svg width="20" height="20" viewBox="0 0 24 24">
          <Circle
            cx="11"
            cy="11"
            r="8"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2"
            fill="none"
          />
          <Line
            x1="21"
            y1="21"
            x2="16.65"
            y2="16.65"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2"
          />
        </Svg>
        <TextInput
          style={styles.searchInput}
          placeholder="Search saved terms..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Notebook Container */}
      <ScrollView
        style={styles.notebookContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Empty State */}
        {collections.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No saved terms yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Highlight text while reading and save ELI5 explanations to build your notebook
            </Text>
          </View>
        )}

        {collections.map((collection, index) => (
          <View
            key={collection.id}
            style={[
              styles.bookSection,
              { opacity: index === 0 ? 1 : 0.8 },
            ]}
          >
            {/* Book Header */}
            <TouchableOpacity
              style={styles.bookHeader}
              onPress={() => toggleCollection(collection.id)}
            >
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={1} ellipsizeMode="tail">
                  {collection.title}
                </Text>
                <Text style={styles.bookSubtitle} numberOfLines={1} ellipsizeMode="tail">
                  {collection.author}
                </Text>
              </View>
              <View style={styles.termCount}>
                <Text style={styles.termCountText} numberOfLines={1}>
                  {collection.termCount} term{collection.termCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Terms List */}
            {collection.expanded && collection.terms.length > 0 && (
              <View style={styles.termsList}>
                {collection.terms.map((term) => (
                  <View key={term.id} style={styles.termCard}>
                    <View style={styles.termIndicator} />
                    <View style={styles.termContent}>
                      <Text style={styles.termName}>{term.term}</Text>
                      <Text style={styles.termSnippet}>
                        {term.explanation}
                      </Text>
                      <Text style={styles.termMeta}>
                        {term.field} • {term.complexity}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteTerm(term.id, term.term)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Svg width="18" height="18" viewBox="0 0 24 24">
                        <Path
                          d="M18 6L6 18M6 6l12 12"
                          stroke="rgba(255,255,255,0.4)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Navigation Bar */}
      <NavigationBar />
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
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    gap: 2,
  },
  pageTitleMain: {
    fontSize: 32,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -1.28,
    textTransform: 'uppercase',
    color: '#ffffff',
  },
  pageTitleSub: {
    fontFamily: 'Playfair Display, serif',
    fontStyle: 'italic',
    fontSize: 29,
    fontWeight: '400',
    color: '#ffffff',
  },
  searchBar: {
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
  },
  notebookContainer: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 120,
  },
  emptyState: {
    marginTop: 80,
    marginHorizontal: 24,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  bookSection: {
    marginBottom: 8,
  },
  bookHeader: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  bookInfo: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.36,
    color: '#ffffff',
  },
  bookSubtitle: {
    fontFamily: 'Libre Baskerville, serif',
    fontStyle: 'italic',
    fontSize: 14,
    opacity: 0.6,
    color: '#ffffff',
  },
  termCount: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  termCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  termsList: {
    backgroundColor: '#0f0f0f',
    flexDirection: 'column',
  },
  termCard: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  termIndicator: {
    width: 8,
    height: 8,
    backgroundColor: '#4DFF7E',
    borderRadius: 4,
    marginTop: 6,
    shadowColor: '#4DFF7E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 3,
  },
  termContent: {
    flex: 1,
    flexDirection: 'column',
    gap: 6,
  },
  termName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.16,
    color: '#ffffff',
  },
  termSnippet: {
    fontFamily: 'Libre Baskerville, serif',
    fontSize: 14,
    lineHeight: 21,
    color: '#aaaaaa',
  },
  termMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
