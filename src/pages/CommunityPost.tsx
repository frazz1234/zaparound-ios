import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Users, MessageCircle, Heart, Share2, MoreVertical, Trash2, Image as ImageIcon, Loader2, ArrowLeft } from 'lucide-react';
import { MediaUpload } from '@/components/community/MediaUpload';
import { MediaDisplay } from '@/components/community/MediaDisplay';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const POSTS_PER_PAGE = 20;

const CommunityPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userLikes, setUserLikes] = useState({});
  const [replyContent, setReplyContent] = useState('');
  const [replyMedia, setReplyMedia] = useState([]);
  const [isUploadingReply, setIsUploadingReply] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchCurrentUser();
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
      await fetchReplies();
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

  const fetchReplies = async (pageNumber = 1) => {
    try {
      if (pageNumber === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const { data, error, count } = await supabase
        .from('post_replies')
        .select(`
          *,
          profile:profiles!post_replies_user_id_fkey (
            username,
            first_name,
            last_name,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .range((pageNumber - 1) * POSTS_PER_PAGE, pageNumber * POSTS_PER_PAGE - 1);

      if (error) throw error;

      setHasMore(count > pageNumber * POSTS_PER_PAGE);

      if (pageNumber === 1) {
        setReplies(data);
      } else {
        setReplies(prev => [...prev, ...data]);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch replies. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchReplies(nextPage);
  };

  const handleReplyMediaChange = (media) => {
    setReplyMedia(media);
  };

  const uploadReplyMedia = async (mediaFiles) => {
    if (!mediaFiles || mediaFiles.length === 0) return [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      const uploadedMedia = [];

      for (const mediaFile of mediaFiles) {
        const fileExt = mediaFile.file.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('community-images')
          .upload(fileName, mediaFile.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('community-images')
          .getPublicUrl(fileName);

        uploadedMedia.push({
          id: mediaFile.id,
          url: publicUrl,
          type: mediaFile.type,
          thumbnail: mediaFile.type === 'video' ? mediaFile.preview : null
        });
      }

      return uploadedMedia;
    } catch (error) {
      console.error('Error uploading reply media:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload media. Please try again.',
        variant: 'destructive',
      });
      return [];
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) {
      toast({
        title: 'Error',
        description: 'Reply content cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploadingReply(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to reply.',
          variant: 'destructive',
        });
        return;
      }

      let mediaUrls = [];
      if (replyMedia.length > 0) {
        mediaUrls = await uploadReplyMedia(replyMedia);
      }

      const { error } = await supabase
        .from('post_replies')
        .insert([
          {
            post_id: postId,
            user_id: user.id,
            content: replyContent,
            media_urls: mediaUrls
          }
        ]);

      if (error) throw error;

      setReplyContent('');
      setReplyMedia([]);
      
      // Refresh replies
      await fetchReplies();

      toast({
        title: 'Success',
        description: 'Your reply has been posted.',
      });
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

  const handleDeleteReply = async (replyId) => {
    try {
      const { error } = await supabase
        .from('post_replies')
        .delete()
        .eq('id', replyId);

      if (error) throw error;

      // Refresh replies
      await fetchReplies();

      toast({
        title: 'Success',
        description: 'Reply deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete reply. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Post not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/community')}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Community
        </Button>

        {/* Original Post */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
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
                  {post.profile?.username || `${post.profile?.first_name || ''} ${post.profile?.last_name || ''}`.trim() || 'Anonymous User'}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(post.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-gray-700 leading-relaxed">{post.content}</p>
            {(post.media_urls && post.media_urls.length > 0) || post.image_url ? (
              <div className="mt-4">
                <MediaDisplay
                  media={post.media_urls && post.media_urls.length > 0 ? post.media_urls : post.image_url}
                  maxPreview={10}
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* Reply Input */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="space-y-4">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full p-2 border rounded-md"
              rows={3}
            />
            
            {/* Reply Media Upload */}
            <MediaUpload
              onMediaChange={handleReplyMediaChange}
              maxFiles={5}
              disabled={isUploadingReply}
            />
            
            <Button
              size="sm"
              onClick={handleReply}
              disabled={isUploadingReply}
              className={cn(
                "relative px-4 py-1 bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-none hover:from-[#059669] hover:to-[#047857] hover:scale-105 transition-all duration-300 shadow-lg rounded-full font-medium tracking-wide flex items-center gap-2"
              )}
            >
              {isUploadingReply ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Reply'
              )}
            </Button>
          </div>
        </div>

        {/* Replies List */}
        <div className="space-y-4">
          {replies.map((reply) => (
            <div
              key={`reply-${reply.id}`}
              className="bg-white rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
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
                  <div className="ml-2">
                    <p className="font-semibold text-sm">
                      {reply.profile?.username || `${reply.profile?.first_name || ''} ${reply.profile?.last_name || ''}`.trim() || 'Anonymous User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(reply.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {currentUser?.id === reply.user_id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteReply(reply.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <p className="text-gray-700 text-sm">{reply.content}</p>
              {(reply.media_urls && reply.media_urls.length > 0) || reply.image_url ? (
                <div className="mt-2">
                  <MediaDisplay
                    media={reply.media_urls && reply.media_urls.length > 0 ? reply.media_urls : reply.image_url}
                    maxPreview={3}
                  />
                </div>
              ) : null}
            </div>
          ))}

          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Replies'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityPost; 