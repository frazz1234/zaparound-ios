import { Blog } from '@/types/blog';

// Cache durations in milliseconds
export const CACHE_TIME = 1000 * 60 * 60; // 1 hour
export const STALE_TIME = 1000 * 60 * 5;  // 5 minutes - reduced from 15 minutes to 5 minutes

// Helper function to ensure a value is a string
const ensureString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return typeof value === 'string' ? value : String(value);
};

// Helper function to get language-specific content
export const getLocalizedContent = (blog: Blog, language: string) => {
  const lang = language || 'en'; // Default to English if no language specified
  
  // Get content for the specified language, with fallback to English
  const title = blog[`title_${lang}` as keyof Blog] || blog.title_en;
  const content = blog[`content_${lang}` as keyof Blog] || blog.content_en;
  const excerpt = blog[`excerpt_${lang}` as keyof Blog] || blog.excerpt_en;
  
  return {
    title: ensureString(title),
    content: ensureString(content),
    excerpt: excerpt !== null && excerpt !== undefined ? ensureString(excerpt) : null,
  };
};

// Helper function to create URL-friendly slug
export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};
