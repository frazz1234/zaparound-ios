import { useEffect, useCallback, useRef, useState } from 'react';
import { useBlogs } from '@/hooks/useBlogs';
import { BlogCard } from './BlogCard';
import { BlogPagination } from './BlogPagination';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import { Blog } from '@/types/blog';

// Define a type for the blog payload
type BlogPayload = {
  id: string;
  published_at: string | null;
  is_published: boolean;
  [key: string]: any;
} | null;

export function BlogList() {
  const { t, i18n } = useTranslation('blog');
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const blogsRef = useRef<HTMLDivElement>(null);
  const postsPerPage = 9; // Show 9 blogs per page

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('blogs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blogs'
        },
        (payload: RealtimePostgresChangesPayload<BlogPayload>) => {
          // Only update if the blog is published
          if (payload.new && 'is_published' in payload.new && payload.new.is_published) {
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch blogs with error handling and pagination
  const { data: blogsData, isLoading, error: fetchError } = useBlogs(currentPage, postsPerPage, i18n.language);

  console.log('BlogList - Raw blogs data:', blogsData);
  console.log('BlogList - Is loading:', isLoading);
  console.log('BlogList - Fetch error:', fetchError);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['blogs'] });
    } catch (err) {
      setError(t('error.title'));
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, t]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top of blog list
    if (blogsRef.current) {
      blogsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-muted-foreground">{t('loading.posts')}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (fetchError || error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('error.title')}</h3>
        <p className="text-muted-foreground mb-4">{t('error.description')}</p>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {t('error.refreshing')}
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('error.tryAgain')}
            </>
          )}
        </Button>
      </div>
    );
  }

  // Extract blogs array from the data object
  const blogs = blogsData?.blogs || [];
  console.log('BlogList - Extracted blogs array:', blogs);

  // Show empty state
  if (!blogs || !Array.isArray(blogs) || blogs.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">{t('empty.noPosts')}</h3>
        <p className="text-muted-foreground">{t('empty.noPostsDescription')}</p>
      </div>
    );
  }

  // Filter out unpublished blogs
  const publishedBlogs = blogs.filter((blog: Blog) => {
    console.log('Blog publish status:', { id: blog.id, is_published: blog.is_published });
    return blog.is_published;
  });
  console.log('BlogList - Published blogs:', publishedBlogs);

  return (
    <div className="space-y-8">
      <div ref={blogsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publishedBlogs.map((blog) => (
          <BlogCard key={blog.id} blog={blog} />
        ))}
      </div>
      
      {/* Pagination */}
      {blogsData && (
        <BlogPagination
          currentPage={currentPage}
          totalPages={blogsData.totalPages || 1}
          totalPosts={blogsData.count || 0}
          postsPerPage={postsPerPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
