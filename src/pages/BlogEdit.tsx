import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ChevronLeft, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Blog } from '@/types/blog';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  category: z.string().optional(),
  language: z.enum(['en', 'fr', 'es']),
  is_published: z.boolean().default(true),
  keywords: z.array(z.string()).optional(),
  location: z.string().optional(),
  activities: z.array(z.string()).optional(),
  stock_tickers: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function BlogEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation(['admin', 'common']);
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      image_url: '',
      category: '',
      language: 'en',
      is_published: true,
      keywords: [],
      location: '',
      activities: [],
      stock_tickers: [],
    },
  });

  useEffect(() => {
    if (authLoading) return;

    const fetchBlog = async () => {
      try {
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Blog not found');

        setBlog(data);
        form.reset({
          title: data[`title_${selectedLanguage}`] || '',
          content: data[`content_${selectedLanguage}`] || '',
          excerpt: data[`excerpt_${selectedLanguage}`] || '',
          image_url: data.image_url || '',
          category: data.category || '',
          language: selectedLanguage as 'en' | 'fr' | 'es',
          is_published: data.is_published,
          keywords: data.keywords || [],
          location: data.location || '',
          activities: data.activities || [],
          stock_tickers: data.stock_tickers || [],
        });
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch blog');
        toast({
          title: t('error'),
          description: err instanceof Error ? err.message : 'Failed to fetch blog',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlog();
  }, [id, authLoading, form, selectedLanguage, toast, t]);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const updates = {
        [`title_${values.language}`]: values.title,
        [`content_${values.language}`]: values.content,
        [`excerpt_${values.language}`]: values.excerpt || null,
        image_url: values.image_url || null,
        category: values.category || null,
        is_published: values.is_published,
        published_at: values.is_published ? (blog?.published_at || new Date().toISOString()) : null,
        keywords: values.keywords || [],
        location: values.location || null,
        activities: values.activities || [],
        stock_tickers: values.stock_tickers || [],
      };

      const { error: updateError } = await supabase
        .from('blogs')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      toast({
        title: t('success'),
        description: t('blogUpdated'),
      });

      // Refresh the blog data
      const { data: updatedBlog, error: fetchError } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      setBlog(updatedBlog);
    } catch (err) {
      console.error('Error updating blog:', err);
      setError(err instanceof Error ? err.message : 'Failed to update blog');
      toast({
        title: t('error'),
        description: err instanceof Error ? err.message : 'Failed to update blog',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('blogNotFound')}</h1>
          <Button onClick={() => navigate('/admin')}>
            {t('backToAdmin')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin')}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold">{t('editBlog')}</h1>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={selectedLanguage}
            onValueChange={(value) => {
              setSelectedLanguage(value);
              form.reset({
                title: blog[`title_${value}`] || '',
                content: blog[`content_${value}`] || '',
                excerpt: blog[`excerpt_${value}`] || '',
                image_url: blog.image_url || '',
                category: blog.category || '',
                language: value as 'en' | 'fr' | 'es',
                is_published: blog.is_published,
                keywords: blog.keywords || [],
                location: blog.location || '',
                activities: blog.activities || [],
                stock_tickers: blog.stock_tickers || [],
              });
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('selectLanguage')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="es">Español</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('error')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('blogTitle')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('enterBlogTitle')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('blogContent')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('writeBlogContent')} 
                        className="min-h-[200px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('blogExcerpt')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('writeBlogExcerpt')} 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('blogImage')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('enterImageUrl')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('blogCategory')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('enterBlogCategory')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keywords</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter keywords (comma-separated)" 
                        onChange={(e) => field.onChange(e.target.value.split(',').map(k => k.trim()))}
                        value={field.value?.join(', ') || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activities</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter activities (comma-separated)" 
                        onChange={(e) => field.onChange(e.target.value.split(',').map(a => a.trim()))}
                        value={field.value?.join(', ') || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock_tickers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Tickers</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter stock tickers (comma-separated)" 
                        onChange={(e) => field.onChange(e.target.value.split(',').map(t => t.trim()))}
                        value={field.value?.join(', ') || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_published"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-4 h-4"
                      />
                    </FormControl>
                    <FormLabel className="font-normal">{t('publishBlog')}</FormLabel>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    {t('saving')}
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  </>
                ) : (
                  t('saveChanges')
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 