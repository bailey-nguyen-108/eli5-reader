/**
 * Utility Helpers - Common functions used throughout the app
 */

/**
 * Generate a unique ID using timestamp and random string
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate abbreviation letters from book title for cover display
 * Examples:
 *   "The Great Gatsby" -> ["T", "G", "G"]
 *   "1984" -> ["1", "9", "8"]
 *   "To Kill a Mockingbird" -> ["T", "K", "M"]
 */
export function generateBookAbbreviation(title: string): string[] {
  // Remove common articles and prepositions
  const skipWords = ['the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'and'];

  const words = title
    .split(/\s+/)
    .filter(word => word.length > 0)
    .filter(word => !skipWords.includes(word.toLowerCase()));

  // If we have words, take first letter of up to 3 words
  if (words.length > 0) {
    return words
      .slice(0, 3)
      .map(word => word[0].toUpperCase());
  }

  // Fallback: take first 3 characters of title
  return title
    .replace(/\s+/g, '')
    .slice(0, 3)
    .split('')
    .map(char => char.toUpperCase());
}

/**
 * Generate a random accent color for book covers
 * Returns hex color string
 */
export function generateAccentColor(): string {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
    '#F8B88B', // Peach
    '#ABEBC6', // Light Green
    '#F1948A', // Pink
    '#85929E', // Gray Blue
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Calculate reading progress percentage
 * @param currentPosition - Current reading position (character index or scroll position)
 * @param totalLength - Total length (total characters or total scroll height)
 * @returns Progress percentage (0-100)
 */
export function calculateReadingProgress(
  currentPosition: number,
  totalLength: number
): number {
  if (totalLength === 0) return 0;
  const progress = (currentPosition / totalLength) * 100;
  return Math.min(Math.max(progress, 0), 100); // Clamp between 0-100
}

/**
 * Extract context snippet around a selection
 * @param fullText - Full chapter/book text
 * @param selectionStart - Start index of the selected term
 * @param selectionEnd - End index of the selected term
 * @param contextLength - Number of characters to include before and after (default: 100)
 * @returns Context snippet with the term highlighted
 */
export function extractContext(
  fullText: string,
  selectionStart: number,
  selectionEnd: number,
  contextLength: number = 100
): string {
  const start = Math.max(0, selectionStart - contextLength);
  const end = Math.min(fullText.length, selectionEnd + contextLength);

  let context = fullText.substring(start, end);

  // Add ellipsis if we didn't start/end at text boundaries
  if (start > 0) context = '...' + context;
  if (end < fullText.length) context = context + '...';

  return context.trim();
}

/**
 * Format file size in bytes to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB", "350 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format timestamp to relative time string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Relative time string (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

/**
 * Count words in a text string
 * @param text - Text to count words in
 * @returns Word count
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Truncate text to a maximum length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Debounce function to limit how often a function can be called
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
