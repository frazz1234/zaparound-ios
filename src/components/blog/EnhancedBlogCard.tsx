import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Tag, MapPin, User, Share2, TrendingUp, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Blog, getLocalizedContent } from '@/hooks/useBlogs';
import { createSlug } from '@/utils/blogUtils';
import { OptimizedImage } from '@/components/OptimizedImage';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BlogCardProps {
  blog: Blog;
  variant?: 'default' | 'featured' | 'compact' | 'minimal';
  showDescription?: boolean;
  showAuthor?: boolean;
  index?: number;
  className?: string;
}

export function BlogCard({ 
  blog, 
  variant = 'default',
  showDescription = true,
  showAuthor = true,
  index = 0,
  className 
}: BlogCardProps) {
  const { t, i18n } = useTranslation('blog');
  const language = i18n.language;
  const localizedContent = getLocalizedContent(blog, language);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Format date for better display
  const formattedDate = useMemo(() => {
    const date = blog.published_at ? new Date(blog.published_at) : new Date(blog.created_at);
    return format(date, 'PPP');
  }, [blog.published_at, blog.created_at]);

  // Create URL-friendly slug from English title
  const blogSlug = useMemo(() => {
    return blog.title_en ? createSlug(blog.title_en) : blog.id;
  }, [blog.title_en, blog.id]);

  const blogPath = `/${language}/blog/${blogSlug}`;
  
  // Calculate estimated reading time
  const readingTime = useMemo(() => {
    const wordsPerMinute = 200;
    const content = typeof localizedContent.content === 'string' ? localizedContent.content : '';
    const wordCount = content.trim() ? content.split(/\s+/).filter(word => word.length > 0).length : 0;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }, [localizedContent.content]);

  // Ensure title is always a string
  const safeTitle = typeof localizedContent.title === 'string' ? localizedContent.title : '';
  const safeExcerpt = typeof localizedContent.excerpt === 'string' ? localizedContent.excerpt : '';

  // Ensure image_url is absolute
  const absoluteImageUrl = blog.image_url
    ? (blog.image_url.startsWith('http') ? blog.image_url : `https://zaparound.com/${blog.image_url}`)
    : null;

  // Share functionality
  const currentUrl = 'https://zaparound.com/' + blogPath;
  
  const handleShare = async () => {
    // Check if we're on macOS or if navigator.share is available
    const isMacOS = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const hasNativeShare = navigator.share && !isMacOS;
    const shareUrl = 'https://zaparound.com/' + blogPath;
    if (hasNativeShare) {
      try {
        const shareText = t('share.mobileText', { 
          title: safeTitle,
          site: 'ZapAround'
        });
        const shareData: any = {
          title: safeTitle,
          text: shareText,
          url: shareUrl,
        };
        // Only add files if we can fetch and convert the image to a File object
        if (absoluteImageUrl) {
          try {
            const response = await fetch(absoluteImageUrl);
            const blob = await response.blob();
            // Try to get the file extension from the URL
            const extMatch = absoluteImageUrl.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
            const ext = extMatch ? extMatch[1] : 'jpg';
            const file = new File([blob], `image.${ext}`, { type: blob.type });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
          } catch (err) {
            // If image fetch fails, just share without files
            console.warn('Could not fetch image for sharing:', err);
          }
        }
        await navigator.share(shareData);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      setShowShareDialog(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = 'https://zaparound.com/' + blogPath;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: t('share.linkCopied'),
        description: t('share.linkCopiedDescription'),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: t('share.copyError'),
        description: t('share.copyErrorDescription'),
        variant: 'destructive',
      });
    }
  };

  const handleSocialShare = (platform: string) => {
    const shareText = t('share.mobileText', { 
      title: safeTitle,
      site: 'ZapAround'
    });
    
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(currentUrl);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodeURIComponent(safeTitle)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(safeTitle)}&body=${encodedText}%0A%0A${encodedUrl}`;
        break;
      default:
        return;
    }
    
    // Open in new window
    window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
  };

  // Animation variants for staggered appearance
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  if (variant === 'featured') {
    return (
      <motion.div
        custom={index}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className={cn("group", className)}
      >
        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50">
          <div className="relative">
            {blog.image_url && (
              <div className="aspect-[16/9] lg:aspect-[21/9] overflow-hidden">
                <OptimizedImage
                  src={blog.image_url}
                  alt={safeTitle}
                  width={800}
                  height={400}
                  quality={90}
                  priority={true}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
            )}
            
            {/* Featured Badge removed for featured variant */}



            {/* Overlay Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              {blog.category && (
                <Link
                  to={`/${language}/blog/category/${blog.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Badge variant="outline" className="mb-3 border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer">
                    <Tag className="w-3 h-3 mr-1" />
                    {blog.category}
                  </Badge>
                </Link>
              )}
              
              <h2 className="text-2xl lg:text-3xl font-bold mb-2 line-clamp-2 leading-tight">
                {safeTitle}
              </h2>
              
              {/* Description removed for featured variant */}

              <div className="flex items-center gap-4 text-sm text-white/80">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formattedDate}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {t('detail.readingTime', { time: readingTime })}
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-3">
              <Link to={blogPath} className="w-full max-w-xs">
                <Button className="w-full" size="lg">
                  {t('actions.readMore')}
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleShare}
                aria-label={t('share.title')}
                className="border-white/30 text-white hover:bg-white/20"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Share Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">{t('share.title')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Blog Preview */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                {absoluteImageUrl && (
                  <div className="aspect-video overflow-hidden rounded-md mb-3">
                    <img
                      src={absoluteImageUrl}
                      alt={safeTitle}
                      width={400}
                      height={225}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </div>
                )}
                <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                  {safeTitle}
                </h3>
                {safeExcerpt && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {safeExcerpt}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>ZapAround</span>
                  <span>•</span>
                  <span>{formattedDate}</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  {t('share.description')}
                </p>
                <div className="bg-gray-50 rounded-lg p-3 border">
                  <p className="text-xs text-gray-600 break-all font-mono">
                    {'https://zaparound.com/' + blogPath}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-sm font-medium mb-3">{t('share.shareVia')}</p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSocialShare('facebook')}
                      className="flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSocialShare('twitter')}
                      className="flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                      Twitter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSocialShare('whatsapp')}
                      className="flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSocialShare('telegram')}
                      className="flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                      Telegram
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSocialShare('email')}
                      className="flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </Button>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">{t('share.orCopyLink')}</p>
                  <Button 
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 mx-auto"
                    disabled={copied}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        {t('share.copied')}
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        {t('share.copyLink')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        custom={index}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className={cn("group", className)}
      >
        <Link to={blogPath}>
          <Card className="overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-200 h-full">
            <div className="flex gap-4 p-4">
              {blog.image_url && (
                <div className="aspect-square w-20 flex-shrink-0 overflow-hidden rounded-md">
                  <OptimizedImage
                    src={blog.image_url}
                    alt={safeTitle}
                    width={80}
                    height={80}
                    quality={75}
                    priority={true}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                  {safeTitle}
                </h3>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Calendar className="w-3 h-3" />
                  {formattedDate}
                  <Clock className="w-3 h-3" />
                  {t('detail.readingTime', { time: readingTime })}
                </div>

                {blog.category && (
                  <Link
                    to={`/${language}/blog/category/${blog.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Badge variant="outline" className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                      {blog.category}
                    </Badge>
                  </Link>
                )}
              </div>
            </div>
          </Card>
        </Link>
      </motion.div>
    );
  }

  if (variant === 'minimal') {
    return (
      <motion.div
        custom={index}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className={cn("group", className)}
      >
        <Link to={blogPath} className="block">
          <div className="py-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200 rounded-lg px-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                  {safeTitle}
                </h3>
                
                {showDescription && safeExcerpt && (
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                    {safeExcerpt}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formattedDate}</span>
                  <span>•</span>
                  <span>{t('detail.readingTime', { time: readingTime })}</span>
                  {blog.category && (
                    <>
                      <span>•</span>
                      <Link
                        to={`/${language}/blog/category/${blog.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                        className="hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {blog.category}
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {blog.image_url && (
                <div className="aspect-square w-16 flex-shrink-0 overflow-hidden rounded">
                  <OptimizedImage
                    src={blog.image_url}
                    alt={safeTitle}
                    width={64}
                    height={64}
                    quality={75}
                    priority={true}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className={cn("group", className)}
    >
      <Card className="overflow-hidden transition-all hover:shadow-lg h-full flex flex-col border border-gray-200">
        {blog.image_url && (
          <div className="aspect-video overflow-hidden relative">
            <OptimizedImage
              src={blog.image_url}
              alt={safeTitle}
              width={400}
              height={225}
              quality={85}
              priority={true}
              className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
            />
            

          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            {blog.category && (
              <Link
                to={`/${language}/blog/category/${blog.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Badge variant="outline" className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                  <Tag className="w-3 h-3 mr-1" />
                  {blog.category}
                </Badge>
              </Link>
            )}
            
            {blog.location && (
              <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200">
                <MapPin className="w-3 h-3 mr-1" />
                {blog.location}
              </Badge>
            )}
          </div>

          <h3 className="text-lg font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {safeTitle}
          </h3>
        </CardHeader>

        <CardContent className="flex-1 pt-0">
          {showDescription && safeExcerpt && (
            <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
              {safeExcerpt}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
                                {t('detail.readingTime', { time: readingTime })}
            </div>
          </div>


        </CardContent>

        <CardFooter className="pt-0">
          <div className="flex items-center justify-between w-full">
            <Link to={blogPath} className="flex-1">
              <Button variant="outline" className="w-full">
                {t('actions.readMore')}
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2"
              onClick={handleShare}
              aria-label={t('share.title')}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">{t('share.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Blog Preview */}
            <div className="bg-gray-50 rounded-lg p-4 border">
              {absoluteImageUrl && (
                <div className="aspect-video overflow-hidden rounded-md mb-3">
                  <img
                    src={absoluteImageUrl}
                    alt={safeTitle}
                    width={400}
                    height={225}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>
              )}
              <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                {safeTitle}
              </h3>
              {safeExcerpt && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {safeExcerpt}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>ZapAround</span>
                <span>•</span>
                <span>{formattedDate}</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {t('share.description')}
              </p>
              <div className="bg-gray-50 rounded-lg p-3 border">
                <p className="text-xs text-gray-600 break-all font-mono">
                  {'https://zaparound.com/' + blogPath}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-sm font-medium mb-3">{t('share.shareVia')}</p>
                <div className="flex justify-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSocialShare('facebook')}
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSocialShare('twitter')}
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSocialShare('whatsapp')}
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSocialShare('telegram')}
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    Telegram
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSocialShare('email')}
                    className="flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </Button>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">{t('share.orCopyLink')}</p>
                <Button 
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 mx-auto"
                  disabled={copied}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      {t('share.copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      {t('share.copyLink')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// Loading skeleton for blog cards
export function BlogCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'featured' | 'compact' | 'minimal' }) {
  if (variant === 'featured') {
    return (
      <Card className="overflow-hidden">
        <Skeleton className="aspect-[21/9] w-full" />
        <CardContent className="p-6">
          <Skeleton className="h-4 w-20 mb-3" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-6 w-3/4 mb-4" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className="overflow-hidden">
        <div className="flex gap-4 p-4">
          <Skeleton className="aspect-square w-20 flex-shrink-0 rounded-md" />
          <div className="flex-1">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="py-4 border-b border-gray-100">
        <div className="flex justify-between gap-4">
          <div className="flex-1">
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="aspect-square w-16 flex-shrink-0 rounded" />
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <Skeleton className="aspect-video w-full" />
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-6 w-full mb-1" />
        <Skeleton className="h-5 w-3/4" />
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="flex gap-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}
