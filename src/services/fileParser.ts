import { BookContent, Chapter } from '../types/models';
import { generateId, countWords } from '../utils/helpers';

/**
 * File Parser Service - Extract text content from various file formats
 * Supports: TXT, PDF, EPUB
 */

interface ParseResult {
  content: BookContent;
  metadata?: {
    title?: string;
    author?: string;
  };
}

/**
 * Parse a text file and structure it into chapters
 */
export async function parseTextFile(fileContent: string): Promise<ParseResult> {
  // Clean up the text
  const cleanedText = fileContent.trim();

  // Try to detect chapters
  const chapters = detectChapters(cleanedText);

  // Calculate total word count
  const totalWords = countWords(cleanedText);

  return {
    content: {
      chapters,
      totalWords,
    },
  };
}

/**
 * Detect chapters in text using common patterns
 * Patterns: "Chapter 1", "Chapter One", "CHAPTER 1", "1.", "I.", etc.
 */
function detectChapters(text: string): Chapter[] {
  // Common chapter patterns
  const chapterPatterns = [
    /^Chapter\s+(\d+|[IVXLCDM]+|One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)/im,
    /^CHAPTER\s+(\d+|[IVXLCDM]+)/m,
    /^\d+\.\s+/m,
    /^[IVXLCDM]+\.\s+/m,
  ];

  // Find all chapter markers
  const chapterMarkers: Array<{ index: number; title: string }> = [];

  // Split by lines to detect chapter headings
  const lines = text.split('\n');
  let currentIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      currentIndex += 1; // Account for newline
      continue;
    }

    // Check if line matches any chapter pattern
    let isChapter = false;
    for (const pattern of chapterPatterns) {
      if (pattern.test(line)) {
        chapterMarkers.push({
          index: currentIndex,
          title: line || `Chapter ${chapterMarkers.length + 1}`,
        });
        isChapter = true;
        break;
      }
    }

    currentIndex += lines[i].length + 1; // +1 for newline
  }

  // If we found chapters, split the text accordingly
  if (chapterMarkers.length > 1) {
    const chapters: Chapter[] = [];

    for (let i = 0; i < chapterMarkers.length; i++) {
      const start = chapterMarkers[i].index;
      const end = i < chapterMarkers.length - 1 ? chapterMarkers[i + 1].index : text.length;
      const chapterText = text.substring(start, end).trim();

      chapters.push({
        id: generateId(),
        title: chapterMarkers[i].title,
        content: chapterText,
        startPosition: start,
        endPosition: end,
        wordCount: countWords(chapterText),
      });
    }

    return chapters;
  }

  // Fallback: No clear chapters detected, split by word count
  return splitByWordCount(text);
}

/**
 * Split text into chunks based on word count (fallback method)
 * Default: 5000 words per chunk
 */
function splitByWordCount(text: string, wordsPerChunk: number = 5000): Chapter[] {
  const words = text.split(/\s+/);
  const chapters: Chapter[] = [];
  let chapterNumber = 1;

  for (let i = 0; i < words.length; i += wordsPerChunk) {
    const chunkWords = words.slice(i, i + wordsPerChunk);
    const chunkText = chunkWords.join(' ');

    // Find actual character positions
    const startPosition = i === 0 ? 0 : text.indexOf(chunkWords[0], chapters[chapters.length - 1]?.endPosition || 0);
    const endPosition = startPosition + chunkText.length;

    chapters.push({
      id: generateId(),
      title: `Part ${chapterNumber}`,
      content: chunkText,
      startPosition,
      endPosition,
      wordCount: chunkWords.length,
    });

    chapterNumber++;
  }

  return chapters;
}

/**
 * Parse a PDF file and extract text content
 * Note: PDF support is currently disabled due to library compatibility issues
 */
async function parsePDFFile(arrayBuffer: ArrayBuffer): Promise<ParseResult> {
  throw new Error('PDF support is temporarily disabled. Please convert your PDF to TXT or use EPUB format instead. You can use online tools like https://www.zamzar.com/ to convert PDF to TXT.');
}

