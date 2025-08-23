import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { getBlogs, getBlogBySlug, getBlogsByCategory } from '@/services/blogService';
import { blogCache, getOrSetCache } from '@/utils/cache';
import { CACHE_TIME, STALE_TIME, getLocalizedContent } from '@/utils/blogUtils';
import { Blog } from '@/types/blog';

// Re-export necessary types and functions to maintain API compatibility
export type { Blog };
export { getLocalizedContent };

// Hook to fetch all blogs with pagination
export const useBlogs = (page = 1, limit = 9, language = 'en') => {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['blogs', page, limit, language],
    queryFn: async () => {
      try {
        console.log('useBlogs - Fetching blogs for language:', language, 'page:', page, 'limit:', limit);
        
        // Use our new cache implementation
        const result = await getOrSetCache(
          blogCache,
          `blogs-${language}-${page}-${limit}`,
          async () => {
            console.log('useBlogs - Fetching from API');
            const data = await getBlogs(page, limit);
            console.log('useBlogs - API response:', data);
            if (data.error) {
              throw data.error;
            }
            return data;
          },
          { ttl: STALE_TIME }
        );
        
        console.log('useBlogs - Final result:', result);
        
        // If blogs array is empty but no error, it might be a valid empty state
        if (result.blogs.length === 0) {
          console.log('useBlogs - No blogs found, but no error occurred');
        }
        
        return result;
      } catch (error: any) {
        console.error('Error in useBlogs:', error);
        const errorMessage = error?.message || 'Unknown error occurred';
        const errorDetails = error?.details || '';
        console.error('Error details:', { message: errorMessage, details: errorDetails });
        
        // Check if it's a 406 error
        if (error?.code === '406' || error?.message?.includes('406') || 
            error?.details?.code === '406' || error?.details?.message?.includes('406')) {
          console.error('406 Not Acceptable error detected in hook');
          toast({
            title: "API Compatibility Issue",
            description: "There's a compatibility issue with the blog service. Our team has been notified.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error loading blog posts",
            description: "Please try again later. If the problem persists, contact support.",
            variant: "destructive",
          });
        }
        
        throw error;
      }
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: 3,
  });
};

// Create a placeholder blog for not found cases
const createNotFoundBlog = (): Blog => {
  const now = new Date().toISOString();
  return {
    id: 'not-found',
    title_en: 'Blog Not Found',
    title_fr: 'Blog Non Trouvé',
    title_es: 'Blog No Encontrado',
    content_en: 'The blog post you are looking for could not be found.',
    content_fr: 'L\'article de blog que vous recherchez est introuvable.',
    content_es: 'La entrada de blog que estás buscando no se pudo encontrar.',
    excerpt_en: 'Not found',
    excerpt_fr: 'Non trouvé',
    excerpt_es: 'No encontrado',
    image_url: null,
    author_id: 'system',
    category: null,
    created_at: now,
    updated_at: now,
    published_at: null,
    parent_id: null,
    notFound: true
  } as Blog;
};

// Hook to fetch a single blog by ID
export const useBlogById = (blogSlug: string) => {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['blog', blogSlug],
    queryFn: async () => {
      try {
        console.log('Fetching blog with slug:', blogSlug);
        const result = await getBlogBySlug(blogSlug);
        console.log('Blog fetched successfully:', result);
        
        // If no blog was found, handle it gracefully
        if (result === null) {
          console.log('No blog found with slug:', blogSlug);
          toast({
            title: "Blog not found",
            description: "The blog post you're looking for doesn't exist or has been removed.",
            variant: "destructive",
          });
          
          // Return a placeholder blog object to avoid errors in the UI
          return createNotFoundBlog();
        }
        
        return result;
      } catch (error: any) {
        console.error('Error in useBlogById:', error);
        const errorMessage = error?.message || 'Unknown error occurred';
        const errorDetails = error?.details || '';
        console.error('Error details:', { message: errorMessage, details: errorDetails });
        
        // Check if it's a PGRST116 error (no rows returned)
        if (error?.code === 'PGRST116' || 
            error?.message?.includes('JSON object requested, multiple (or no) rows returned') ||
            error?.details?.code === 'PGRST116' || 
            error?.details?.message?.includes('JSON object requested, multiple (or no) rows returned')) {
          console.error('PGRST116 error detected in hook - No blog found');
          toast({
            title: "Blog not found",
            description: "The blog post you're looking for doesn't exist or has been removed.",
            variant: "destructive",
          });
          
          // Return a placeholder blog object to avoid errors in the UI
          return createNotFoundBlog();
        }
        
        // Check if it's a 406 error
        if (error?.code === '406' || error?.message?.includes('406') || 
            error?.details?.code === '406' || error?.details?.message?.includes('406')) {
          console.error('406 Not Acceptable error detected in hook');
          toast({
            title: "API Compatibility Issue",
            description: "There's a compatibility issue with the blog service. Our team has been notified.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error loading blog post",
            description: "Please try again later. If the problem persists, contact support.",
            variant: "destructive",
          });
        }
        
        throw error;
      }
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    enabled: !!blogSlug,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000)
  });
};

interface UseBlogsByCategoryOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  [key: string]: any;
}

// Hook to fetch blogs by category with pagination
export const useBlogsByCategory = (
  category: string, 
  page = 1, 
  limit = 9, 
  options: UseBlogsByCategoryOptions = {}
) => {
  const { toast } = useToast();
  
  // Extract enabled from options to handle it properly
  const { enabled, ...otherOptions } = options;
  const isEnabled = enabled !== undefined ? Boolean(enabled) : Boolean(category && category.trim() !== '');
  
  return useQuery({
    queryKey: ['blogs', 'category', category, page, limit],
    queryFn: async () => {
      if (!category || category === '') {
        return { blogs: [], count: 0, totalPages: 0 };
      }
      
      try {
        console.log('useBlogsByCategory - Fetching blogs for category:', category, 'page:', page, 'limit:', limit);
        
        // Use our new cache implementation
        const result = await getOrSetCache(
          blogCache,
          `blogs-category-${category}-${page}-${limit}`,
          async () => {
            console.log('useBlogsByCategory - Fetching from API');
            const data = await getBlogsByCategory(category, page, limit);
            console.log('useBlogsByCategory - API response:', data);
            if (data.error) {
              throw data.error;
            }
            return data;
          },
          { ttl: STALE_TIME }
        );
        
        console.log('useBlogsByCategory - Final result:', result);
        
        return result;
      } catch (error: any) {
        console.error('Error in useBlogsByCategory:', error);
        const errorMessage = error?.message || 'Unknown error occurred';
        const errorDetails = error?.details || '';
        console.error('Error details:', { message: errorMessage, details: errorDetails });
        
        toast({
          title: "Error loading blog posts",
          description: "Please try again later. If the problem persists, contact support.",
          variant: "destructive",
        });
        
        throw error;
      }
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: isEnabled,
    ...otherOptions
  });
};
