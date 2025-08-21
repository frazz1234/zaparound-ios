import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Users, 
  MapPin, 
  Heart, 
  Share2, 
  ArrowRight,
  Globe,
  Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CommunityPost {
  id: number;
  content: string;
  location?: string;
  post_type?: 'activity' | 'destination';
  rating?: number;
  created_at: string;
  media_urls?: Array<{
    id: string;
    url: string;
    type: 'image' | 'video';
    thumbnail?: string;
  }>;
  profile?: {
    username?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  likes?: Array<{ count: number }>;
  replies?: Array<{ count: number }>;
}

interface CommunitySneakPeekProps {
  className?: string;
}

export const CommunitySneakPeek: React.FC<CommunitySneakPeekProps> = ({ className }) => {
  const { t, i18n } = useTranslation(['home', 'community']);
  const navigate = useNavigate();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentPosts();
  }, []);

  const fetchRecentPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          id,
          content,
          location,
          post_type,
          rating,
          created_at,
          media_urls,
          likes:post_likes(count),
          replies:post_replies(count),
          profile:profiles!user_id (
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching recent posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return t('community.justNow', 'Just now');
    if (diffInHours < 24) return t('community.hoursAgo', '{{hours}}h ago', { hours: diffInHours });
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return t('community.daysAgo', '{{days}}d ago', { days: diffInDays });
    
    return date.toLocaleDateString(i18n.language, { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getPostTypeIcon = (postType?: string) => {
    switch (postType) {
      case 'activity':
        return '🎯';
      case 'destination':
        return '🌍';
      default:
        return '📍';
    }
  };

  const getPostTypeLabel = (postType?: string) => {
    switch (postType) {
      case 'activity': return t('community.activity', 'Activity');
      case 'destination': return t('community.destination', 'Destination');
      default: return t('community.post', 'Post');
    }
  };

  const getFirstImage = (mediaUrls?: Array<{ id: string; url: string; type: string; thumbnail?: string }>) => {
    if (!mediaUrls || mediaUrls.length === 0) return null;
    const firstImage = mediaUrls.find(media => media.type === 'image');
    return firstImage?.url || firstImage?.thumbnail || null;
  };

  const handleViewCommunity = () => {
    navigate(`/${i18n.language}/community`);
  };

  const handlePostClick = (post: CommunityPost) => {
    // Navigate to the shared post view, similar to how post sharing works
    const locationSlug = post.location ? encodeURIComponent(post.location.toLowerCase().replace(/\s+/g, '-')) : undefined;
    const shareUrl = locationSlug 
      ? `/${i18n.language}/community/share/${post.id}/${locationSlug}`
      : `/${i18n.language}/community/share/${post.id}`;
    navigate(shareUrl);
  };

  if (loading) {
    return (
      <section className={cn("py-20 bg-gradient-to-br from-[#fcfcfc] to-[#f8f9fa] border-t border-[#e5e7eb]", className)}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1d1d1e] mb-4">
              {t('home.communitySneakPeek.title', 'Join Our Travel Community')}
            </h2>
            <p className="text-xl text-[#62626a] max-w-2xl mx-auto">
              {t('home.communitySneakPeek.subtitle', 'Discover amazing places and share your adventures with fellow travelers')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="ml-3">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("py-20 relative overflow-hidden", className)}>
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#fcfcfc] to-[#f8f9fa]" />
      
      {/* Subtle border effect */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#10B981]/20 to-transparent" />
      
      {/* Subtle background effects - matching widget style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/10 to-[#059669]/10 rounded-3xl blur-2xl transform rotate-3 scale-105"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-[#10B981]/8 to-[#059669]/8 rounded-3xl blur-xl transform -rotate-2 scale-105"></div>
      </div>
      
      {/* Main content container */}
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-2xl mb-6 shadow-lg">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1d1d1e] mb-4">
              {t('home.communitySneakPeek.title', 'Join Our Travel Community')}
            </h2>
            <p className="text-xl text-[#62626a] max-w-2xl mx-auto">
              {t('home.communitySneakPeek.subtitle', 'Discover amazing places and share your adventures with fellow travelers')}
            </p>
          </motion.div>
        </div>

        {/* Recent Posts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card 
                className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300 h-full relative overflow-hidden cursor-pointer group hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2" 
                onClick={() => handlePostClick(post)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePostClick(post);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={t('home.communitySneakPeek.clickToViewPost', 'Click to view full post')}
                title={t('home.communitySneakPeek.clickToViewPost', 'Click to view full post')}
              >
                {/* Subtle inner glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#10B981]/3 to-[#059669]/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                
                <CardContent className="p-6 h-full flex flex-col relative z-10">
                  {/* Post Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
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
                      <div className="ml-3">
                        <p className="font-semibold text-[#1d1d1e]">
                          {post.profile?.username || `${post.profile?.first_name || ''} ${post.profile?.last_name || ''}`.trim() || t('home.communitySneakPeek.anonymous', 'Anonymous')}
                        </p>
                        <p className="text-sm text-[#62626a]">
                          {formatDate(post.created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {getPostTypeIcon(post.post_type)} {getPostTypeLabel(post.post_type)}
                    </Badge>
                  </div>

                  {/* Post Content */}
                  <div className="flex-1">
                    <p className="text-[#1d1d1e] leading-relaxed mb-4">
                      {truncateContent(post.content)}
                    </p>
                    
                    {/* Post Image */}
                    {getFirstImage(post.media_urls) && (
                      <div className="mb-4">
                        <img
                          src={getFirstImage(post.media_urls)!}
                          alt={t('community.postImage', 'Post image')}
                          className="w-full h-48 object-cover rounded-lg shadow-sm"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Location */}
                    {post.location && (
                      <div className="flex items-center text-[#62626a] text-sm mb-4">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{post.location}</span>
                      </div>
                    )}

                    {/* Rating */}
                    {post.rating && post.rating > 0 && (
                      <div className="flex items-center mb-4">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-4 h-4",
                                i < post.rating! ? "text-yellow-400 fill-current" : "text-gray-300"
                              )}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-[#62626a]">
                          {post.rating}/5
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Post Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-sm text-[#62626a]">
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-1" />
                        <span>{post.likes?.[0]?.count || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        <span>{post.replies?.[0]?.count || 0}</span>
                      </div>
                    </div>
                    {/* Add a subtle indicator that the post is clickable */}
                    <div className="flex items-center text-[#10B981] opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <span className="text-xs font-medium mr-1">
                        {t('home.communitySneakPeek.viewPost', 'View Post')}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto border border-[#e5e7eb] relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#10B981]/5 to-[#059669]/5 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-2xl mx-auto mb-6 shadow-lg">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#1d1d1e] mb-4">
                {t('home.communitySneakPeek.ctaTitle', 'Ready to Share Your Story?')}
              </h3>
              <p className="text-[#62626a] mb-6">
                {t('home.communitySneakPeek.ctaSubtitle', 'Join thousands of travelers sharing their experiences, discovering new places, and connecting with like-minded adventurers.')}
              </p>
              <Button
                onClick={handleViewCommunity}
                className="bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  {t('home.communitySneakPeek.ctaButton', 'Explore Community')}
                  <ArrowRight className="w-5 h-5" />
                </span>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
