import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Blog, getLocalizedContent } from '@/hooks/useBlogs';
import { createSlug } from '@/utils/blogUtils';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Calendar, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface RelatedPostsProps {
  currentBlog: Blog;
  relatedBlogs: Blog[];
  isLoading?: boolean;
}

interface PopularPostsProps {
  blogs: Blog[];
  isLoading?: boolean;
}

interface CategoryWidgetProps {
  categories: { name: string; count: number; color?: string }[];
  onCategorySelect?: (category: string) => void;
  isLoading?: boolean;
}

interface RecentPostsProps {
  blogs: Blog[];
  isLoading?: boolean;
}

export function RelatedPosts({ currentBlog, relatedBlogs, isLoading = false }: RelatedPostsProps) {
  const { t, i18n } = useTranslation('blog');
  const language = i18n.language;

  const filteredRelated = useMemo(() => {
    if (!Array.isArray(relatedBlogs)) {
      return [];
    }
    return relatedBlogs
      .filter(blog => blog.id !== currentBlog.id && blog.is_published)
      .slice(0, 3);
  }, [relatedBlogs, currentBlog.id]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
                      <CardTitle>{t('widgets.related.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-16 h-16 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredRelated.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="w-5 h-5" />
          {t('widgets.related.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredRelated.map((blog, index) => {
            const localizedContent = getLocalizedContent(blog, language);
            const blogSlug = createSlug(blog.title_en || blog.id);
            const blogPath = `/${language}/blog/${blogSlug}`;

            return (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={blogPath} className="flex gap-3 group">
                  {blog.image_url && (
                    <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                      <OptimizedImage
                        src={blog.image_url}
                        alt={localizedContent.title}
                        width={64}
                        height={64}
                        priority={true}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {localizedContent.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(blog.published_at || blog.created_at), 'MMM dd')}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function PopularPosts({ blogs, isLoading = false }: PopularPostsProps) {
  const { t, i18n } = useTranslation('blog');
  const language = i18n.language;

  const popularBlogs = useMemo(() => {
    if (!Array.isArray(blogs)) {
      return [];
    }
    return blogs
      .filter(blog => blog.is_published)
      .slice(0, 5);
  }, [blogs]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
                      <CardTitle>{t('widgets.popular.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-gray-200 rounded animate-pulse" />
                  <div className="h-2 bg-gray-200 rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          {t('widgets.popular.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {popularBlogs.map((blog, index) => {
            const localizedContent = getLocalizedContent(blog, language);
            const blogSlug = createSlug(blog.title_en || blog.id);
            const blogPath = `/${language}/blog/${blogSlug}`;

            return (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={blogPath} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {localizedContent.title}
                    </h4>

                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function CategoryWidget({ categories, onCategorySelect, isLoading = false }: CategoryWidgetProps) {
  const { t } = useTranslation('blog');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('widgets.categories')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('widgets.categories')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.isArray(categories) ? categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between h-auto p-2"
                onClick={() => onCategorySelect?.(category.name)}
              >
                <span className="text-left">{category.name}</span>
                <Badge variant="secondary" className="ml-2">
                  {category.count}
                </Badge>
              </Button>
            </motion.div>
          )) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentPosts({ blogs, isLoading = false }: RecentPostsProps) {
  const { t, i18n } = useTranslation('blog');
  const language = i18n.language;

  const recentBlogs = useMemo(() => {
    if (!Array.isArray(blogs)) {
      return [];
    }
    return blogs
      .filter(blog => blog.is_published)
      .sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at);
        const dateB = new Date(b.published_at || b.created_at);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 4);
  }, [blogs]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('widgets.recent.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          {t('widgets.recent.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentBlogs.map((blog, index) => {
            const localizedContent = getLocalizedContent(blog, language);
            const blogSlug = createSlug(blog.title_en || blog.id);
            const blogPath = `/${language}/blog/${blogSlug}`;

            return (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={blogPath} className="block group">
                  <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
                    {localizedContent.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(blog.published_at || blog.created_at), 'PPP')}
                  </div>
                  {blog.category && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {blog.category}
                    </Badge>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
