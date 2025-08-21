import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/components/SEO';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogPagination } from '@/components/blog/BlogPagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Tag, BookOpen, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Blog } from '@/types/blog';

interface CategoryBlogs {
  blogs: Blog[];
  count: number;
  totalPages: number;
}

export default function BlogCategory() {
  const { categorySlug, lang = 'en' } = useParams<{ categorySlug: string; lang: string }>();
  const language = lang; // Keep the variable name for consistency with the rest of the component
  const { t, i18n } = useTranslation(['blog']);
  const navigate = useNavigate();
  
  const [categoryBlogs, setCategoryBlogs] = useState<CategoryBlogs>({ blogs: [], count: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryInfo, setCategoryInfo] = useState<{ name: string; description: string; count: number } | null>(null);
  
  const postsPerPage = 9;

  // Fetch blogs by category
  const fetchCategoryBlogs = async (page: number = 1) => {
    if (!categorySlug) return;

    setLoading(true);
    setError(null);

    try {
      const start = (page - 1) * postsPerPage;
      const end = start + postsPerPage - 1;

      // First, get the category name from the slug
      const categoryName = categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      // Fetch blogs for this category
      const { data: blogs, error: blogsError, count } = await supabase
        .from('blogs')
        .select('*', { count: 'exact' })
        .eq('is_published', true)
        .eq('category', categoryName)
        .order('published_at', { ascending: false })
        .range(start, end);

      if (blogsError) {
        console.error('Error fetching category blogs:', blogsError);
        throw new Error('Failed to fetch category blogs');
      }

      // Get total count for this category
      const { count: totalCount } = await supabase
        .from('blogs')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)
        .eq('category', categoryName);

      const totalPages = Math.ceil((totalCount || 0) / postsPerPage);

      setCategoryBlogs({
        blogs: blogs || [],
        count: totalCount || 0,
        totalPages
      });

      // Set category info for SEO
      setCategoryInfo({
        name: categoryName,
        description: `${categoryName} travel articles, tips, and guides on ZapAround. Discover the best ${categoryName.toLowerCase()} destinations and experiences.`,
        count: totalCount || 0
      });

    } catch (err) {
      console.error('Error in fetchCategoryBlogs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch category blogs');
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchCategoryBlogs(page);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle language change
  const handleLanguageChange = (newLanguage: string) => {
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(`/${language}/`, `/${newLanguage}/`);
    navigate(newPath);
  };

  useEffect(() => {
    fetchCategoryBlogs(currentPage);
  }, [categorySlug, currentPage]);

  // Generate category-specific SEO data
  const generateCategorySEO = () => {
    if (!categoryInfo) return {};

    const categoryName = categoryInfo.name;
    const categorySlugFormatted = categorySlug || '';
    
    return {
      title: `${categoryName} Travel Articles & Guides | ZapAround`,
      description: categoryInfo.description,
      keywords: `${categoryName}, travel, ${categoryName.toLowerCase()}, travel guide, travel tips, ZapAround, ${categoryName.toLowerCase()} destinations`,
      url: `/${language}/blog/category/${categorySlugFormatted}`,
      type: 'website' as const,
      structuredData: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": `${categoryName} Travel Articles`,
        "description": categoryInfo.description,
        "url": `https://zaparound.com/${language}/blog/category/${categorySlugFormatted}`,
        "mainEntity": {
          "@type": "ItemList",
          "numberOfItems": categoryInfo.count,
          "itemListElement": categoryBlogs.blogs.slice(0, 10).map((blog, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
              "@type": "BlogPosting",
              "headline": blog[`title_${language}` as keyof Blog] || blog.title_en,
              "url": `https://zaparound.com/${language}/blog/${blog.slug}`,
              "datePublished": blog.published_at,
              "dateModified": blog.updated_at,
              "author": {
                "@type": "Organization",
                "name": "ZapAround"
              },
              "publisher": {
                "@type": "Organization",
                "name": "ZapAround",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://zaparound.com/zaparound-uploads/transparentnoliner.webp"
                }
              }
            }
          }))
        }
      }
    };
  };

  const seoData = generateCategorySEO();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">{t('category.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SEO
          title="Category Not Found | ZapAround"
          description="The requested blog category could not be found."
          noindex={true}
          nofollow={true}
          url="/blog/category/not-found"
        />
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate(`/${language}/blog`)} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('category.backToBlog')}
        </Button>
      </div>
    );
  }

  if (!categoryInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SEO
          title="Category Not Found | ZapAround"
          description="The requested blog category could not be found."
          noindex={true}
          nofollow={true}
          url="/blog/category/not-found"
        />
        <Alert>
          <AlertDescription>{t('category.categoryNotFound')}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate(`/${language}/blog`)} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('category.backToBlog')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        url={seoData.url}
        type={seoData.type}
        structuredData={seoData.structuredData}
        breadcrumbs={[
          { name: 'Home', url: `/${language}/` },
          { name: 'Blog', url: `/${language}/blog` },
          { name: categoryInfo.name, url: `/${language}/blog/category/${categorySlug}` }
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/${language}/blog`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('category.backToBlog')}
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <Tag className="h-6 w-6 text-primary" />
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {categoryInfo.name}
            </Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">
            {categoryInfo.name} {t('category.travelArticles')}
          </h1>

          <div className="flex items-center gap-6 text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{categoryInfo.count} {t('category.articles')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{t('category.updatedRegularly')}</span>
            </div>
          </div>

          <p className="text-lg text-muted-foreground max-w-3xl">
            {categoryInfo.description}
          </p>
        </div>



        {/* Blog Posts */}
        {categoryBlogs.blogs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {categoryBlogs.blogs.map((blog) => (
                <BlogCard
                  key={blog.id}
                  blog={blog}
                />
              ))}
            </div>

            {/* Pagination */}
            {categoryBlogs.totalPages > 1 && (
              <BlogPagination
                currentPage={currentPage}
                totalPages={categoryBlogs.totalPages}
                totalPosts={categoryBlogs.count}
                postsPerPage={postsPerPage}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">{t('category.noArticlesFound')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('category.noArticlesInCategory', { category: categoryInfo.name })}
              </p>
              <Button onClick={() => navigate(`/${language}/blog`)}>
                {t('category.browseAllArticles')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Related Categories */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>{t('category.otherCategories')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {['Hidden Gems', 'Travel Tips', 'Destinations', 'Culture', 'Food', 'Adventure'].map((cat) => {
                const catSlug = cat.toLowerCase().replace(/\s+/g, '-');
                return (
                  <Link
                    key={cat}
                    to={`/${language}/blog/category/${catSlug}`}
                    className="inline-block"
                  >
                    <Badge
                      variant={cat === categoryInfo.name ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {cat}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
} 