/**
 * Parse an EPUB file and extract text content
 * Converts EPUB to plain text format for better readability
 */
async function parseEPUBFile(arrayBuffer: ArrayBuffer): Promise<ParseResult> {
  try {
    // Dynamically import epubjs
    const epubjsModule = await import('epubjs');
    const ePub = epubjsModule.default || epubjsModule;

    const book = ePub(arrayBuffer);
    await book.ready;

    // Get metadata
    const metadata = await book.loaded.metadata;

    // Get spine (reading order)
    const spine: any = await book.loaded.spine;

    let fullText = '';

    // Extract text from each chapter/section
    for (const item of spine.items) {
      try {
        // Load the section
        const section = book.spine.get(item.href);
        if (!section) continue;

        // Render the section to get HTML
        await section.load(book.load.bind(book));
        const contents = section.contents;

        if (contents) {
          // Extract text from the document body
          const body: any = contents.querySelector('body') || contents;

          // Get text with better paragraph preservation
          let text = '';

          // Process each paragraph-level element
          const elements = body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre');
          if (elements.length > 0) {
            elements.forEach((el: any) => {
              const textContent = el.textContent?.trim() || '';
              if (textContent) {
                text += textContent + '\n\n';
              }
            });
          } else {
            // Fallback to full body text if no block elements found
            text = body.textContent || '';
          }

          // Clean up excessive whitespace but preserve paragraph breaks
          text = text
            .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
            .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
            .trim();

          if (text) {
            fullText += text + '\n\n';
          }
        }
      } catch (err) {
        console.warn(`Failed to load chapter ${item.href}:`, err);
      }
    }

    // If no text extracted, try alternative method
    if (!fullText.trim()) {
      console.warn('No text extracted using spine, trying alternative method');

      const sections: any = await book.loaded.spine;
      for (let i = 0; i < sections.items.length; i++) {
        try {
          const section = book.spine.get(i);
          await section.load(book.load.bind(book));
          const text = section.contents?.textContent || '';
          if (text.trim()) {
            fullText += text.trim() + '\n\n';
          }
        } catch (err) {
          console.warn(`Failed to load section ${i}:`, err);
        }
      }
    }

    console.log(`EPUB extracted as text: ${fullText.length} characters`);

    // Now treat the extracted text as if it were a TXT file
    // Use the same chapter detection logic as TXT files
    const parseResult = await parseTextFile(fullText.trim());

    // Add metadata from EPUB
    return {
      ...parseResult,
      metadata: {
        title: metadata.title,
        author: metadata.creator,
      },
    };
  } catch (error) {
    console.error('EPUB parsing error:', error);
    throw new Error('Failed to parse EPUB file. The file may be corrupted or invalid.');
  }
}

/**
 * Main parser function - detects file type and parses accordingly
 */
export async function parseFile(
  filePath: string,
  fileName: string,
  fileContent: string | ArrayBuffer
): Promise<ParseResult> {
  const extension = fileName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'txt':
      if (typeof fileContent === 'string') {
        return parseTextFile(fileContent);
      }
      throw new Error('Invalid file content for TXT file');

    case 'pdf':
      if (fileContent instanceof ArrayBuffer) {
        return parsePDFFile(fileContent);
      }
      throw new Error('Invalid file content for PDF file');

    case 'epub':
      if (fileContent instanceof ArrayBuffer) {
        return parseEPUBFile(fileContent);
      }
      throw new Error('Invalid file content for EPUB file');

    case 'docx':
      throw new Error('DOCX parsing not yet implemented. Please use TXT, PDF, or EPUB files.');

    case 'mobi':
      throw new Error('MOBI parsing not yet implemented. Please use TXT, PDF, or EPUB files.');

    default:
      throw new Error(`Unsupported file format: ${extension}`);
  }
}

/**
 * Web-specific file reader
 * Reads file content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Web-specific file reader for binary files (PDF, EPUB)
 * Reads file content as ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result;
      if (content instanceof ArrayBuffer) {
        resolve(content);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsArrayBuffer(file);
  });
}
