import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useBlogs, useBlogsByCategory } from '@/hooks/useBlogs';
import { BlogFilters, BlogFiltersState } from './BlogFilters';
import { BlogCard, BlogCardSkeleton } from './EnhancedBlogCard';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, BookOpen, Grid, List, Loader2 } from 'lucide-react';
import { Blog } from '@/types/blog';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { debounce } from 'lodash';

type ViewMode = 'grid' | 'list' | 'minimal';

interface BlogListState {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  isLoading: boolean;
  error: string | null;
  viewMode: ViewMode;
  filters: BlogFiltersState;
}

// Define a type for the blog payload
type BlogPayload = {
  id: string;
  published_at: string | null;
  is_published: boolean;
  [key: string]: any;
} | null;

export function EnhancedBlogList() {
  const { t, i18n } = useTranslation('blog');
  const queryClient = useQueryClient();
  const blogsRef = useRef<HTMLDivElement>(null);
  const postsPerPage = 12;

  const [state, setState] = useState<BlogListState>({
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0,
    isLoading: false,
    error: null,
    viewMode: 'grid',
    filters: {
      search: '',
      category: '',
      dateRange: '',
      sortBy: 'newest',
      tags: [],
      location: ''
    }
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [featuredBlogs, setFeaturedBlogs] = useState<Blog[]>([]);

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

  // Fetch blogs based on filters
  const shouldUseCategoryQuery = Boolean(state.filters.category && state.filters.category.trim() !== '');
  
  const { 
    data: blogsData, 
    isLoading: isBlogsLoading, 
    error: fetchError 
  } = useBlogs(
    state.currentPage, 
    postsPerPage, 
    i18n.language
  );

  const { 
    data: categoryBlogsData, 
    isLoading: isCategoryLoading,
    error: categoryError 
  } = useBlogsByCategory(
    state.filters.category,
    state.currentPage,
    postsPerPage,
    {
      enabled: shouldUseCategoryQuery,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    }
  );

  // Determine which data to use
  const currentData = shouldUseCategoryQuery ? categoryBlogsData : blogsData;
  const currentLoading = shouldUseCategoryQuery ? isCategoryLoading : isBlogsLoading;
  const currentError = shouldUseCategoryQuery ? categoryError : fetchError;

  // Update state when data changes
  useEffect(() => {
    if (currentData) {
      setState(prev => ({
        ...prev,
        totalPages: currentData.totalPages || 1,
        totalPosts: currentData.count || 0,
        isLoading: false,
        error: null
      }));
    }
  }, [currentData]);

  // Update loading state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isLoading: currentLoading
    }));
  }, [currentLoading]);

  // Handle errors
  useEffect(() => {
    if (currentError) {
      setState(prev => ({
        ...prev,
        error: t('error.title'),
        isLoading: false
      }));
    }
  }, [currentError, t]);

  // Filter and sort blogs
  const filteredAndSortedBlogs = useMemo(() => {
    if (!currentData?.blogs) return [];

    let blogs = [...currentData.blogs].filter((blog: Blog) => blog.is_published);

    // Apply search filter
    if (state.filters.search) {
      const searchLower = state.filters.search.toLowerCase();
      blogs = blogs.filter(blog => {
        const titleMatch = blog.title_en?.toLowerCase().includes(searchLower) ||
                          blog.title_fr?.toLowerCase().includes(searchLower) ||
                          blog.title_es?.toLowerCase().includes(searchLower);
        const contentMatch = blog.content_en?.toLowerCase().includes(searchLower) ||
                            blog.content_fr?.toLowerCase().includes(searchLower) ||
                            blog.content_es?.toLowerCase().includes(searchLower);
        return titleMatch || contentMatch;
      });
    }

    // Apply location filter
    if (state.filters.location) {
      blogs = blogs.filter(blog => blog.location === state.filters.location);
    }

    // Apply date range filter
    if (state.filters.dateRange) {
      const now = new Date();
      const filterDate = new Date();
      
      switch (state.filters.dateRange) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      blogs = blogs.filter(blog => {
        const blogDate = new Date(blog.published_at || blog.created_at);
        return blogDate >= filterDate;
      });
    }

    // Apply tags filter
    if (state.filters.tags.length > 0) {
      blogs = blogs.filter(blog => 
        state.filters.tags.some(tag => 
          blog.activities?.includes(tag) || 
          blog.category?.toLowerCase().includes(tag.toLowerCase())
        )
      );
    }

    // Apply sorting
    blogs.sort((a, b) => {
      const dateA = new Date(a.published_at || a.created_at);
      const dateB = new Date(b.published_at || b.created_at);
      
      switch (state.filters.sortBy) {
        case 'oldest':
          return dateA.getTime() - dateB.getTime();
        case 'popular':
          // Placeholder for popularity sorting - would need view counts
          return dateB.getTime() - dateA.getTime();
        case 'trending':
          // Placeholder for trending sorting - would need engagement metrics
          return dateB.getTime() - dateA.getTime();
        case 'newest':
        default:
          return dateB.getTime() - dateA.getTime();
      }
    });

    return blogs;
  }, [currentData, state.filters]);

  // Get unique categories, tags, and locations for filters
  const filterOptions = useMemo(() => {
    if (!currentData?.blogs) {
      return { categories: [], tags: [], locations: [] };
    }

    const categories = Array.from(
      new Set(
        currentData.blogs
          .filter((blog: Blog) => blog.category)
          .map((blog: Blog) => blog.category)
      )
    ).filter(Boolean) as string[];

    const tags = Array.from(
      new Set(
        currentData.blogs
          .flatMap((blog: Blog) => blog.activities || [])
          .filter(Boolean)
      )
    ) as string[];

    const locations = Array.from(
      new Set(
        currentData.blogs
          .filter((blog: Blog) => blog.location)
          .map((blog: Blog) => blog.location)
      )
    ).filter(Boolean) as string[];

    return { categories, tags, locations };
  }, [currentData]);

  // Fetch featured blogs
  useEffect(() => {
    const fetchFeaturedBlogs = async () => {
      try {
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .eq('is_published', true)
          .order('published_at', { ascending: false })
          .limit(3);

        if (!error && data) {
          setFeaturedBlogs(data);
        }
      } catch (err) {
        console.error('Error fetching featured blogs:', err);
      }
    };

    fetchFeaturedBlogs();
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['blogs'] });
    } catch (err) {
              setState(prev => ({ ...prev, error: t('error.title') }));
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, t]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
    if (blogsRef.current) {
      blogsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Handle filters change
  const handleFiltersChange = useCallback((filters: BlogFiltersState) => {
    setState(prev => ({
      ...prev,
      filters,
      currentPage: 1 // Reset to first page when filters change
    }));
  }, []);

  // Handle view mode change
  const handleViewModeChange = useCallback((viewMode: ViewMode) => {
    setState(prev => ({ ...prev, viewMode }));
  }, []);

  // Show loading state
  if (state.isLoading && state.currentPage === 1) {
    return (
      <div className="space-y-6">
        <BlogFilters
          filters={state.filters}
          onFiltersChange={handleFiltersChange}
          availableCategories={filterOptions.categories}
          availableTags={filterOptions.tags}
          availableLocations={filterOptions.locations}
          isLoading={true}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <BlogCardSkeleton key={i} variant="default" />
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (state.error && !state.isLoading) {
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

  // Show empty state
  if (filteredAndSortedBlogs.length === 0 && !state.isLoading) {
    return (
      <div className="space-y-6">
        <BlogFilters
          filters={state.filters}
          onFiltersChange={handleFiltersChange}
          availableCategories={filterOptions.categories}
          availableTags={filterOptions.tags}
          availableLocations={filterOptions.locations}
          totalResults={0}
        />
        
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('empty.noPosts')}</h3>
        <p className="text-muted-foreground mb-4">{t('empty.noPostsDescription')}</p>
          <Button variant="outline" onClick={() => handleFiltersChange({
            search: '',
            category: '',
            dateRange: '',
            sortBy: 'newest',
            tags: [],
            location: ''
          })}>
            {t('filters.clearFilters')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={blogsRef}>
      {/* Filters */}
      <BlogFilters
        filters={state.filters}
        onFiltersChange={handleFiltersChange}
        availableCategories={filterOptions.categories}
        availableTags={filterOptions.tags}
        availableLocations={filterOptions.locations}
        isLoading={state.isLoading}
        totalResults={filteredAndSortedBlogs.length}
      />

      {/* Featured Section */}
      {featuredBlogs.length > 0 && state.currentPage === 1 && !Object.values(state.filters).some(f => 
        Array.isArray(f) ? f.length > 0 : f !== '' && f !== 'newest'
      ) && (
        <Card className="mb-8 border-0 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {t('card.featured')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {featuredBlogs.slice(0, 3).map((blog, index) => (
                <BlogCard
                  key={blog.id}
                  blog={blog}
                  variant="featured"
                  index={index}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Mode Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t('viewModes.title')}:
          </span>
          <Tabs value={state.viewMode} onValueChange={handleViewModeChange as any}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="grid" className="flex items-center gap-1">
                <Grid className="w-4 h-4" />
                {t('viewModes.grid')}
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-1">
                <List className="w-4 h-4" />
                {t('viewModes.list')}
              </TabsTrigger>
              <TabsTrigger value="minimal" className="flex items-center gap-1">
                <List className="w-4 h-4" />
                {t('viewModes.minimal')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {state.isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('loading.posts')}
          </div>
        )}
      </div>

      {/* Blog Grid/List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className={`
            ${state.viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : ''}
            ${state.viewMode === 'list' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : ''}
            ${state.viewMode === 'minimal' ? 'space-y-0' : ''}
          `}
        >
          {filteredAndSortedBlogs.map((blog, index) => (
            <BlogCard
              key={blog.id}
              blog={blog}
              variant={state.viewMode === 'grid' ? 'default' : state.viewMode === 'list' ? 'compact' : 'minimal'}
              index={index}
              showDescription={state.viewMode !== 'minimal'}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Load More / Pagination */}
      {state.totalPages > 1 && (
        <div className="flex justify-center pt-8">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={state.currentPage === 1 || state.isLoading}
              onClick={() => handlePageChange(state.currentPage - 1)}
            >
              {t('pagination.previous')}
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, state.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={page === state.currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    disabled={state.isLoading}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              disabled={state.currentPage === state.totalPages || state.isLoading}
              onClick={() => handlePageChange(state.currentPage + 1)}
            >
              {t('pagination.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
