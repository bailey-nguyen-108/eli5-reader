/**
 * AI Service - Claude API integration for ELI5 explanations
 * Uses Claude Haiku model for fast, affordable explanations
 * Implements caching to reduce API costs
 */

import StorageService from './storage';

// Claude API configuration
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-3-haiku-20240307'; // Fast and cheap model
const MAX_TOKENS = 250; // Limit output for cost efficiency

interface ELI5Response {
  explanation: string;
  simpleTerm: string;
  complexity: 'Easy' | 'Medium' | 'Hard';
  field: string;
}

/**
 * Generate a cache key for a term and context
 */
function generateCacheKey(term: string, context: string): string {
  const normalized = `${term.toLowerCase()}-${context.substring(0, 100).toLowerCase()}`;
  return `eli5_${btoa(normalized).replace(/[^a-zA-Z0-9]/g, '')}`;
}

/**
 * Get ELI5 explanation from Claude API
 */
export async function getELI5Explanation(
  term: string,
  context: string,
  apiKey?: string
): Promise<ELI5Response> {
  try {
    // Check cache first
    const cacheKey = generateCacheKey(term, context);
    const cached = await StorageService.getCachedExplanation(cacheKey);

    if (cached) {
      console.log('Using cached explanation for:', term);
      return cached;
    }

    // Get API key from storage if not provided
    if (!apiKey) {
      const settings = await StorageService.getSettings();
      apiKey = settings.claudeApiKey;
    }

    if (!apiKey) {
      throw new Error('Claude API key not configured. Please add your API key in Settings.');
    }

    console.log('Fetching AI explanation for:', term);

    // Create the prompt
    const prompt = `You are explaining complex terms to readers. The reader selected the term "${term}" while reading.

Context from the book:
"${context}"

Provide a simple, clear explanation that:
1. Explains what "${term}" means in 2-3 sentences
2. Uses simple language (explain like I'm 5)
3. Is relevant to the context provided
4. Helps the reader understand the text better

Respond in JSON format:
{
  "explanation": "your 2-3 sentence explanation here",
  "simpleTerm": "a 1-2 word simplified version of the term",
  "complexity": "Easy|Medium|Hard",
  "field": "category (e.g., Science, History, Technology, Business, Literature, etc.)"
}`;

    // Call Claude API
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get AI explanation');
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse JSON response
    let result: ELI5Response;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback: create a basic response from the text
      result = {
        explanation: content.trim(),
        simpleTerm: term.split(' ')[0],
        complexity: 'Medium',
        field: 'General',
      };
    }

    // Cache the result
    await StorageService.cacheExplanation(cacheKey, result);

    return result;
  } catch (error) {
    console.error('AI Service Error:', error);

    // Return fallback explanation
    return {
      explanation: `This is a placeholder explanation for "${term}". To get AI-powered explanations, please configure your Claude API key in Settings. You can get an API key from https://console.anthropic.com/`,
      simpleTerm: term.split(' ')[0],
      complexity: 'Medium',
      field: 'General',
    };
  }
}

/**
 * Extract context around a term (200 characters before and after)
 */
export function extractContext(fullText: string, selectionIndex: number, contextLength: number = 200): string {
  const start = Math.max(0, selectionIndex - contextLength);
  const end = Math.min(fullText.length, selectionIndex + contextLength);

  let context = fullText.substring(start, end);

  // Add ellipsis if we're not at the start/end
  if (start > 0) context = '...' + context;
  if (end < fullText.length) context = context + '...';

  return context.trim();
}

/**
 * Validate API key by making a test request
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hi',
          },
        ],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('API key validation error:', error);
    return false;
  }
}

export default {
  getELI5Explanation,
  extractContext,
  validateApiKey,
};
