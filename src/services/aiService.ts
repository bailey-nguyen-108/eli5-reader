/**
 * AI Service - OpenAI GPT API integration for ELI5 explanations
 * Uses GPT models for fast, affordable explanations
 * Implements caching to reduce API costs
 */

import StorageService from './storage';
import Constants from 'expo-constants';

// OpenAI API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_GPT_MODEL = 'gpt-4o-mini';
const MAX_TOKENS = 250; // Limit output for cost efficiency

interface ELI5Response {
  explanation: string;
  simpleTerm: string;
  complexity: 'Easy' | 'Medium' | 'Hard';
  field: string;
}

function getExpoExtraOpenAIKey(): string | undefined {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const candidates = [
    extra.openaiApiKey,
    extra.OPENAI_API_KEY,
    extra.EXPO_PUBLIC_OPENAI_API_KEY,
  ];

  const key = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim());
  return typeof key === 'string' ? key.trim() : undefined;
}

/**
 * Generate a cache key for a term and context
 */
function generateCacheKey(term: string, context: string): string {
  const normalized = `${term.toLowerCase()}-${context.substring(0, 100).toLowerCase()}`;
  let hash = 0;

  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }

  return `eli5_${hash.toString(16)}`;
}

/**
 * Get ELI5 explanation from OpenAI's chat completions API
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

    // Resolve API key from environment or saved settings if not provided explicitly.
    if (!apiKey) {
      const settings = await StorageService.getSettings();
      apiKey =
        process.env.EXPO_PUBLIC_OPENAI_API_KEY ||
        getExpoExtraOpenAIKey() ||
        settings.openaiApiKey ||
        settings.claudeApiKey;
    }

    if (!apiKey) {
      throw new Error(
        'OpenAI API key not configured. For TestFlight builds, set the key in app settings or configure EXPO_PUBLIC_OPENAI_API_KEY in EAS environment variables before building.'
      );
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

    const settings = await StorageService.getSettings();
    const model = settings.preferredModel || DEFAULT_GPT_MODEL;

    // Call OpenAI API
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You explain selected book phrases in plain language. Return valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error?.message || 'Failed to get AI explanation');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

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
      explanation: `This is a placeholder explanation for "${term}". To get AI-powered explanations, add an OpenAI API key with EXPO_PUBLIC_OPENAI_API_KEY or save openaiApiKey in app settings.`,
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
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_GPT_MODEL,
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
