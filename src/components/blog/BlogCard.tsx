import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Blog, getLocalizedContent } from '@/hooks/useBlogs';
import { createSlug } from '@/utils/blogUtils';
import { OptimizedImage } from '@/components/OptimizedImage';

interface BlogCardProps {
  blog: Blog;
}

export function BlogCard({ blog }: BlogCardProps) {
  const { t, i18n } = useTranslation('blog');
  const language = i18n.language;
  const localizedContent = getLocalizedContent(blog, language);
  
  // Format date for better display
  const formattedDate = blog.published_at 
    ? format(new Date(blog.published_at), 'PPP') 
    : format(new Date(blog.created_at), 'PPP');

  // Create URL-friendly slug from English title
  const blogSlug = blog.title_en ? createSlug(blog.title_en) : blog.id;
  const blogPath = `/${language}/blog/${blogSlug}`;
  
  // Calculate estimated reading time
  const wordsPerMinute = 200;
  const content = typeof localizedContent.content === 'string' ? localizedContent.content : '';
  const wordCount = content.trim() ? content.split(/\s+/).filter(word => word.length > 0).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));

  // Ensure title is always a string
  const safeTitle = typeof localizedContent.title === 'string' 
    ? localizedContent.title 
    : '';

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg h-full flex flex-col">
      {blog.image_url && (
        <div className="aspect-video overflow-hidden">
          <OptimizedImage
            src={blog.image_url}
            alt={safeTitle}
            width={400}
            height={225}
            quality={85}
            priority={true}
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
            onError={() => {
              console.error('Failed to load blog card image:', blog.image_url);
            }}
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-2 text-xl font-bold hover:text-primary transition-colors">
          <Link to={blogPath}>
            {safeTitle}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow pb-2">
        <CardDescription className="line-clamp-3 text-sm">
          {localizedContent.excerpt || (content && content.substring(0, 150) + '...')}
        </CardDescription>
      </CardContent>
      <CardFooter className="pt-2 border-t">
        <Link 
          to={blogPath}
          className="text-primary hover:text-primary/80 font-medium text-sm flex items-center group"
          aria-label={`Read more about ${safeTitle}`}
        >
          {t('card.readMore')} 
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </CardFooter>
    </Card>
  );
}
