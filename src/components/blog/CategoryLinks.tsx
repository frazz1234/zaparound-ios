import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  name: string;
  count: number;
  slug: string;
}

export function CategoryLinks() {
  const { t, i18n } = useTranslation('blog');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const language = i18n.language;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        
        // Get all published blogs with categories
        const { data: blogs, error } = await supabase
          .from('blogs')
          .select('category')
          .eq('is_published', true)
          .not('category', 'is', null);

        if (error) {
          console.error('Error fetching categories:', error);
          return;
        }

        // Count blogs per category
        const categoryCounts = blogs.reduce((acc, blog) => {
          if (blog.category) {
            acc[blog.category] = (acc[blog.category] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        // Convert to array and sort by count
        const categoryArray = Object.entries(categoryCounts)
          .map(([name, count]) => ({
            name,
            count: count as number,
            slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 12); // Show top 12 categories

        setCategories(categoryArray);
      } catch (err) {
        console.error('Error in fetchCategories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            {t('widgets.categories')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="h-8 w-20 bg-muted animate-pulse rounded"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5" />
          {t('widgets.categories')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.name}
              to={`/${language}/blog/category/${category.slug}`}
              className="inline-block"
            >
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors group"
              >
                <span className="flex items-center gap-1">
                  {category.name}
                  <span className="text-xs opacity-70 group-hover:opacity-100">
                    ({category.count})
                  </span>
                </span>
              </Badge>
            </Link>
          ))}
        </div>
        
        {/* Show trending indicator for categories with many posts */}
        {categories.some(cat => cat.count > 5) && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>{t('card.trending')} {t('widgets.categories')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 