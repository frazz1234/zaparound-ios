import { supabase } from '@/integrations/supabase/client';
import { Blog } from '@/types/blog';
import { createSlug } from '@/utils/blogUtils';

// Get all blogs with pagination
export async function getBlogs(page = 1, limit = 10) {
  const start = (page - 1) * limit;
  const end = start + limit - 1;
  
  try {
    console.log('Fetching blogs from Supabase, range:', start, end);
    
    // Use fetch directly to handle the 406 error case
    const { data, error, count } = await supabase
      .from('blogs')
      .select('*', { count: 'exact' })
      .eq('is_published', true) // Only get published blogs
      .order('published_at', { ascending: false })
      .range(start, end);
      
    if (error) {
      console.error('Supabase error fetching blogs:', error);
      
      // Check if it's a 406 error
      if (error.code === '406' || error.message?.includes('406')) {
        console.error('406 Not Acceptable error - API content negotiation issue');
        
        // Try a fallback approach with minimal query
        const fallbackResult = await supabase
          .from('blogs')
          .select('id, title_en, created_at')
          .eq('is_published', true) // Only get published blogs
          .limit(limit);
          
        if (!fallbackResult.error && fallbackResult.data) {
          console.log('Fallback query succeeded with minimal fields');
          return { 
            blogs: fallbackResult.data || [], 
            count: fallbackResult.data.length,
            totalPages: 1
          };
        }
      }
      
      throw {
        message: 'Failed to fetch blog posts',
        details: error,
        supabaseError: true
      };
    }
    
    console.log(`Successfully fetched ${data?.length || 0} blogs`);
    
    // Cache the successful response
    try {
      localStorage.setItem('blogs-cache', JSON.stringify({ 
        blogs: data || [], 
        count: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        timestamp: Date.now()
      }));
    } catch (cacheError) {
      console.error('Error caching blogs:', cacheError);
    }
    
    return { 
      blogs: data || [], 
      count: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    };
  } catch (error) {
    console.error('Error in getBlogs function:', error);
    // Check if we have cached blogs in localStorage as fallback
    try {
      const cachedBlogs = localStorage.getItem('blogs-cache');
      if (cachedBlogs) {
        console.log('Using cached blogs as fallback');
        const parsed = JSON.parse(cachedBlogs);
        
        // Check if cache is not too old (less than 1 hour)
        if (parsed.timestamp && (Date.now() - parsed.timestamp < 3600000)) {
          return parsed;
        } else {
          console.log('Cache is too old, not using it');
        }
      }
    } catch (cacheError) {
      console.error('Error accessing cache:', cacheError);
    }
    
    // If all else fails, return empty blogs array
    return { 
      blogs: [], 
      count: 0,
      totalPages: 0,
      error: error
    };
  }
}

// Get a single blog by ID or slug
export async function getBlogBySlug(slug: string): Promise<Blog | null> {
  if (!slug || typeof slug !== 'string') {
    console.error('Invalid slug provided:', slug);
    return null;
  }

  // Normalize the slug to improve matching
  const normalizedSlug = slug.trim().toLowerCase();
  
  try {
    console.log('Fetching blog with slug:', normalizedSlug);
    
    // First get all blogs
    const { data: allBlogs, error: allBlogsError } = await supabase
      .from('blogs')
      .select('*')
      .eq('is_published', true); // Only get published blogs
      
    console.log('Total published blogs found:', allBlogs?.length || 0);
    if (allBlogs && allBlogs.length > 0) {
      console.log('Sample blog titles:', allBlogs.slice(0, 3).map(b => ({ id: b.id, title: b.title_en, slug: b.slug })));
    }
      
    if (allBlogsError) {
      console.error("Error fetching all blogs:", allBlogsError);
      throw {
        message: 'Failed to fetch blog posts',
        details: allBlogsError,
        supabaseError: true
      };
    }
    
    if (allBlogs && allBlogs.length > 0) {
      // First try to find by exact ID match (UUID)
      const blogById = allBlogs.find(blog => blog.id === normalizedSlug);
      if (blogById) {
        console.log('Blog found by ID:', blogById.id);
        return blogById as Blog;
      }
      
      // If not found by ID, try to match against a slug created from title_en
      const blogBySlug = allBlogs.find(blog => {
        if (!blog.title_en) return false;
        
        // Create a slug from the title using the same function as BlogCard
        const blogSlug = createSlug(blog.title_en);
        
        console.log(`Comparing slug "${blogSlug}" with "${normalizedSlug}" for blog "${blog.title_en}"`);
        
        return blogSlug === normalizedSlug;
      });
      
      if (blogBySlug) {
        console.log('Blog found by title slug:', blogBySlug.id);
        
        // Cache the blog for offline access
        try {
          const cacheKey = `blog-${normalizedSlug}`;
          localStorage.setItem(cacheKey, JSON.stringify({
            blog: blogBySlug,
            timestamp: Date.now()
          }));
        } catch (cacheError) {
          console.error('Error caching blog:', cacheError);
        }
        
        return blogBySlug as Blog;
      }
      
      // If still not found, try partial matching
      const blogByPartialTitle = allBlogs.find(blog => {
        if (!blog.title_en) return false;
        
        return blog.title_en.toLowerCase().includes(normalizedSlug.replace(/-/g, ' '));
      });
      
      if (blogByPartialTitle) {
        console.log('Blog found by partial title match:', blogByPartialTitle.id);
        return blogByPartialTitle as Blog;
      }
    }
    
    // If we get here, no blog was found
    console.log('No blog found with slug:', normalizedSlug);
    return null;
    
  } catch (error: any) {
    console.error('Error in getBlogBySlug function:', error);
    
    // Check for PGRST116 error (no rows returned)
    if (error.details?.code === 'PGRST116' || 
        error.details?.message?.includes('JSON object requested, multiple (or no) rows returned') ||
        error.message?.includes('JSON object requested, multiple (or no) rows returned')) {
      console.log('No blog found with slug (PGRST116):', normalizedSlug);
      return null;
    }
    
    // Try to get from cache if available
    try {
      const cacheKey = `blog-${normalizedSlug}`;
      const cachedBlog = localStorage.getItem(cacheKey);
      if (cachedBlog) {
        console.log('Using cached blog as fallback');
        const parsed = JSON.parse(cachedBlog);
        
        // Check if cache is not too old (less than 1 hour)
        if (parsed.timestamp && (Date.now() - parsed.timestamp < 3600000)) {
          return parsed.blog;
        } else {
          console.log('Cache is too old, not using it');
        }
      }
    } catch (cacheError) {
      console.error('Error accessing cache:', cacheError);
    }
    
    throw error;
  }
}

