import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Share } from '@capacitor/share';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Heart, Share2, ArrowLeft, MapPin, Calendar, Reply, Loader2 } from 'lucide-react';
import { MediaDisplay } from '@/components/community/MediaDisplay';
import { LocationDisplay } from '@/components/community/LocationDisplay';
import { MediaUpload } from '@/components/community/MediaUpload';
import { StarRating } from '@/components/ui/star-rating';
import { cn } from "@/lib/utils";
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

  const CommunityShare = () => {
    const { postId, locationSlug } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { t } = useTranslation('community');
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [userLikes, setUserLikes] = useState({});
    const [replies, setReplies] = useState([]);
    const [replyContent, setReplyContent] = useState('');
    const [replyMedia, setReplyMedia] = useState([]);
    const [replyRating, setReplyRating] = useState(0);
    const [isUploadingReply, setIsUploadingReply] = useState(false);
    const [showReplies, setShowReplies] = useState(false);

    // Generate meta tags for sharing and SEO
    const generateMetaTags = () => {
      if (!post) return null;
      
      // Create location-focused title for better SEO
      const locationTitle = post.location 
        ? `${post.location} - Community Post on ZapAround`
        : 'Community Post on ZapAround';
      
      // Create rich description with location focus
      let description = '';
      if (post.location) {
        description = `Discover ${post.location} through our community. `;
      }
      description += (post.content || '').substring(0, 150) + ((post.content || '').length > 150 ? '...' : '');
      
      const imageUrl = post.media_urls?.[0]?.url || post.image_url || '/apple-touch-icon.png';
      const currentLang = window.location.pathname.split('/')[1] || 'en';
      const canonicalUrl = locationSlug 
        ? `https://zaparound.com/${currentLang}/community/share/${post.id}/${locationSlug}`
        : `https://zaparound.com/${currentLang}/community/share/${post.id}`;
      
      // Generate structured data for better SEO
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": locationTitle,
        "description": description,
        "image": imageUrl,
        "author": {
          "@type": "Person",
          "name": `${post.profile?.first_name || ''} ${post.profile?.last_name || ''}`.trim() || post.profile?.username || "ZapAround User"
        },
        "publisher": {
          "@type": "Organization",
          "name": "ZapAround",
          "url": "https://zaparound.com"
        },
        "datePublished": post.created_at,
        "dateModified": post.updated_at || post.created_at,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": canonicalUrl
        }
      };
      
      // Add location data if available
      if (post.location) {
        structuredData["contentLocation"] = {
          "@type": "Place",
          "name": post.location
        };
      }
      
      const altLangs = ['en', 'fr', 'es'].filter(l => l !== currentLang);
      return {
        title: locationTitle,
        description,
        image: imageUrl,
        canonicalUrl,
        structuredData,
        alternates: altLangs.map(l => ({ lang: l, url: canonicalUrl.replace(`/${currentLang}/`, `/${l}/`) }))
      };
    };

  useEffect(() => {
    fetchPost();
    fetchCurrentUser();
    fetchReplies();
  }, [postId]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchPost = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          likes:post_likes(count),
          replies:post_replies(count),
          profile:profiles!user_id (
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;

      setPost(data);
      
      // Fetch user likes if user is logged in
      if (currentUser) {
        fetchUserLikes();
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLikes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      const likesMap = {};
      data.forEach(like => {
        likesMap[like.post_id] = true;
      });
      setUserLikes(likesMap);
    } catch (error) {
      console.error('Error fetching user likes:', error);
    }
  };

  const handleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to like posts.',
          variant: 'destructive',
        });
        return;
      }

      if (userLikes[postId]) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;

        setUserLikes(prev => ({ ...prev, [postId]: false }));
        setPost(prev => ({
          ...prev,
          likes: [{ count: (prev.likes?.[0]?.count || 1) - 1 }]
        }));
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: user.id }]);

        if (error) throw error;

        setUserLikes(prev => ({ ...prev, [postId]: true }));
        setPost(prev => ({
          ...prev,
          likes: [{ count: (prev.likes?.[0]?.count || 0) + 1 }]
        }));
      }
    } catch (error) {
      console.error('Error handling like:', error);
      toast({
        title: 'Error',
        description: 'Failed to update like. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReplyMediaChange = (media) => {
    setReplyMedia(media);
  };

  const uploadReplyMedia = async (mediaFiles) => {
    if (!mediaFiles || mediaFiles.length === 0) return [];

    const uploadedMedia = [];
    
    for (const mediaFile of mediaFiles) {
      try {
        const fileExt = mediaFile.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `community-replies/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('community-media')
          .upload(filePath, mediaFile.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('community-media')
          .getPublicUrl(filePath);

        uploadedMedia.push({
          id: mediaFile.id,
          url: publicUrl,
          type: mediaFile.type,
          thumbnail: mediaFile.type === 'video' ? mediaFile.preview : undefined
        });
      } catch (error) {
        console.error('Error uploading reply media:', error);
        toast({
          title: 'Error',
          description: 'Failed to upload media. Please try again.',
          variant: 'destructive',
        });
      }
    }

    return uploadedMedia;
  };

  const handleReply = async () => {
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'You must be logged in to reply.',
        variant: 'destructive',
      });
      return;
    }

    if (!replyContent.trim() && replyMedia.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add some content or media to your reply.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploadingReply(true);

      // Upload media if any
      const uploadedMedia = await uploadReplyMedia(replyMedia);

      // Insert reply
      const { data: reply, error } = await supabase
        .from('post_replies')
        .insert([{
          post_id: postId,
          user_id: currentUser.id,
          content: replyContent.trim(),
          media_urls: uploadedMedia,
          rating: replyRating > 0 ? replyRating : null,
          created_at: new Date().toISOString()
        }])
        .select(`
          *,
          profile:profiles!user_id (
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Add reply to state
      setReplies(prev => [reply, ...prev]);
      
      // Update post reply count
      setPost(prev => ({
        ...prev,
        replies: [{ count: (prev.replies?.[0]?.count || 0) + 1 }]
      }));

      // Reset form
      setReplyContent('');
      setReplyMedia([]);
      setReplyRating(0);

      toast({
        title: 'Success',
        description: 'Reply posted successfully!',
      });

      // Show replies if not already shown
      if (!showReplies) {
        setShowReplies(true);
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to post reply. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingReply(false);
    }
  };

  const fetchReplies = async () => {
    try {
      const { data, error } = await supabase
        .from('post_replies')
        .select(`
          *,
          profile:profiles!user_id (
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReplies(data || []);
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handleShareWithDevice = async () => {
    // Get language from URL parameters or fallback to navigator language
    const currentLang = window.location.pathname.split('/')[1] || (navigator.language || 'en').slice(0,2);
    const shareUrl = locationSlug 
      ? `https://zaparound.com/${currentLang}/community/share/${post.id}/${locationSlug}`
      : `https://zaparound.com/${currentLang}/community/share/${post.id}`;
    const title = 'ZapAround';
    const sharePrefix = t('share.checkFound', 'Check what I found on ZapAround');
    const contentSnippet = (post.content || '').trim();
    const limitedContent = contentSnippet.length > 220 ? contentSnippet.substring(0, 220) + '...' : contentSnippet;
    const quotedContentLine = limitedContent ? `\n'${contentSnippet}'` : '';
    const placeLine = post.location ? `\n${post.location}` : '';
    const textPayload = `${sharePrefix}${quotedContentLine}${placeLine}\n${shareUrl}`;

    try {
      await Share.share({
        title,
        text: textPayload,
        url: shareUrl,
      });
    } catch (error) {
      console.error('Error sharing with device:', error);
      toast({
        title: 'Error',
        description: 'Failed to share with device. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-6">The post you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => {
            // Navigate back to community with proper language prefix
            const currentLang = window.location.pathname.split('/')[1] || 'en';
            navigate(`/${currentLang}/community`);
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Button>
        </div>
      </div>
    );
  }

  // Generate meta description
  const metaDescription = post.location 
    ? `Check out this amazing post about ${post.location} on ZapAround! ${post.content.substring(0, 150)}...`
    : post.content.substring(0, 160) + (post.content.length > 160 ? '...' : '');

  // Get first image for meta tags
  const firstImage = post.media_urls && post.media_urls.length > 0 
    ? post.media_urls.find(media => media.type === 'image')?.url 
    : post.image_url;

  return (
    <>
      <Helmet>
        {(() => {
          const metaTags = generateMetaTags();
          if (!metaTags) return null;
          
          return (
            <>
              <title>{metaTags.title}</title>
              <meta name="description" content={metaTags.description} />
              
              {/* Open Graph Meta Tags */}
              <meta property="og:title" content={metaTags.title} />
              <meta property="og:description" content={metaTags.description} />
              <meta property="og:type" content="article" />
              <meta property="og:url" content={metaTags.canonicalUrl} />
              <meta property="og:image" content={metaTags.image} />
              <meta property="og:site_name" content="ZapAround" />
              <meta property="og:locale" content={window.location.pathname.split('/')[1] || 'en'} />
              
              {/* Twitter Card Meta Tags */}
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:title" content={metaTags.title} />
              <meta name="twitter:description" content={metaTags.description} />
              <meta name="twitter:image" content={metaTags.image} />
              <meta name="twitter:site" content="@zaparounds" />
              
              {/* SEO Meta Tags */}
              <link rel="canonical" href={metaTags.canonicalUrl} />
              <meta name="robots" content="index, follow" />
              <meta name="googlebot" content="index, follow" />

              {/* hreflang alternates */}
              {metaTags.alternates?.map((alt) => (
                <link key={alt.lang} rel="alternate" hrefLang={alt.lang} href={alt.url} />
              ))}
              {/* x-default points to English */}
              <link
                rel="alternate"
                hrefLang="x-default"
                href={metaTags.canonicalUrl.replace(/\/[a-z]{2}\//, '/en/')}
              />
              
              {/* Location-specific meta tags for better SEO */}
              {post.location && (
                <>
                  <meta name="geo.placename" content={post.location} />
                  <meta name="geo.region" content={post.location} />
                  <meta name="keywords" content={`${post.location}, community, travel, ZapAround, ${post.content?.substring(0, 100) || ''}`} />
                </>
              )}
              
              {/* Structured Data JSON-LD */}
              <script type="application/ld+json">
                {JSON.stringify(metaTags.structuredData)}
              </script>
            </>
          );
        })()}
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => {
                // Navigate back to community with proper language prefix
                const currentLang = window.location.pathname.split('/')[1] || 'en';
                navigate(`/${currentLang}/community`);
              }}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('navigation.title')}
            </Button>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
                    {post.profile?.avatar_url ? (
                      <img
                        src={supabase.storage.from('avatars').getPublicUrl(post.profile.avatar_url).data.publicUrl}
                                                            alt={post.profile.username || `${post.profile.first_name || ''} ${post.profile.last_name || ''}`.trim() || 'User'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement.classList.remove('overflow-hidden');
                        }}
                      />
                    ) : (
                      <Users className="h-6 w-6 text-blue-500" />
                    )}
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold text-gray-800">
                                                      {post.profile?.username || `${post.profile?.first_name || ''} ${post.profile?.last_name || ''}`.trim() || t('user.anonymous')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleString()}
                    </p>
                    {post.rating && (
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating
                          rating={post.rating}
                          size="sm"
                          readonly
                        />
                                                                <span className="text-xs text-gray-500">
                                          {post.rating} {post.rating !== 1 ? t('rating.stars') : t('rating.star')}
                                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                    title="Share post"
                    onClick={handleShareWithDevice}
                  >
                    <Share2 className="h-4 w-4 text-blue-500" />
                  </Button>
                </div>
              </div>

              {/* Location */}
              {post.location && (
                <div className="mb-4">
                  <LocationDisplay
                    location={post.location}
                    placeId={post.place_id}
                    placeLat={post.place_lat}
                    placeLng={post.place_lng}
                    placeTypes={post.place_types}
                    placeRating={post.place_rating}
                    placeUserRatingsTotal={post.place_user_ratings_total}
                  />
                </div>
              )}

              {/* Content */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-gray-700 leading-relaxed text-lg">{post.content}</p>
                {(post.media_urls && post.media_urls.length > 0) || post.image_url ? (
                  <div className="mt-4">
                    <MediaDisplay
                      media={post.media_urls && post.media_urls.length > 0 ? post.media_urls : post.image_url}
                      maxPreview={10}
                    />
                  </div>
                ) : null}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "flex items-center rounded-full px-4",
                      userLikes[postId] ? 'text-red-500 hover:bg-red-50' : 'hover:bg-gray-100'
                    )}
                    onClick={handleLike}
                  >
                    <Heart className={cn("h-4 w-4 mr-2", userLikes[postId] ? 'fill-current' : '')} />
                    {post.likes?.[0]?.count || 0} Likes
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center rounded-full px-4 hover:bg-gray-100"
                    onClick={() => setShowReplies(!showReplies)}
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    {post.replies?.[0]?.count || 0} {t('replies.title')}
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/community')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('navigation.title')}
                </Button>
              </div>

              {/* Reply Section */}
              {currentUser && (
                <div className="mt-6 pt-4 border-t">
                  <div className="space-y-4">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={t('replies.placeholder')}
                      className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={3}
                    />
                    
                    {/* Reply Star Rating */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">{t('rating.ratePost')}</span>
                      <StarRating
                        rating={replyRating}
                        onRatingChange={setReplyRating}
                        size="sm"
                      />
                      {replyRating > 0 && (
                        <span className="text-sm text-gray-500">
                          {replyRating} {replyRating !== 1 ? t('rating.stars') : t('rating.star')}
                        </span>
                      )}
                    </div>
                    
                    {/* Reply Media Upload */}
                    <MediaUpload
                      onMediaChange={handleReplyMediaChange}
                      maxFiles={5}
                      disabled={isUploadingReply}
                    />
                    
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleReply}
                        disabled={isUploadingReply || (!replyContent.trim() && replyMedia.length === 0)}
                        className={cn(
                          "relative px-6 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-none hover:from-[#059669] hover:to-[#047857] hover:scale-105 transition-all duration-300 shadow-lg rounded-full font-medium tracking-wide flex items-center gap-2",
                          (!replyContent.trim() && replyMedia.length === 0) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {isUploadingReply ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('replies.posting')}
                          </>
                        ) : (
                          t('replies.replyButton')
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Replies Display */}
              {showReplies && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('replies.title')}</h3>
                  <div className="space-y-4">
                    {replies.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">{t('replies.noReplies')}</p>
                    ) : (
                      replies.map((reply) => (
                        <div key={reply.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
                              {reply.profile?.avatar_url ? (
                                <img
                                  src={supabase.storage.from('avatars').getPublicUrl(reply.profile.avatar_url).data.publicUrl}
                                                                          alt={reply.profile.username || `${reply.profile.first_name || ''} ${reply.profile.last_name || ''}`.trim() || 'User'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement.classList.remove('overflow-hidden');
                                  }}
                                />
                              ) : (
                                <Users className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-gray-800 text-sm">
                                                                          {reply.profile?.username || `${reply.profile?.first_name || ''} ${reply.profile?.last_name || ''}`.trim() || t('user.anonymous')}
                                </p>
                                <span className="text-xs text-gray-500">
                                  {new Date(reply.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm mb-2">{reply.content}</p>
                              {reply.rating && (
                                <div className="flex items-center gap-2 mb-2">
                                  <StarRating
                                    rating={reply.rating}
                                    size="sm"
                                    readonly
                                  />
                                  <span className="text-xs text-gray-500">
                                    {reply.rating} {reply.rating !== 1 ? t('rating.stars') : t('rating.star')}
                                  </span>
                                </div>
                              )}
                              {(reply.media_urls && reply.media_urls.length > 0) || reply.image_url ? (
                                <div className="mt-2">
                                  <MediaDisplay
                                    media={reply.media_urls && reply.media_urls.length > 0 ? reply.media_urls : reply.image_url}
                                    maxPreview={3}
                                  />
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Call to Action */}
          <div className="relative">
            {/* Shadow Square Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#61936f]/20 to-[#4a7c59]/20 rounded-3xl blur-2xl transform rotate-3 scale-105"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-[#10B981]/15 to-[#059669]/15 rounded-3xl blur-xl transform -rotate-2 scale-105"></div>
            
            {/* Main Container */}
            <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 transform hover:scale-[1.02] transition-all duration-500 hover:shadow-3xl">
              {/* Inner Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#61936f]/5 to-[#10B981]/5 rounded-3xl"></div>
              
              {/* Content */}
              <div className="relative z-10 text-center">
                <h2 className="text-3xl font-bold mb-4 tracking-tight text-[#1d1d1e]">
                  {post.location ? t('communityShare.readyToExplore', { location: post.location }) : t('communityShare.readyToJoin')}
                </h2>
                <p className="text-lg mb-8 text-[#62626a] max-w-2xl mx-auto">
                  {post.location 
                    ? t('communityShare.discoverMore')
                    : t('communityShare.shareStories')
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    size="lg"
                    className="relative px-8 py-3 bg-gradient-to-r from-[#61936f] to-[#4a7c59] hover:from-[#4a7c59] hover:to-[#3d6b4a] text-white hover:scale-105 transition-all duration-300 shadow-lg rounded-full font-semibold tracking-wide min-w-[180px] border-0"
                    onClick={() => navigate('/community')}
                  >
                    {t('communityShare.exploreCommunity')}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="relative px-8 py-3 border-2 border-[#61936f] text-[#61936f] hover:bg-[#61936f] hover:text-white hover:scale-105 transition-all duration-300 rounded-full font-semibold tracking-wide min-w-[180px]"
                    onClick={() => navigate('/')}
                  >
                    {t('communityShare.startPlanning')}
                  </Button>
                </div>
              </div>
              
              {/* Decorative Corner Elements */}
              <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#61936f]/30 rounded-tl-2xl"></div>
              <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#61936f]/30 rounded-tr-2xl"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#61936f]/30 rounded-bl-2xl"></div>
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#61936f]/30 rounded-br-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommunityShare; 