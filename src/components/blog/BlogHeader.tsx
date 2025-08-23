import { useMemo } from 'react';
import { format } from 'date-fns';
import { Calendar, Tag } from 'lucide-react';
import { Blog } from '@/types/blog';
import { getLocalizedContent } from '@/utils/blogUtils';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface BlogHeaderProps {
  blog: Blog;
  language: string;
}

export function BlogHeader({ blog, language }: BlogHeaderProps) {
  const { t } = useTranslation('blog');
  
  // Memoize localized content to prevent recalculation on each render
  const localizedContent = useMemo(() => {
    return getLocalizedContent(blog, language);
  }, [blog, language]);

  // Memoize formatted date to prevent recalculation on each render
  const formattedDate = useMemo(() => {
    return blog.published_at 
      ? format(new Date(blog.published_at), 'PPP')
      : format(new Date(blog.created_at), 'PPP');
  }, [blog]);

  // Memoize reading time calculation
  const readingTime = useMemo(() => {
    if (!localizedContent.content) return 1;
    const wordsPerMinute = 200;
    const content = localizedContent.content.trim();
    const wordCount = content ? content.split(/\s+/).filter(word => word.length > 0).length : 0;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }, [localizedContent.content]);

  return (
    <header className="p-6 border-b">
      <h1 className="text-3xl md:text-4xl font-bold mb-4 text-primary">{localizedContent.title}</h1>
      
      <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
        <div className="flex items-center">
          <Calendar className="mr-1.5 h-4 w-4" />
          <span>
            {blog.published_at 
                          ? `${t('detail.publishedOn')} ${formattedDate}`
            : `${t('detail.createdOn')} ${formattedDate}`}
          </span>
        </div>
        {blog.category && (
          <div className="flex items-center">
            <Tag className="mr-1.5 h-4 w-4" />
            <Link 
              to={`/${language}/blog/category/${blog.category.toLowerCase()}`}
              className="text-primary font-medium hover:underline"
            >
              {blog.category}
            </Link>
          </div>
        )}
        <div className="text-sm text-muted-foreground">
                      {t('detail.readingTime', { time: readingTime })}
        </div>
      </div>
      

    </header>
  );
}