// Get blogs by category
export async function getBlogsByCategory(category: string, page = 1, limit = 10) {
  if (!category || typeof category !== 'string') {
    console.error('Invalid category provided:', category);
    return { 
      blogs: [], 
      count: 0,
      totalPages: 0,
      error: 'Invalid category'
    };
  }

  const start = (page - 1) * limit;
  const end = start + limit - 1;
  
  // Normalize the category to improve matching
  const normalizedCategory = category.trim().toLowerCase();
  const cacheKey = `blogs-category-${normalizedCategory}-page-${page}-limit-${limit}`;
  
  try {
    console.log(`Fetching blogs for category: ${normalizedCategory}, page: ${page}, limit: ${limit}`);
    
    const { data, error, count } = await supabase
      .from('blogs')
      .select('*', { count: 'exact' })
      .ilike('category', `%${normalizedCategory}%`)
      .order('published_at', { ascending: false })
      .range(start, end);
      
    if (error) {
      console.error('Error fetching blogs by category:', error);
      
      // Check if it's a 406 error
      if (error.code === '406' || error.message?.includes('406')) {
        console.error('406 Not Acceptable error - API content negotiation issue');
        
        // Try a fallback approach with minimal query
        const fallbackResult = await supabase
          .from('blogs')
          .select('id, title_en, created_at, category')
          .ilike('category', `%${normalizedCategory}%`)
          .limit(limit);
          
        if (!fallbackResult.error && fallbackResult.data) {
          console.log('Fallback query succeeded with minimal fields');
          
          // Cache the successful response
          try {
            localStorage.setItem(cacheKey, JSON.stringify({ 
              blogs: fallbackResult.data, 
              count: fallbackResult.data.length,
              totalPages: 1,
              timestamp: Date.now()
            }));
          } catch (cacheError) {
            console.error('Error caching blogs by category:', cacheError);
          }
          
          return { 
            blogs: fallbackResult.data, 
            count: fallbackResult.data.length,
            totalPages: 1
          };
        }
      }
      
      throw error;
    }
    
    const result = { 
      blogs: data || [], 
      count: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    };
    
    // Cache the successful response
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ 
        ...result,
        timestamp: Date.now()
      }));
    } catch (cacheError) {
      console.error('Error caching blogs by category:', cacheError);
    }
    
    return result;
  } catch (error) {
    console.error('Error in getBlogsByCategory:', error);
    
    // Try to get from cache if available
    try {
      const cachedBlogs = localStorage.getItem(cacheKey);
      if (cachedBlogs) {
        console.log('Using cached blogs by category as fallback');
        const parsed = JSON.parse(cachedBlogs);
        
        // Check if cache is not too old (less than 1 hour)
        if (parsed.timestamp && (Date.now() - parsed.timestamp < 3600000)) {
          return parsed;
        } else {
          console.log('Cache is too old, not using it');
        }
      }
    } catch (cacheError) {
      console.error('Error accessing cache:', cacheError);
    }
    
    return { 
      blogs: [], 
      count: 0,
      totalPages: 0,
      error: error
    };
  }
}

// Create a new blog post - Fix for author_id being required
export async function createBlog(blog: Partial<Blog>) {
  // Ensure author_id is present
  if (!blog.author_id) {
    throw new Error("author_id is required to create a blog post");
  }
  
  // Create a new object with just the required and provided fields
  const blogToInsert = {
    author_id: blog.author_id,
    title_en: blog.title_en || '',
    content_en: blog.content_en,
    excerpt_en: blog.excerpt_en,
    category: blog.category,
    image_url: blog.image_url,
    title_fr: blog.title_fr,
    content_fr: blog.content_fr,
    excerpt_fr: blog.excerpt_fr,
    title_es: blog.title_es,
    content_es: blog.content_es,
    excerpt_es: blog.excerpt_es,
    published_at: blog.published_at,
    parent_id: blog.parent_id,
    // The slug will be automatically generated by the database trigger if not provided
    slug: blog.slug
  };
  
  const { data, error } = await supabase
    .from('blogs')
    .insert(blogToInsert)
    .select();
    
  if (error) throw error;
  return data[0];
}

// Update an existing blog post
export async function updateBlog(id: string, blog: Partial<Blog>) {
  const { data, error } = await supabase
    .from('blogs')
    .update(blog)
    .eq('id', id)
    .select();
    
  if (error) throw error;
  return data[0];
}

// Delete a blog post
export async function deleteBlog(id: string) {
  const { error } = await supabase
    .from('blogs')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
}
