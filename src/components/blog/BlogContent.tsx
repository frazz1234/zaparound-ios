import { useMemo, useState, SyntheticEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { ImageOff } from 'lucide-react';
import { Blog } from '@/types/blog';
import { getLocalizedContent } from '@/utils/blogUtils';
import { useTranslation } from 'react-i18next';

interface BlogContentProps {
  blog: Blog;
  language: string;
}

export function BlogContent({ blog, language }: BlogContentProps) {
  const { t } = useTranslation('blog');
  const [imageError, setImageError] = useState(false);
  
  // Memoize localized content to prevent recalculation on each render
  const localizedContent = useMemo(() => {
    return getLocalizedContent(blog, language);
  }, [blog, language]);

  // Memoize formatted date for the footer
  const formattedDate = useMemo(() => {
    return blog.published_at 
      ? format(new Date(blog.published_at), 'PPP')
      : format(new Date(blog.created_at), 'PPP');
  }, [blog]);

  // Handle image loading error
  const handleImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Failed to load blog image:', blog.image_url);
    setImageError(true);
  };

  // Ensure title is always a string
  const safeTitle = typeof localizedContent.title === 'string' 
    ? localizedContent.title 
    : '';

  // Ensure content is always a string
  const safeContent = typeof localizedContent.content === 'string' 
    ? localizedContent.content 
    : '';

  // Ensure image_url is absolute
  const imageUrl = blog.image_url
    ? (blog.image_url.startsWith('http') ? blog.image_url : `https://zaparound.com${blog.image_url}`)
    : null;

  // Debug: log the image URL
  if (imageUrl) {
    console.log('Blog image URL:', imageUrl);
  }

  return (
    <>
      {imageUrl && !imageError ? (
        <div className="w-full aspect-[16/9] relative">
          <img 
            src={imageUrl} 
            alt={safeTitle} 
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            width="1200"
            height="675"
            sizes="(max-width: 768px) 100vw, 1200px"
            onError={handleImageError}
          />
        </div>
      ) : blog.image_url && imageError ? (
        <div className="w-full aspect-[16/9] bg-gray-100 flex flex-col items-center justify-center">
          <ImageOff className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm">{t('error.imageNotAvailable')}</p>
        </div>
      ) : null}
      
      <div className="p-6 md:p-8 prose prose-lg max-w-none">
        <ReactMarkdown>{safeContent}</ReactMarkdown>
      </div>
      
      <footer className="px-6 py-4 bg-gray-50 border-t">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            ZapAround - {t('detail.publishedOn')} {formattedDate}
          </span>
        </div>
      </footer>
    </>
  );
}
