import { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBlogById } from '@/hooks/useBlogs';

import { BlogHeader } from './BlogHeader';
import { BlogContent } from './BlogContent';
import { BlogMetaTags } from './BlogMetaTags';
import { Button } from '@/components/ui/button';

export function BlogDetail() {
  const { blogSlug = '' } = useParams();
  const { t, i18n } = useTranslation('blog');
  const language = i18n.language;
  const { data: blog, isLoading, error } = useBlogById(blogSlug);
  const navigate = useNavigate();


  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Handle the case where the blog is not found
  if (blog?.notFound) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <div className="flex flex-col items-center justify-center gap-4 max-w-md mx-auto">
          <AlertTriangle className="h-16 w-16 text-amber-500" />
          <h1 className="text-2xl font-bold text-gray-800">
            {t('error.notFound')}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('error.notFoundDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('form.back')}
            </Button>
            <Button 
              onClick={() => navigate(`/${language}/blog`)}
              className="flex items-center gap-2"
            >
              {t('detail.backToList')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-500">
          {t('error.title')}
        </h1>
        <p className="mb-6">
          {error?.message || t('error.description')}
        </p>
        <Link 
          to={`/${language}/blog`} 
          className="inline-flex items-center text-primary hover:underline"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t('detail.backToList')}
        </Link>
      </div>
    );
  }

  return (
    <>
      {blog && (
        <BlogMetaTags 
          blog={blog} 
          locale={language === 'en' ? 'en_US' : language === 'fr' ? 'fr_FR' : 'es_ES'} 
          url={`/${language}/blog/${blogSlug}`} 
        />
      )}
    
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Link 
          to={`/${language}/blog`} 
          className="inline-flex items-center text-primary hover:underline mb-8"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t('detail.backToList')}
        </Link>
        
        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Blog header section with title and metadata */}
          <BlogHeader blog={blog} language={language} />
          
          {/* Blog content section with image, content and footer */}
          <BlogContent blog={blog} language={language} />
        </article>
      </div>
    </>
  );
}
