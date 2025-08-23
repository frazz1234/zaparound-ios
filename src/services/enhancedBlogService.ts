import { supabase } from '@/integrations/supabase/client';
import { Blog } from '@/types/blog';

// Enhanced blog service with improved error handling and caching

interface BlogQueryOptions {
  includeUnpublished?: boolean;
  orderBy?: 'published_at' | 'created_at' | 'updated_at';
  orderDirection?: 'asc' | 'desc';
}

interface BlogSearchOptions extends BlogQueryOptions {
  searchTerm?: string;
  categories?: string[];
  tags?: string[];
  locations?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Cache manager for blog data
class BlogCacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  invalidate(pattern?: string) {
    if (pattern) {
      Array.from(this.cache.keys())
        .filter(key => key.includes(pattern))
        .forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    return item !== null && Date.now() - item.timestamp <= item.ttl;
  }
}

const blogCache = new BlogCacheManager();

// Enhanced error handler
function handleSupabaseError(error: any, operation: string) {
  console.error(`Error in ${operation}:`, error);
  
  const errorInfo = {
    operation,
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint
  };

  // Handle specific error types
  if (error?.code === '406') {
    return {
      blogs: [],
      count: 0,
      totalPages: 0,
      error: {
        type: 'CONTENT_NEGOTIATION',
        message: 'API content negotiation issue',
        ...errorInfo
      }
    };
  }

  if (error?.code === 'PGRST116') {
    return {
      blogs: [],
      count: 0,
      totalPages: 0,
      error: {
        type: 'NOT_FOUND',
        message: 'No matching records found',
        ...errorInfo
      }
    };
  }

  return {
    blogs: [],
    count: 0,
    totalPages: 0,
    error: {
      type: 'UNKNOWN',
      message: 'An unexpected error occurred',
      ...errorInfo
    }
  };
}

// Get all blogs with enhanced options
export async function getEnhancedBlogs(
  page = 1, 
  limit = 10, 
  options: BlogQueryOptions = {}
) {
  const {
    includeUnpublished = false,
    orderBy = 'published_at',
    orderDirection = 'desc'
  } = options;

  const start = (page - 1) * limit;
  const end = start + limit - 1;
  const cacheKey = `blogs-${page}-${limit}-${includeUnpublished}-${orderBy}-${orderDirection}`;

  // Check cache first
  const cachedData = blogCache.get(cacheKey);
  if (cachedData) {
    console.log('Returning cached blog data');
    return cachedData;
  }

  try {
    console.log('Fetching blogs from Supabase, range:', start, end);
    
    let query = supabase
      .from('blogs')
      .select('*', { count: 'exact' });

    if (!includeUnpublished) {
      query = query.eq('is_published', true);
    }

    query = query
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(start, end);

    const { data, error, count } = await query;
      
    if (error) {
      console.error('Supabase error fetching blogs:', error);
      return handleSupabaseError(error, 'getEnhancedBlogs');
    }
    
    const result = { 
      blogs: data || [], 
      count: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    };

    // Cache the successful response
    blogCache.set(cacheKey, result);
    
    console.log(`Successfully fetched ${data?.length || 0} blogs`);
    return result;
    
  } catch (error) {
    console.error('Error in getEnhancedBlogs function:', error);
    return handleSupabaseError(error, 'getEnhancedBlogs');
  }
}

// Search blogs with advanced filtering
export async function searchBlogs(
  searchOptions: BlogSearchOptions,
  page = 1,
  limit = 10
) {
  const {
    searchTerm,
    categories = [],
    tags = [],
    locations = [],
    dateRange,
    includeUnpublished = false,
    orderBy = 'published_at',
    orderDirection = 'desc'
  } = searchOptions;

  const start = (page - 1) * limit;
  const end = start + limit - 1;
  const cacheKey = `search-${JSON.stringify(searchOptions)}-${page}-${limit}`;

  // Check cache first
  const cachedData = blogCache.get(cacheKey);
  if (cachedData) {
    console.log('Returning cached search data');
    return cachedData;
  }

  try {
    let query = supabase
      .from('blogs')
      .select('*', { count: 'exact' });

    if (!includeUnpublished) {
      query = query.eq('is_published', true);
    }

    // Apply search term filter
    if (searchTerm && searchTerm.trim()) {
      query = query.or(`title_en.ilike.%${searchTerm}%,title_fr.ilike.%${searchTerm}%,title_es.ilike.%${searchTerm}%,content_en.ilike.%${searchTerm}%,content_fr.ilike.%${searchTerm}%,content_es.ilike.%${searchTerm}%`);
    }

    // Apply category filter
    if (categories.length > 0) {
      query = query.in('category', categories);
    }

    // Apply location filter
    if (locations.length > 0) {
      query = query.in('location', locations);
    }

    // Apply date range filter
    if (dateRange) {
      query = query
        .gte('published_at', dateRange.start.toISOString())
        .lte('published_at', dateRange.end.toISOString());
    }

    // Apply tags filter (assuming tags are stored in activities array)
    if (tags.length > 0) {
      query = query.overlaps('activities', tags);
    }

    query = query
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(start, end);

    const { data, error, count } = await query;
      
    if (error) {
      console.error('Supabase error searching blogs:', error);
      return handleSupabaseError(error, 'searchBlogs');
    }
    
    const result = { 
      blogs: data || [], 
      count: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    };

    // Cache the successful response
    blogCache.set(cacheKey, result);
    
    console.log(`Successfully found ${data?.length || 0} blogs`);
    return result;
    
  } catch (error) {
    console.error('Error in searchBlogs function:', error);
    return handleSupabaseError(error, 'searchBlogs');
  }
}

// Get featured blogs
export async function getFeaturedBlogs(limit = 5) {
  const cacheKey = `featured-blogs-${limit}`;

  // Check cache first
  const cachedData = blogCache.get(cacheKey);
  if (cachedData) {
    console.log('Returning cached featured blogs');
    return cachedData;
  }

  try {
    // For now, we'll use the latest published blogs as featured
    // In the future, you could add a 'featured' column to the blogs table
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase error fetching featured blogs:', error);
      return { blogs: [], error };
    }

    const result = { blogs: data || [] };

    // Cache the successful response
    blogCache.set(cacheKey, result);
    
    return result;
    
  } catch (error) {
    console.error('Error in getFeaturedBlogs function:', error);
    return { blogs: [], error };
  }
}

