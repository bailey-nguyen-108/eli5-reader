import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import NavigationBar from '../components/NavigationBar';
import ImportSticker from '../components/ImportSticker';
import { useAppContext } from '../context/AppContext';
import { Book } from '../types/models';

type LibraryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Library'
>;

interface LibraryScreenProps {
  navigation: LibraryScreenNavigationProp;
}

export default function LibraryScreen({ navigation }: LibraryScreenProps) {
  const [searchText, setSearchText] = useState('');
  const [menuOpenBookId, setMenuOpenBookId] = useState<string | null>(null);
  const { books, openBook, deleteBook } = useAppContext();

  // Filter and categorize books
  const { currentReads, recentUploads } = useMemo(() => {
    // Apply search filter
    const filteredBooks = books.filter((book) => {
      if (!searchText) return true;
      const search = searchText.toLowerCase();
      return (
        book.title.toLowerCase().includes(search) ||
        book.author.toLowerCase().includes(search)
      );
    });

    // Split into current reads (opened before) and recent uploads (never opened)
    const current = filteredBooks.filter(
      (book) => Boolean(book.lastOpenedAt || book.isCurrentRead)
    );
    const recent = filteredBooks.filter(
      (book) => !book.lastOpenedAt && !book.isCurrentRead
    );

    // Sort current reads by last opened date
    current.sort((a, b) => {
      const aTime = a.lastOpenedAt || 0;
      const bTime = b.lastOpenedAt || 0;
      return bTime - aTime;
    });

    // Sort recent uploads by upload date (newest first)
    recent.sort((a, b) => b.uploadedAt - a.uploadedAt);

    return { currentReads: current, recentUploads: recent };
  }, [books, searchText]);

  const handleBookPress = async (book: Book) => {
    await openBook(book);
    navigation.navigate('Reader');
  };

  const handleDeleteBook = (book: Book) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${book.title}"? This will also delete all saved terms from this book.`
    );

    if (confirmed) {
      deleteBook(book.id)
        .then(() => {
          alert(`"${book.title}" has been deleted from your library.`);
        })
        .catch((error) => {
          console.error('Error deleting book:', error);
          alert('Failed to delete book. Please try again.');
        });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.pageTitle}>
          <Text style={styles.pageTitleMain}>MY</Text>
          <Text style={styles.pageTitleSub}>Library</Text>
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
            stroke="#888"
            strokeWidth="2"
            fill="none"
          />
          <Line
            x1="21"
            y1="21"
            x2="16.65"
            y2="16.65"
            stroke="#888"
            strokeWidth="2"
          />
        </Svg>
        <TextInput
          style={styles.searchInput}
          placeholder="Search your books..."
          placeholderTextColor="#888"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentScrollContent}
        showsVerticalScrollIndicator={false}
        onTouchStart={() => {
          if (menuOpenBookId) setMenuOpenBookId(null);
        }}
      >
        {/* Empty State */}
        {books.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No books yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Tap the + button to import your first book
            </Text>
          </View>
        )}

        {/* Current Reads Section */}
        {currentReads.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>CURRENT READS</Text>
              <Svg width="16" height="16" viewBox="0 0 24 24">
                <Rect x="3" y="3" width="7" height="7" stroke="white" strokeWidth="2" fill="none" />
                <Rect x="14" y="3" width="7" height="7" stroke="white" strokeWidth="2" fill="none" />
                <Rect x="14" y="14" width="7" height="7" stroke="white" strokeWidth="2" fill="none" />
                <Rect x="3" y="14" width="7" height="7" stroke="white" strokeWidth="2" fill="none" />
              </Svg>
            </View>

            <View style={styles.featuredGrid}>
              {currentReads.map((book) => (
                <TouchableOpacity
                  key={book.id}
                  style={styles.bookCard}
                  onPress={() => handleBookPress(book)}
                  activeOpacity={0.7}
                >
                  <View style={styles.coverArt}>
                    <View style={styles.coverAbbr}>
                      {book.abbr.map((letter, index) => (
                        <Text key={index} style={styles.coverLetter}>
                          {letter}
                        </Text>
                      ))}
                    </View>
                    <View style={styles.hairlineRule} />
                    <View style={[styles.accentStripe, { backgroundColor: book.accentColor }]} />
                  </View>
                  {book.readingProgress && (
                    <View style={styles.progressContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          { width: `${book.readingProgress.percentComplete}%` },
                        ]}
                      />
                    </View>
                  )}
                  <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle}>{book.title}</Text>
                    <Text style={styles.bookAuthor}>{book.author}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Recent Uploads Section */}
        {recentUploads.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: currentReads.length > 0 ? 12 : 0 }]}>
              <Text style={styles.sectionTitle}>RECENT UPLOADS</Text>
              <Text style={styles.sortLabel}>Sort: Date</Text>
            </View>

            <View style={styles.recentList}>
              {recentUploads.map((book) => (
                <View key={book.id} style={styles.recentItem}>
                  <View style={styles.thumb}>
                    <View style={styles.thumbAbbr}>
                      {book.abbr.map((letter, index) => (
                        <Text key={index} style={styles.thumbLetter}>
                          {letter}
                        </Text>
                      ))}
                    </View>
                    <View style={styles.thumbHairline} />
                    <View style={[styles.thumbAccentStripe, { backgroundColor: book.accentColor }]} />
                  </View>
                  <TouchableOpacity
                    style={styles.fileInfo}
                    onPress={() => handleBookPress(book)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.fileName}>{book.title}</Text>
                    <Text style={styles.fileMeta}>
                      {book.author} • {book.format}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.menuContainer}>
                    <TouchableOpacity
                      style={styles.menuButton}
                      onPress={() => setMenuOpenBookId(menuOpenBookId === book.id ? null : book.id)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Svg width="20" height="20" viewBox="0 0 24 24">
                        <Circle cx="12" cy="12" r="1.5" fill="white" opacity="0.6" />
                        <Circle cx="12" cy="5" r="1.5" fill="white" opacity="0.6" />
                        <Circle cx="12" cy="19" r="1.5" fill="white" opacity="0.6" />
                      </Svg>
                    </TouchableOpacity>
                    {menuOpenBookId === book.id && (
                      <View style={styles.dropdownMenu}>
                        <TouchableOpacity
                          style={styles.menuItem}
                          onPress={() => {
                            setMenuOpenBookId(null);
                            handleDeleteBook(book);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.menuItemText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
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
    marginBottom: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  emptyState: {
    marginTop: 80,
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
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#888',
    fontWeight: '600',
  },
  sortLabel: {
    fontSize: 11,
    color: '#4DFF7E',
    fontWeight: '600',
  },
  featuredGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  bookCard: {
    flex: 1,
    maxWidth: 140,
    gap: 8,
  },
  coverArt: {
    aspectRatio: 0.7,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
    padding: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
  },
  coverAbbr: {
    flexDirection: 'column',
    zIndex: 2,
  },
  coverLetter: {
    fontFamily: 'Playfair Display, serif',
    fontStyle: 'italic',
    fontSize: 24,
    lineHeight: 26,
    color: '#ffffff',
  },
  hairlineRule: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginLeft: 12,
  },
  uploadBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    backgroundColor: '#4DFF7E',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  uploadBadgeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
  },
  accentStripe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  bookInfo: {
    gap: 4,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 17,
  },
  bookAuthor: {
    fontSize: 11,
    color: '#888',
  },
  progressContainer: {
    marginTop: 8,
    width: '100%',
    height: 3,
    backgroundColor: '#222',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4DFF7E',
    borderRadius: 2,
  },
  recentList: {
    gap: 0,
  },
  recentItem: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  thumb: {
    width: 50,
    height: 64,
    backgroundColor: '#0a0a0a',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    padding: 8,
  },
  thumbAbbr: {
    flexDirection: 'column',
    zIndex: 2,
  },
  thumbLetter: {
    fontFamily: 'Playfair Display, serif',
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 15,
    color: '#ffffff',
  },
  thumbHairline: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginLeft: 4,
  },
  thumbAccentStripe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  fileInfo: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  fileMeta: {
    fontSize: 12,
    color: '#888',
  },
  menuContainer: {
    position: 'relative',
  },
  menuOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 35,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 101,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
});
