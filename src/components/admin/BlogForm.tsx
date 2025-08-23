import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Image as ImageIcon, AlertCircle, Wand2, Languages } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  title_en: z.string().min(1, 'Title is required'),
  content_en: z.string().min(1, 'Content is required'),
  title_fr: z.string().optional(),
  content_fr: z.string().optional(),
  title_es: z.string().optional(),
  content_es: z.string().optional(),
  excerpt_en: z.string().optional(),
  excerpt_fr: z.string().optional(),
  excerpt_es: z.string().optional(),
  image_url: z.string().url('Must be a valid URL').optional(),
  category: z.string().optional(),
  is_featured: z.boolean().optional(),
  is_published: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export function BlogForm() {
  const { t } = useTranslation('admin');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useAIProcessing, setUseAIProcessing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title_en: '',
      content_en: '',
      title_fr: '',
      content_fr: '',
      title_es: '',
      content_es: '',
      excerpt_en: '',
      excerpt_fr: '',
      excerpt_es: '',
      image_url: '',
      category: '',
      is_featured: false,
      is_published: true,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Get user session
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        throw new Error('You must be logged in to create a blog post');
      }

      // Check if user has admin privileges
      const { data: userRole, error: userRoleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (userRoleError) {
        console.error('Error fetching user role:', userRoleError);
        throw new Error('Could not verify admin permissions. Please try again.');
      }
      
      // Only allow admin users to create blogs
      if (!userRole?.role || userRole.role !== 'admin') {
        throw new Error('You need admin permissions to create blog posts');
      }

      // Prepare blog data
      const blogData = {
        title_en: values.title_en,
        content_en: useAIProcessing ? undefined : values.content_en,
        title_fr: useAIProcessing ? undefined : values.title_fr || null,
        content_fr: useAIProcessing ? undefined : values.content_fr || null,
        title_es: useAIProcessing ? undefined : values.title_es || null,
        content_es: useAIProcessing ? undefined : values.content_es || null,
        excerpt_en: values.excerpt_en || null,
        excerpt_fr: useAIProcessing ? undefined : values.excerpt_fr || null,
        excerpt_es: useAIProcessing ? undefined : values.excerpt_es || null,
        image_url: values.image_url || null,
        category: values.category || null,
        author_id: user.id,
        is_featured: values.is_featured || false,
        is_published: values.is_published,
        published_at: values.is_published ? new Date().toISOString() : null,
      };

      // Insert blog post and get the created blog data with its ID
      const { data: createdBlog, error: insertError } = await supabase
        .from('blogs')
        .insert(blogData)
        .select('*')
        .single();

      if (insertError) {
        throw insertError;
      }

      toast({
        title: t('blogPostCreated'),
        description: t('blogPostCreatedDescription'),
      });

      // Navigate to the blog edit page
      navigate(`/admin/blog/${createdBlog.id}`);
    } catch (err) {
      console.error('Error creating blog post:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while creating the blog post');
      toast({
        title: t('error'),
        description: err instanceof Error ? err.message : 'An error occurred while creating the blog post',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('createBlogPost')}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('error')}</AlertTitle>
            <AlertDescription>
              {error}
              <p className="mt-2">{t('tryAgainOrContactAdmin')}</p>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={useAIProcessing}
                  onCheckedChange={setUseAIProcessing}
                  id="ai-processing"
                />
                <label
                  htmlFor="ai-processing"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Use AI Processing
                </label>
              </div>

              {!useAIProcessing && (
                <div className="flex items-center space-x-2">
                  <Languages className="h-4 w-4" />
                  <Select
                    value={selectedLanguage}
                    onValueChange={setSelectedLanguage}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* English Fields - Always visible */}
            <div className={selectedLanguage === 'en' || useAIProcessing ? 'block' : 'hidden'}>
              <FormField
                control={form.control}
                name="title_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title (English)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter title in English" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content (English)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write your blog content in English"
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
                name="excerpt_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excerpt (English)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write a short excerpt in English"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* French Fields */}
            {!useAIProcessing && selectedLanguage === 'fr' && (
              <div>
                <FormField
                  control={form.control}
                  name="title_fr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (French)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter title in French" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content_fr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content (French)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your blog content in French"
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
                  name="excerpt_fr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt (French)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write a short excerpt in French"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Spanish Fields */}
            {!useAIProcessing && selectedLanguage === 'es' && (
              <div>
                <FormField
                  control={form.control}
                  name="title_es"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Spanish)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter title in Spanish" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content_es"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content (Spanish)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your blog content in Spanish"
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
                  name="excerpt_es"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt (Spanish)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write a short excerpt in Spanish"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Common Fields */}
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input placeholder="Enter image URL" {...field} />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {/* Add image upload handler */}}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>
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
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Travel, Food, Technology" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <FormField
                control={form.control}
                name="is_featured"
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
                    <FormLabel className="font-normal">{t('featuredPost')}</FormLabel>
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
                    <FormLabel className="font-normal">{t('publishImmediately')}</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  {useAIProcessing ? t('creatingAndProcessing') : t('creatingBlogPost')}
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                useAIProcessing ? t('createWithAIProcessing') : t('createBlogPost')
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 