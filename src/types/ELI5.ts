export interface ELI5Term {
  id: string;
  term: string;
  simpleTerm?: string; // Optional italic version
  complexity: 'Easy' | 'Medium' | 'Hard';
  field: string;
  relatedCount: number;
  readingTime: number; // in seconds
  explanation: string;
}

export interface ELI5Content {
  bookTitle: string;
  bookSubtitle?: string;
  chapter: string;
  paragraphs: ELI5Paragraph[];
}

export interface ELI5Paragraph {
  id: string;
  content: string;
  highlightedTerms?: HighlightedTerm[];
  opacity?: number; // for fading effect
}

export interface HighlightedTerm {
  termId: string;
  text: string;
  startIndex: number;
  endIndex: number;
}
