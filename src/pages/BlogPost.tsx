
import { BlogDetail } from '@/components/blog/BlogDetail';
import { BlogMetaTags } from '@/components/blog/BlogMetaTags';
import { SEO } from '@/components/SEO';
import { RelatedPosts } from '@/components/blog/BlogWidgets';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Blog } from '@/types/blog';
import { getEnhancedBlogs, getRelatedBlogs } from '@/services/enhancedBlogService';
import { supabase } from '@/integrations/supabase/client';
import { createSlug } from '@/utils/blogUtils';

export default function BlogPost() {
  const { lang, blogSlug } = useParams();
  const { t } = useTranslation('blog');
  const language = lang || 'en';
  const locale = language === 'en' ? 'en_US' : language === 'fr' ? 'fr_FR' : 'es_ES';
  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      if (!blogSlug) return;
      
      try {
        // First try to get from enhanced service cache
        const { blogs } = await getEnhancedBlogs(1, 100, {
          includeUnpublished: false,
          orderBy: 'published_at'
        });
        

        
        const cachedBlog = blogs.find(b => b.slug === blogSlug);
        
        if (cachedBlog) {
          setBlog(cachedBlog);
        } else {
          // Fallback to direct database query
          
          // Try multiple approaches to find the blog
          let foundBlog = null;
          
          // 1. Try exact slug match
          const { data: slugData, error: slugError } = await supabase
            .from('blogs')
            .select('*')
            .eq('slug', blogSlug)
            .eq('is_published', true);

          if (!slugError && slugData && slugData.length > 0) {
            foundBlog = slugData[0];
          } else {
            // 2. Try to find by generated slug from title_en
            const { data: allBlogs, error: allError } = await supabase
              .from('blogs')
              .select('*')
              .eq('is_published', true);

            if (!allError && allBlogs) {
              const matchingBlog = allBlogs.find(blog => {
                const generatedSlug = blog.title_en ? createSlug(blog.title_en) : null;
                return generatedSlug === blogSlug;
              });
              
              if (matchingBlog) {
                foundBlog = matchingBlog;
              }
            }
            
            // 3. Try to find by ID if blogSlug looks like an ID
            if (!foundBlog && blogSlug && blogSlug.length > 10) {
              const { data: idData, error: idError } = await supabase
                .from('blogs')
                .select('*')
                .eq('id', blogSlug)
                .eq('is_published', true);

              if (!idError && idData && idData.length > 0) {
                foundBlog = idData[0];
              }
            }
          }
          
          if (foundBlog) {
            setBlog(foundBlog);
          } else {
            setBlog(null);
          }
        }
      } catch (error) {
        console.error('Error fetching blog:', error);
        setBlog(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [blogSlug, language]);

  // Fetch related blogs when main blog is loaded
  useEffect(() => {
    const fetchRelatedBlogs = async () => {
      if (!blog?.id) return;
      
      setRelatedLoading(true);
      try {
        const related = await getRelatedBlogs(
          blog.id, 
          blog.category, 
          blog.activities || [],
          4 // Limit to 4 related posts
        );
        setRelatedBlogs(related);
      } catch (error) {
        console.error('Error fetching related blogs:', error);
        setRelatedBlogs([]);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchRelatedBlogs();
  }, [blog]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!blog || blog.notFound) {
    return (
      <>
        <SEO
          title="Blog Post Not Found - ZapAround"
          description="The blog post you're looking for doesn't exist."
          noindex={true}
          nofollow={true}
          url={`/${language}/blog/${blogSlug}`}
          locale={locale}
        />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">{t('error.notFound')}</h1>
            <p className="text-gray-600 mb-6">{t('error.notFoundDescription')}</p>
            <a 
              href={`/${language}/blog`}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              ← {t('detail.backToList')}
            </a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <BlogMetaTags 
        blog={blog} 
        locale={locale} 
        url={`/${language}/blog/${blogSlug}`} 
      />
      <div className="container mx-auto px-4 py-8">
        <BlogDetail />
        
        {/* Related Posts Section */}
        {blog && (
          <div className="mt-16">
            <RelatedPosts 
              currentBlog={blog}
              relatedBlogs={relatedBlogs}
              isLoading={relatedLoading}
            />
          </div>
        )}
      </div>
    </>
  );
}