// Get related blogs based on category and tags
export async function getRelatedBlogs(currentBlogId: string, category?: string, activities?: string[], limit = 5) {
  const cacheKey = `related-${currentBlogId}-${category}-${activities?.join(',')}-${limit}`;

  // Check cache first
  const cachedData = blogCache.get(cacheKey);
  if (cachedData) {
    console.log('Returning cached related blogs');
    return cachedData;
  }

  try {
    let query = supabase
      .from('blogs')
      .select('*')
      .eq('is_published', true)
      .neq('id', currentBlogId);

    // First try to find blogs with the same category
    if (category) {
      query = query.eq('category', category);
    }

    // If we have activities/tags, look for overlapping ones
    if (activities && activities.length > 0) {
      query = query.overlaps('activities', activities);
    }

    query = query
      .order('published_at', { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching related blogs:', error);
      return { blogs: [], error };
    }

    const result = { blogs: data || [] };

    // Cache the successful response
    blogCache.set(cacheKey, result);
    
    return result;
    
  } catch (error) {
    console.error('Error in getRelatedBlogs function:', error);
    return { blogs: [], error };
  }
}

// Get blog statistics
export async function getBlogStatistics() {
  const cacheKey = 'blog-statistics';

  // Check cache first with longer TTL for stats
  const cachedData = blogCache.get(cacheKey);
  if (cachedData) {
    console.log('Returning cached blog statistics');
    return cachedData;
  }

  try {
    // Get total count
    const { count: totalBlogs, error: countError } = await supabase
      .from('blogs')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    if (countError) {
      console.error('Error fetching blog count:', countError);
    }

    // Get category distribution
    const { data: categoryData, error: categoryError } = await supabase
      .from('blogs')
      .select('category')
      .eq('is_published', true)
      .not('category', 'is', null);

    if (categoryError) {
      console.error('Error fetching categories:', categoryError);
    }

    // Process category data
    const categoryStats = categoryData?.reduce((acc: Record<string, number>, blog) => {
      if (blog.category) {
        acc[blog.category] = (acc[blog.category] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    const result = {
      totalBlogs: totalBlogs || 0,
      categories: Object.entries(categoryStats).map(([name, count]) => ({
        name,
        count: count as number
      })).sort((a, b) => b.count - a.count)
    };

    // Cache with longer TTL for statistics (30 minutes)
    blogCache.set(cacheKey, result, 30 * 60 * 1000);
    
    return result;
    
  } catch (error) {
    console.error('Error in getBlogStatistics function:', error);
    return {
      totalBlogs: 0,
      categories: []
    };
  }
}

// Cache management functions
export const blogCacheManager = {
  invalidate: (pattern?: string) => blogCache.invalidate(pattern),
  clear: () => blogCache.invalidate(),
  has: (key: string) => blogCache.has(key)
};

// Re-export existing functions for backwards compatibility
export * from '@/services/blogService';
