import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import * as DocumentPicker from 'expo-document-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import ImportSticker from '../components/ImportSticker';
import NavigationBar from '../components/NavigationBar';
import { useAppContext } from '../context/AppContext';
import { parseFile, readFileAsText, readFileAsArrayBuffer } from '../services/fileParser';
import { generateId, generateBookAbbreviation, generateAccentColor } from '../utils/helpers';
import { Book } from '../types/models';

type ImportScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Import'
>;

interface ImportScreenProps {
  navigation: ImportScreenNavigationProp;
}

export default function ImportScreen({ navigation }: ImportScreenProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [menuOpenBookId, setMenuOpenBookId] = useState<string | null>(null);
  const { books, addBook, setCurrentBook, deleteBook } = useAppContext();

  // Get recent uploads (last 5 books, sorted by upload date)
  const recentFiles = useMemo(() => {
    return [...books]
      .sort((a, b) => b.uploadedAt - a.uploadedAt)
      .slice(0, 5);
  }, [books]);

  const handleSelectFile = async () => {
    try {
      setIsUploading(true);

      // For web, use input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.txt,.epub';

      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) {
          setIsUploading(false);
          return;
        }

        try {
          // Get file extension
          const fileName = file.name;
          const extension = fileName.split('.').pop()?.toLowerCase();
          const format = extension?.toUpperCase() as any;

          // Read file content based on type
          let fileContent: string | ArrayBuffer;
          if (extension === 'txt') {
            fileContent = await readFileAsText(file);
          } else if (extension === 'epub') {
            fileContent = await readFileAsArrayBuffer(file);
          } else if (extension === 'pdf') {
            throw new Error('PDF support is temporarily disabled due to technical limitations. Please convert your PDF to TXT or use EPUB format. You can use online converters like https://www.zamzar.com/');
          } else {
            throw new Error(`Unsupported file format: ${extension}. Supported formats: TXT, EPUB`);
          }

          // Parse the file
          const parseResult = await parseFile('', fileName, fileContent);

          // Use metadata from file if available, otherwise prompt
          const defaultTitle = parseResult.metadata?.title || fileName.replace(/\.[^/.]+$/, '');
          const defaultAuthor = parseResult.metadata?.author || 'Unknown Author';

          const title = prompt('Enter book title:', defaultTitle);
          const author = prompt('Enter author name:', defaultAuthor);

          if (!title) {
            Alert.alert('Import Cancelled', 'Book title is required');
            setIsUploading(false);
            return;
          }

          // Generate book metadata
          const bookId = generateId();
          const book: Book = {
            id: bookId,
            title: title || defaultTitle,
            author: author || defaultAuthor,
            abbr: generateBookAbbreviation(title || defaultTitle),
            format: format || 'TXT',
            accentColor: generateAccentColor(),
            fileName,
            fileSize: file.size,
            filePath: file.name, // For web, we can't get actual path
            content: parseResult.content,
            uploadedAt: Date.now(),
          };

          // Save book to storage
          await addBook(book);

          // Set as current book and navigate to reader
          setCurrentBook(book);

          Alert.alert(
            'Book Imported',
            `"${book.title}" has been added to your library.\n\nChapters detected: ${book.content.chapters.length}`,
            [
              {
                text: 'View Library',
                onPress: () => navigation.navigate('Library'),
              },
              {
                text: 'Start Reading',
                onPress: () => navigation.navigate('Reader'),
              },
            ]
          );
        } catch (parseError: any) {
          console.error('Parse error:', parseError);
          Alert.alert('Import Error', parseError.message || 'Failed to parse file');
        } finally {
          setIsUploading(false);
        }
      };

      input.click();
    } catch (error) {
      Alert.alert('Error', 'Failed to import document');
      console.error(error);
      setIsUploading(false);
    }
  };

  const handleRecentFilePress = (book: Book) => {
    setCurrentBook(book);
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
          <Text style={styles.pageTitleMain}>IMPORT</Text>
          <Text style={styles.pageTitleSub}>Knowledge</Text>
        </View>
        <ImportSticker />
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.importContainer}
        contentContainerStyle={styles.importContent}
        showsVerticalScrollIndicator={false}
        onTouchStart={() => {
          if (menuOpenBookId) setMenuOpenBookId(null);
        }}
      >

        {/* Upload Area */}
        <TouchableOpacity
          style={styles.uploadArea}
          onPress={handleSelectFile}
          activeOpacity={0.7}
          disabled={isUploading}
        >
          <View style={styles.uploadIcon}>
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path
                d="M12 3v12"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Path
                d="m17 8-5-5-5 5"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Path
                d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </View>
          <Text style={styles.uploadText}>
            {isUploading ? 'Selecting...' : 'Select a book or file'}
          </Text>
          <Text style={styles.uploadSubtext}>
            Tap to browse your device or drag and drop files here
          </Text>
        </TouchableOpacity>

        {/* Supported Formats */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Supported Formats</Text>
        </View>
        <View style={styles.formatTags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>TXT</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>EPUB</Text>
          </View>
          <View style={[styles.tag, styles.tagDisabled]}>
            <Text style={[styles.tagText, styles.tagDisabledText]}>PDF (Coming Soon)</Text>
          </View>
        </View>

        {/* Recent Uploads */}
        {recentFiles.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 40 }]}>
              <Text style={styles.sectionLabel}>RECENT UPLOADS</Text>
              <Text style={styles.sortLabel}>Sort: Date</Text>
            </View>

            <View style={styles.recentList}>
              {recentFiles.map((book) => (
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
                    onPress={() => handleRecentFilePress(book)}
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
    zIndex: 10,
  },
  importContainer: {
    flex: 1,
  },
  importContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 120,
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
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 16,
    marginBottom: 40,
  },
  uploadIcon: {
    width: 56,
    height: 56,
    backgroundColor: '#4DFF7E',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  uploadSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    maxWidth: 200,
    lineHeight: 18,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLabel: {
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
  formatTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 40,
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tagDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tagDisabledText: {
    color: 'rgba(255, 255, 255, 0.3)',
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
