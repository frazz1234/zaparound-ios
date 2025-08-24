import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Share } from '@capacitor/share';
import { LocationHeader } from '@/components/community/LocationHeader';
import { GooglePlacesSearch } from '@/components/community/GooglePlacesSearch';
import { LocationDisplay } from '@/components/community/LocationDisplay';
import { MediaUpload } from '@/components/community/MediaUpload';
import { MediaDisplay } from '@/components/community/MediaDisplay';
import { PostBlurOverlay } from '@/components/community/PostBlurOverlay';
import { StarRating } from '@/components/ui/star-rating';
import { MessageCircle, Users, MapPin, Compass, Heart, Share2, Map, CalendarClock, MoreVertical, Pencil, Trash2, Image as ImageIcon, Loader2, ChevronDown, Ban, AlertCircle, Shield, UserX, UserCheck, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";
import { createPlaceUrl } from '@/utils/placeUtils';
import { FeedAlgorithm, getFeedPosts, getDestinationPosts, getAroundTheWorldPosts, type FeedPost } from "@/utils/feedAlgorithm";

const LOCALE_MAP = { en: 'en_US', fr: 'fr_FR', es: 'es_ES' };
const POSTS_PER_PAGE = 15;

const Community = () => {
  const { t, i18n } = useTranslation('community');
  const navigate = useNavigate();
  const language = i18n.language;
  const locale = LOCALE_MAP[language] || 'en_US';
  
 
  
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'activities' | 'destinations'
  const [postType, setPostType] = useState('activity'); // 'activity' | 'destination'
  const [postContent, setPostContent] = useState('');
  const [postRating, setPostRating] = useState(0);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [feedAlgorithm, setFeedAlgorithm] = useState<FeedAlgorithm | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editMedia, setEditMedia] = useState([]);
  const [editLocation, setEditLocation] = useState('');
  const [editPlaceDetails, setEditPlaceDetails] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editLocationKey, setEditLocationKey] = useState(0);
  const [editMediaKey, setEditMediaKey] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [location, setLocation] = useState('');
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationKey, setLocationKey] = useState(0); // Key to force re-render of GooglePlacesSearch
  const [mediaKey, setMediaKey] = useState(0); // Key to force re-render of MediaUpload
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalPosts, setTotalPosts] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState(new Set());
  const [showBlockedMessage, setShowBlockedMessage] = useState(false);
  const [blockedUsersList, setBlockedUsersList] = useState([]);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [replyContent, setReplyContent] = useState({});
  const [replyMedia, setReplyMedia] = useState({});
  const [replyRating, setReplyRating] = useState({});
  const [isUploadingReply, setIsUploadingReply] = useState({});
  const [replies, setReplies] = useState({});
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loadingNearbyPlaces, setLoadingNearbyPlaces] = useState(false);
  const [isFeedPickerSticky, setIsFeedPickerSticky] = useState(false);

  const scrollToPostCreator = () => {
    const el = document.querySelector('.post-creator-section') as HTMLElement | null;
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80; // offset for sticky header
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    console.log('Component mounted, fetching posts...');
    fetchPosts();
    fetchUserLikes();
    fetchCurrentUser();
    checkAdminStatus();
    fetchBlockedUsers();
    detectCurrentLocation();
    if (isAdmin) {
      fetchBlockedUsersList();
    }
  }, [isAdmin]);

  // Initialiser l'algorithme de feed quand la localisation est détectée
  useEffect(() => {
    if (currentLocation) {
      const algorithm = new FeedAlgorithm({
        lat: currentLocation.lat,
        lng: currentLocation.lng
      });
      setFeedAlgorithm(algorithm);
    }
  }, [currentLocation]);

  useEffect(() => {
    if (currentLocation) {
      fetchNearbyPlaces();
    }
  }, [currentLocation]);

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  useEffect(() => {
    const handleScroll = () => {
      // Check if we've scrolled past the post creator section
      const postCreatorSection = document.querySelector('.post-creator-section');
      if (postCreatorSection) {
        const rect = postCreatorSection.getBoundingClientRect();
        setIsFeedPickerSticky(rect.bottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loadingMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const loadMoreTrigger = document.getElementById('load-more-trigger');
    if (loadMoreTrigger) {
      observer.observe(loadMoreTrigger);
    }

    return () => {
      if (loadMoreTrigger) {
        observer.unobserve(loadMoreTrigger);
      }
    };
  }, [hasMore, loadingMore]);

  // Monitor dialog state and ensure proper cleanup
  useEffect(() => {
    if (!isEditDialogOpen) {
      // Ensure all edit states are reset when dialog is closed
      setEditingPost(null);
      setEditContent('');
      setEditMedia([]);
      setEditLocation('');
      setEditPlaceDetails(null);
    }
  }, [isEditDialogOpen]);

  const detectCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          console.error('Geolocation error:', err);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  };

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchUserLikes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('post_likes')
        .select('post_id')
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

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userRole, error } = await supabase
        .from('user_roles')
        .select('role, role2')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }

      console.log('User roles:', userRole); // Debug log
      setIsAdmin(userRole?.role === 'admin' || userRole?.role2 === 'moderator');
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('blocked_users')
        .select('blocked_user_id')
        .eq('blocked_by_id', user.id);

      if (data) {
        setBlockedUsers(new Set(data.map(item => item.blocked_user_id)));
      }
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  };

  const fetchBlockedUsersList = async () => {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          *,
          blocked_user:profiles!blocked_user_id (
            username,
            first_name,
            last_name,
            avatar_url
          ),
          blocked_by:profiles!blocked_by_id (
            username,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlockedUsersList(data || []);
    } catch (error) {
      console.error('Error fetching blocked users list:', error);
      toast({
        title: t('errors.general'),
        description: t('errors.fetchBlockedUsers'),
        variant: 'destructive',
      });
    }
  };

  const fetchPosts = async (pageNumber = 1, append = false) => {
    if (pageNumber === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      console.log('Fetching posts with intelligent algorithm...');
      
      let posts: FeedPost[] = [];

      if (feedAlgorithm) {
        // Utiliser l'algorithme intelligent pour le feed
        if (activeTab === 'feed') {
          posts = await feedAlgorithm.getFeedPosts(pageNumber, POSTS_PER_PAGE);
        } else if (activeTab === 'activities') {
          // Pour les activités, filtrer après récupération
          const allPosts = await feedAlgorithm.getFeedPosts(pageNumber, POSTS_PER_PAGE * 2);
          posts = allPosts.filter(post => post.post_type === 'activity').slice(0, POSTS_PER_PAGE);
        } else if (activeTab === 'destinations') {
          // Pour les destinations, utiliser l'algorithme optimisé
          posts = await feedAlgorithm.getDestinationPosts(pageNumber, POSTS_PER_PAGE);
        }
      } else {
        // Fallback vers l'ancien système si pas d'algorithme
        let query = supabase
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
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .range((pageNumber - 1) * POSTS_PER_PAGE, pageNumber * POSTS_PER_PAGE - 1);

        // Filter by active tab
        if (activeTab === 'activities') {
          query = query.eq('post_type', 'activity');
        } else if (activeTab === 'destinations') {
          query = query.eq('post_type', 'destination');
        }

        const { data, error } = await query;
        if (error) throw error;
        posts = data || [];
      }

      // Filter out posts from blocked users
      const filteredPosts = posts.filter(post => !blockedUsers.has(post.user_id));

      console.log('Posts fetched successfully:', filteredPosts);
      
      if (append) {
        setPosts(prevPosts => [...prevPosts, ...filteredPosts]);
      } else {
        setPosts(filteredPosts);
      }

      // Update pagination state
      setHasMore(filteredPosts.length === POSTS_PER_PAGE);
      setPage(pageNumber);

    } catch (error) {
      console.error('Error in fetchPosts:', error);
      toast({
        title: t('errors.general'),
        description: t('errors.fetchPosts'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleMediaChange = (media) => {
    setSelectedMedia(media);
  };

  const uploadMedia = async (mediaFiles) => {
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
                      console.error('Error uploading media:', error);
                toast({
                  title: t('toast.error'),
                  description: t('toast.uploadMediaFailed'),
                  variant: 'destructive',
                });
      return [];
    }
  };

  const handlePost = async () => {
          if (!postContent.trim()) {
        toast({
          title: t('toast.error'),
          description: t('toast.postContentEmpty'),
          variant: 'destructive',
        });
        return;
      }

    try {
              const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: t('toast.error'),
            description: t('toast.loginRequired'),
            variant: 'destructive',
          });
          return;
        }

      // Check if user is blocked
      const { data: blockedData } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocked_user_id', user.id)
        .single();

      if (blockedData) {
        setShowBlockedMessage(true);
        setTimeout(() => setShowBlockedMessage(false), 5000); // Hide after 5 seconds
        return;
      }

      setIsUploading(true);
      let mediaUrls = [];
      if (selectedMedia.length > 0) {
        mediaUrls = await uploadMedia(selectedMedia);
      }

      console.log('Creating new post...');
      const { data, error } = await supabase
        .from('community_posts')
        .insert([
          { 
            user_id: user.id, 
            title: 'New Post', 
            content: postContent,
            media_urls: mediaUrls,
            location: location.trim() || null,
            place_id: selectedPlaceDetails?.place_id || null,
            place_lat: selectedPlaceDetails?.geometry?.location?.lat || null,
            place_lng: selectedPlaceDetails?.geometry?.location?.lng || null,
            place_types: selectedPlaceDetails?.types || null,
            place_rating: selectedPlaceDetails?.rating || null,
            place_user_ratings_total: selectedPlaceDetails?.user_ratings_total || null,
            post_type: postType,
            rating: postRating > 0 ? postRating : null,
            is_published: true 
          }
        ])
        .select();

      if (error) {
        console.error('Error creating post:', error);
        throw error;
      }

              console.log('Post created successfully:', data);
        toast({
          title: t('toast.success'),
          description: t('toast.postPublished'),
        });

      // Reset all form fields after successful post
      setPostContent('');
      setSelectedMedia([]);
      setLocation('');
      setSelectedPlaceDetails(null);
      setPostRating(0);
      setLocationKey(prev => prev + 1); // Force re-render of GooglePlacesSearch
      setMediaKey(prev => prev + 1); // Force re-render of MediaUpload
      fetchPosts();
    } catch (error) {
      console.error('Error in handlePost:', error);
      toast({
        title: t('errors.general'),
        description: t('errors.postFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: t('toast.error'),
          description: t('toast.loginRequiredLike'),
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
        // Update post likes count locally
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { 
                  ...post, 
                  likes: [{ count: (post.likes?.[0]?.count || 1) - 1 }] 
                }
              : post
          )
        );
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: user.id }]);

        if (error) throw error;

        setUserLikes(prev => ({ ...prev, [postId]: true }));
        // Update post likes count locally
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { 
                  ...post, 
                  likes: [{ count: (post.likes?.[0]?.count || 0) + 1 }] 
                }
              : post
          )
        );
      }
    } catch (error) {
              console.error('Error handling like:', error);
        toast({
          title: t('toast.error'),
          description: t('toast.updateLikeFailed'),
          variant: 'destructive',
        });
    }
  };

  const handleEditPost = async () => {
    if (!editingPost || !editContent.trim()) return;

    try {
      // Upload new media if any
      let updatedMediaUrls = editMedia;
      if (editMedia.length > 0 && editMedia.some(media => media.file)) {
        // Filter out existing media (those without file property) and upload new ones
        const existingMedia = editMedia.filter(media => !media.file);
        const newMedia = editMedia.filter(media => media.file);
        
        if (newMedia.length > 0) {
          const uploadedNewMedia = await uploadMedia(newMedia);
          updatedMediaUrls = [...existingMedia, ...uploadedNewMedia];
        }
      }

      const updateData = {
        content: editContent,
        media_urls: updatedMediaUrls,
        location: editLocation.trim() || null,
        place_id: editPlaceDetails?.place_id || null,
        place_lat: editPlaceDetails?.geometry?.location?.lat || null,
        place_lng: editPlaceDetails?.geometry?.location?.lng || null,
        place_types: editPlaceDetails?.types || null,
        place_rating: editPlaceDetails?.rating || null,
        place_user_ratings_total: editPlaceDetails?.user_ratings_total || null,
      };

      const { error } = await supabase
        .from('community_posts')
        .update(updateData)
        .eq('id', editingPost.id);

      if (error) throw error;

      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === editingPost.id
            ? { 
                ...post, 
                content: editContent,
                media_urls: updatedMediaUrls,
                location: editLocation.trim() || null,
                place_id: editPlaceDetails?.place_id || null,
                place_lat: editPlaceDetails?.geometry?.location?.lat || null,
                place_lng: editPlaceDetails?.geometry?.location?.lng || null,
                place_types: editPlaceDetails?.types || null,
                place_rating: editPlaceDetails?.rating || null,
                place_user_ratings_total: editPlaceDetails?.user_ratings_total || null,
              }
            : post
        )
      );

      // Reset all edit states
      setIsEditDialogOpen(false);
      setEditingPost(null);
      setEditContent('');
      setEditMedia([]);
      setEditLocation('');
      setEditPlaceDetails(null);

              toast({
          title: t('toast.success'),
          description: t('toast.postUpdated'),
        });
    } catch (error) {
              console.error('Error updating post:', error);
        toast({
          title: t('toast.error'),
          description: t('toast.updatePostFailed'),
          variant: 'destructive',
        });
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      // First, delete all likes associated with the post
      const { error: likesError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId);

      if (likesError) throw likesError;

      // Then delete all replies associated with the post
      const { error: repliesError } = await supabase
        .from('post_replies')
        .delete()
        .eq('post_id', postId);

      if (repliesError) throw repliesError;

      // Finally, delete the post
      const { error: postError } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (postError) throw postError;

      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));

              toast({
          title: t('toast.success'),
          description: t('toast.postDeleted'),
        });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: t('errors.general'),
        description: t('errors.deletePostFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchPosts(nextPage, true);
  };

  const handleBlockUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocked_user_id: userId,
          blocked_by_id: currentUser.id
        });

      if (error) throw error;

              setBlockedUsers(prev => new Set([...prev, userId]));
        toast({
          title: t('toast.success'),
          description: t('toast.userBlocked'),
        });
    } catch (error) {
              console.error('Error blocking user:', error);
        toast({
          title: t('toast.error'),
          description: t('toast.blockUserFailed'),
          variant: 'destructive',
        });
    }
  };

  const handleUnblockUser = async (blockedUserId) => {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocked_user_id', blockedUserId)
        .eq('blocked_by_id', currentUser.id);

      if (error) throw error;

      setBlockedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(blockedUserId);
        return newSet;
      });

              toast({
          title: t('toast.success'),
          description: t('toast.userUnblocked'),
        });
    } catch (error) {
              console.error('Error unblocking user:', error);
        toast({
          title: t('toast.error'),
          description: t('toast.unblockUserFailed'),
          variant: 'destructive',
        });
    }
  };

  const handleConnectClick = () => {
    navigate(`/${language}/auth?returnTo=/community`);
  };

  const handleSignupClick = () => {
    navigate(`/${language}/auth?tab=signup&returnTo=/community`);
  };

  const fetchNearbyPlaces = async () => {
    if (!currentLocation) {
      setNearbyPlaces([]);
      return;
    }

    try {
      setLoadingNearbyPlaces(true);
      
      // Calculate the bounding box for 50km radius
      const lat = currentLocation.lat;
      const lng = currentLocation.lng;
      const radiusKm = 50;
      
      // Convert km to degrees (approximate)
      const latDelta = radiusKm / 111.32; // 1 degree latitude ≈ 111.32 km
      const lngDelta = radiusKm / (111.32 * Math.cos(lat * Math.PI / 180)); // Adjust for longitude
      
      const { data, error } = await supabase
        .from('pois')
        .select(`
          *,
          poi_category:poi_categories(name, image_url)
        `)
        .gte('lat', lat - latDelta)
        .lte('lat', lat + latDelta)
        .gte('lng', lng - lngDelta)
        .lte('lng', lng + lngDelta)
        .limit(10);

      if (error) throw error;

      // Calculate exact distances and filter within 50km
      const placesWithDistance = data
        .map(place => {
          const distance = calculateDistance(lat, lng, place.lat, place.lng);
          return { ...place, distance };
        })
        .filter(place => place.distance <= 50)
        .sort((a, b) => a.distance - b.distance);

      setNearbyPlaces(placesWithDistance);
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      setNearbyPlaces([]);
    } finally {
      setLoadingNearbyPlaces(false);
    }
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handlePlaceClick = (place) => {
    // Navigate to ZapPlaces page with the place details and SEO-friendly URL
    const placeUrl = createPlaceUrl(place.id, place.name, language);
    navigate(placeUrl, {
      state: {
        placeId: place.id,
        placeDetails: {
          place_id: place.id,
          name: place.name,
          lat: place.lat,
          lng: place.lng,
          types: place.categories || [],
          rating: 0,
          userRatingsTotal: 0
        }
      }
    });
  };

  const fetchReplies = async (postId) => {
    try {
      const { data, error } = await supabase
        .from('post_replies')
        .select(`
          *,
          profile:profiles!post_replies_user_id_fkey (
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;

      setReplies(prev => ({
        ...prev,
        [postId]: data
      }));
    } catch (error) {
      console.error('Error fetching replies:', error);
      toast({
        title: t('errors.general'),
        description: t('errors.fetchReplies'),
        variant: 'destructive',
      });
    }
  };

  const generateShareableUrl = (post) => {
    const baseUrl = 'https://zaparound.com';
    const postId = post.id;
    const locationSlug = post.location ? post.location.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : '';
    const langPrefix = `/${i18n.language || 'en'}`;

    // Generate clean SPA route with just postId and locationSlug
    if (locationSlug) {
      return `${baseUrl}${langPrefix}/community/share/${postId}/${locationSlug}`;
    } else {
      return `${baseUrl}${langPrefix}/community/share/${postId}`;
    }
  };

  const handleShareWithDevice = async (post) => {
    const shareUrl = generateShareableUrl(post);
    const title = 'ZapAround';
    const sharePrefix = t('share.checkFound', 'Check what I found on ZapAround');
    const contentSnippet = (post.content || '').trim();
    const limitedContent = contentSnippet.length > 220 ? contentSnippet.substring(0, 220) + '...' : contentSnippet;
    const quotedContentLine = limitedContent ? `\n'${limitedContent}'` : '';
    const placeLine = post.location ? `\n${post.location}` : '';
    const textPayload = `${sharePrefix}${quotedContentLine}${placeLine}\n${shareUrl}`;

    try {
      await Share.share({
        title,
        text: textPayload,
        url: shareUrl,
      });
      return; // Successfully shared, exit function
    } catch (error) {
      // User cancelled or share failed, continue to fallback
      console.log('Native share failed or was cancelled, using fallback');
    }

    // Fallback to clipboard copy if native sharing is not available or failed
    try {
      await navigator.clipboard.writeText(textPayload);
      toast({
        title: t('toast.linkCopied'),
        description: t('toast.postTextLinkCopied'),
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = textPayload;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: t('toast.linkCopied'),
        description: t('toast.postTextLinkCopied'),
      });
    }
  };

  const navigateToPost = (postId) => {
    window.location.href = `/community/post/${postId}`;
  };

  const handleReplyMediaChange = (media, postId) => {
    setReplyMedia(prev => ({ ...prev, [postId]: media }));
  };

  const uploadReplyMedia = async (mediaFiles, postId) => {
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
        title: t('toast.error'),
        description: t('toast.uploadMediaFailed'),
        variant: 'destructive',
      });
      return [];
    }
  };

  const handleReply = async (postId) => {
    if (!replyContent[postId]?.trim()) {
      toast({
        title: t('toast.error'),
        description: t('toast.replyContentEmpty'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploadingReply(prev => ({ ...prev, [postId]: true }));
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: t('toast.error'),
          description: t('toast.loginRequiredReply'),
          variant: 'destructive',
        });
        return;
      }

      let mediaUrls = [];
      if (replyMedia[postId] && replyMedia[postId].length > 0) {
        mediaUrls = await uploadReplyMedia(replyMedia[postId], postId);
      }

      const { error } = await supabase
        .from('post_replies')
        .insert([
          {
            post_id: postId,
            user_id: user.id,
            content: replyContent[postId],
            media_urls: mediaUrls,
            rating: replyRating[postId] > 0 ? replyRating[postId] : null
          }
        ]);

      if (error) throw error;

      setReplyContent(prev => ({ ...prev, [postId]: '' }));
      setReplyMedia(prev => ({ ...prev, [postId]: [] }));
      setReplyRating(prev => ({ ...prev, [postId]: 0 }));
      
      // Refresh replies
      await fetchReplies(postId);

              toast({
          title: t('toast.success'),
          description: t('toast.replyPosted'),
        });
    } catch (error) {
      console.error('Error posting reply:', error);
      toast({
        title: t('errors.general'),
        description: t('errors.postReplyFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsUploadingReply(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeleteReply = async (replyId, postId) => {
    try {
      const { error } = await supabase
        .from('post_replies')
        .delete()
        .eq('id', replyId);

      if (error) throw error;

      // Refresh replies
      await fetchReplies(postId);

              toast({
          title: t('toast.success'),
          description: t('toast.replyDeleted'),
        });
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast({
        title: t('errors.general'),
        description: t('errors.deleteReplyFailed'),
        variant: 'destructive',
      });
    }
  };

  return (
    <>


      <div className="min-h-screen bg-gray-50">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          {/* Location Header */}
          <div className="mb-8">
            <LocationHeader />
          </div>



          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Social Feed */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <MessageCircle className="h-6 w-6 mr-2 text-blue-500" />
                  {t('travelStories')}
                </h2>
                <div className="space-y-6">
                  {/* Post Input */}
                  <div className="relative border-b pb-6 post-creator-section">
                    {/* Blur overlay for non-connected users */}
                    {!currentUser && (
                      <PostBlurOverlay
                        onConnectClick={handleConnectClick}
                        onSignupClick={handleSignupClick}
                      />
                    )}
                    
                    <AnimatePresence>
                      {showBlockedMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center text-gray-600">
                            <AlertCircle className="h-5 w-5 mr-2 text-gray-400" />
                            <p>
                              You are unable to post at this time due to our community policies. 
                              Please contact our support team for more information.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* Post Type Selector */}
                    <div className="mb-3 flex gap-2">
                      <Button
                        type="button"
                        variant={postType === 'activity' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPostType('activity')}
                        className={cn(
                          "flex items-center gap-2",
                          postType === 'activity' 
                            ? "bg-orange-500 hover:bg-orange-600 text-white" 
                            : "border-orange-200 text-orange-600 hover:bg-orange-50"
                        )}
                      >
                        <CalendarClock className="h-4 w-4" />
                        {t('postTypes.activity')}
                      </Button>
                      <Button
                        type="button"
                        variant={postType === 'destination' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPostType('destination')}
                        className={cn(
                          "flex items-center gap-2",
                          postType === 'destination' 
                            ? "bg-blue-500 hover:bg-blue-600 text-white" 
                            : "border-blue-200 text-blue-600 hover:bg-blue-50"
                        )}
                      >
                        <Map className="h-4 w-4" />
                        {t('postTypes.destination')}
                      </Button>
                    </div>
                    
                    <textarea
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      placeholder={postType === 'activity' ? t('postCreation.activityPlaceholder') : t('postCreation.destinationPlaceholder')}
                      className="w-full p-2 border rounded-md"
                      rows={3}
                    />
                    
                    {/* Star Rating */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">{t('rating.rateExperience')}</span>
                      <StarRating
                        rating={postRating}
                        onRatingChange={setPostRating}
                        size="md"
                      />
                      {postRating > 0 && (
                        <span className="text-sm text-gray-500">
                          {postRating} {postRating !== 1 ? t('rating.stars') : t('rating.star')}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <GooglePlacesSearch
                        key={locationKey}
                        value={location}
                        onChange={(locationName, placeDetails) => {
                          setLocation(locationName);
                          setSelectedPlaceDetails(placeDetails);
                        }}
                        placeholder={t('postCreation.locationPlaceholder')}
                        className="flex-1"
                        currentLocation={currentLocation}
                      />
                      <Button 
                        onClick={handlePost} 
                        disabled={isUploading}
                        className={cn(
                          "relative px-6 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-none hover:from-[#059669] hover:to-[#047857] hover:scale-105 transition-all duration-300 shadow-lg rounded-full font-medium tracking-wide flex items-center gap-2"
                        )}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('postCreation.posting')}
                          </>
                        ) : (
                          t('postCreation.postButton')
                        )}
                      </Button>
                    </div>
                    
                    {/* Media Upload */}
                    <div className="mt-4">
                      <MediaUpload
                        key={mediaKey}
                        onMediaChange={handleMediaChange}
                        maxFiles={10}
                        disabled={isUploading}
                      />
                    </div>
                  </div>

                  {/* Feed Type Selector */}
                  <div className="sticky top-0 lg:top-16 z-10 bg-white border-b border-gray-200 -mx-6 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto whitespace-nowrap pr-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab('feed')}
                        className={cn(
                          "h-9 px-3 rounded-full text-sm flex items-center transition-all",
                          activeTab === 'feed'
                            ? "bg-[#61936f] text-white sm:bg-gradient-to-r sm:from-[#10B981] sm:to-[#059669] sm:text-white sm:border-none sm:shadow-lg sm:hover:from-[#059669] sm:hover:to-[#047857] sm:hover:scale-105"
                            : "bg-transparent text-[#1d1d1e] hover:bg-gray-100"
                        )}
                      >
                        <MessageCircle className="h-4 w-4 mr-1.5" />
                        {t('postTypes.feed')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab('activities')}
                        className={cn(
                          "h-9 px-3 rounded-full text-sm flex items-center transition-all",
                          activeTab === 'activities'
                            ? "bg-[#61936f] text-white sm:bg-gradient-to-r sm:from-[#10B981] sm:to-[#059669] sm:text-white sm:border-none sm:shadow-lg sm:hover:from-[#059669] sm:hover:to-[#047857] sm:hover:scale-105"
                            : "bg-transparent text-[#1d1d1e] hover:bg-gray-100"
                        )}
                      >
                        <MapPin className="h-4 w-4 mr-1.5" />
                        {t('postTypes.activities')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab('destinations')}
                        className={cn(
                          "h-9 px-3 rounded-full text-sm flex items-center transition-all",
                          activeTab === 'destinations'
                            ? "bg-[#61936f] text-white sm:bg-gradient-to-r sm:from-[#10B981] sm:to-[#059669] sm:text-white sm:border-none sm:shadow-lg sm:hover:from-[#059669] sm:hover:to-[#047857] sm:hover:scale-105"
                            : "bg-transparent text-[#1d1d1e] hover:bg-gray-100"
                        )}
                      >
                        <Compass className="h-4 w-4 mr-1.5" />
                        {t('postTypes.destinations')}
                      </Button>
                    </div>
                    {isFeedPickerSticky && (
                      <Button
                        onClick={scrollToPostCreator}
                        className="hidden sm:flex bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-none hover:from-[#059669] hover:to-[#047857] hover:scale-105 transition-all duration-300 shadow-lg rounded-full font-medium tracking-wide items-center gap-2"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {t('postCreation.postButton')}
                      </Button>
                    )}
                  </div>

                  {/* Mobile Floating Post Button above bottom navigation */}
                  {isFeedPickerSticky && (
                    <div className="sm:hidden">
                      <div className="fixed right-4 z-[60]"
                           style={{ bottom: 'calc(6.5rem + env(safe-area-inset-bottom))' }}>
                        <Button
                          onClick={scrollToPostCreator}
                          disabled={isUploading}
                          className="h-12 px-5 rounded-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-none shadow-xl hover:from-[#059669] hover:to-[#047857] active:scale-95 transition-all duration-200 flex items-center gap-2"
                          aria-label={t('postCreation.postButton')}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              {t('postCreation.posting')}
                            </>
                          ) : (
                            <>
                              <MessageCircle className="h-5 w-5" />
                              {t('postCreation.postButton')}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Loading State */}
                  {loading && (
                    <div className="text-center py-4">
                      <p>{t('loading.posts')}</p>
                    </div>
                  )}

                  {/* Display Posts */}
                  {!loading && posts.length === 0 ? (
                    <div className="text-center py-4">
                      <p>{t('errors.notFound')}</p>
                    </div>
                  ) : (
                    <>
                      {posts.map((post) => (
                        <div 
                          key={post.id} 
                          className="relative bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100 hover:shadow-md transition-shadow duration-200"
                        >
                          
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
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-800">
                                    {post.profile?.username || `${post.profile?.first_name || ''} ${post.profile?.last_name || ''}`.trim() || t('user.anonymous')}
                                  </p>
                                  {post.post_type && (
                                    <span className={cn(
                                      "px-2 py-1 text-xs font-medium rounded-full",
                                      post.post_type === 'activity' 
                                        ? "bg-orange-100 text-orange-700 border border-orange-200"
                                        : "bg-blue-100 text-blue-700 border border-blue-200"
                                    )}>
                                      {post.post_type === 'activity' ? t('postTypes.activity') : t('postTypes.destination')}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">
                                  {new Date(post.created_at).toLocaleString()}
                                  {post.distance !== undefined && (
                                    <span className={cn(
                                      "ml-2 text-xs",
                                      post.distance > 1000 
                                        ? "text-purple-500 font-medium" 
                                        : "text-blue-500"
                                    )}>
                                      • {post.distance > 1000 ? t('aroundTheWorld') : `${post.distance.toFixed(1)}km`}
                                    </span>
                                  )}
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
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                                title={t('postActions.share')}
                                onClick={() => handleShareWithDevice(post)}
                              >
                                <Share2 className="h-4 w-4 text-blue-500" />
                              </Button>
                              {(currentUser?.id === post.user_id || isAdmin) && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {currentUser?.id === post.user_id && (
                                      <>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setEditingPost(post);
                                            setEditContent(post.content);
                                            setEditMedia(post.media_urls || []);
                                            setEditLocation(post.location || '');
                                            setEditPlaceDetails({
                                              place_id: post.place_id,
                                              geometry: {
                                                location: {
                                                  lat: post.place_lat,
                                                  lng: post.place_lng
                                                }
                                              },
                                              types: post.place_types,
                                              rating: post.place_rating,
                                              user_ratings_total: post.place_user_ratings_total
                                            });
                                            setEditLocationKey(prev => prev + 1);
                                            setEditMediaKey(prev => prev + 1);
                                            setIsEditDialogOpen(true);
                                          }}
                                        >
                                          <Pencil className="h-4 w-4 mr-2" />
                                          {t('postActions.edit')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() => handleDeletePost(post.id)}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {isAdmin && (
                                      <>
                                        {currentUser?.id !== post.user_id && (
                                          <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() => handleDeletePost(post.id)}
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Post
                                          </DropdownMenuItem>
                                        )}
                                        {currentUser?.id !== post.user_id && (
                                          <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() => handleBlockUser(post.user_id)}
                                            disabled={blockedUsers.has(post.user_id)}
                                          >
                                            <Ban className="h-4 w-4 mr-2" />
                                            {blockedUsers.has(post.user_id) ? 'User Blocked' : 'Block User'}
                                          </DropdownMenuItem>
                                        )}
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                          {post.location && (
                            <LocationDisplay
                              location={post.location}
                              placeId={post.place_id}
                              placeLat={post.place_lat}
                              placeLng={post.place_lng}
                              placeTypes={post.place_types}
                              placeRating={post.place_rating}
                              placeUserRatingsTotal={post.place_user_ratings_total}
                              className="mb-2"
                            />
                          )}
                          <div className="bg-gray-50 rounded-xl p-4 mb-4">
                            <p className="text-gray-700 leading-relaxed">{post.content}</p>
                            {(post.media_urls && post.media_urls.length > 0) || post.image_url ? (
                              <div className="mt-4">
                                <MediaDisplay
                                  media={post.media_urls && post.media_urls.length > 0 ? post.media_urls : post.image_url}
                                  maxPreview={5}
                                />
                              </div>
                            ) : null}
                          </div>
                          <div className="flex gap-4 pt-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`flex items-center rounded-full px-4 ${userLikes[post.id] ? 'text-red-500 hover:bg-red-50' : 'hover:bg-gray-100'}`}
                              onClick={() => handleLike(post.id)}
                            >
                              <Heart className={`h-4 w-4 mr-2 ${userLikes[post.id] ? 'fill-current' : ''}`} />
                              {post.likes?.[0]?.count || 0} Likes
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="flex items-center rounded-full px-4 hover:bg-gray-100"
                              onClick={() => {
                                setExpandedReplies(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(post.id)) {
                                    newSet.delete(post.id);
                                  } else {
                                    newSet.add(post.id);
                                    if (!replies[post.id]) {
                                      fetchReplies(post.id);
                                    }
                                  }
                                  return newSet;
                                });
                              }}
                            >
                              <Reply className="h-4 w-4 mr-2" />
                              {post.replies?.[0]?.count || 0} {t('replies.title')}
                            </Button>
                          </div>

                          {/* Replies Section */}
                          {expandedReplies.has(post.id) && (
                            <div className="mt-4 space-y-4">
                              {/* Reply Input */}
                              <div className="space-y-4">
                                <textarea
                                  value={replyContent[post.id] || ''}
                                  onChange={(e) => setReplyContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                                  placeholder={t('replies.placeholder')}
                                  className="w-full p-2 border rounded-md"
                                  rows={2}
                                />
                                
                                {/* Reply Star Rating */}
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-gray-700">{t('rating.ratePost')}</span>
                                  <StarRating
                                    rating={replyRating[post.id] || 0}
                                    onRatingChange={(rating) => setReplyRating(prev => ({ ...prev, [post.id]: rating }))}
                                    size="sm"
                                  />
                                  {(replyRating[post.id] || 0) > 0 && (
                                    <span className="text-sm text-gray-500">
                                      {replyRating[post.id]} {(replyRating[post.id] || 0) !== 1 ? t('rating.stars') : t('rating.star')}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Reply Media Upload */}
                                <MediaUpload
                                  onMediaChange={(media) => handleReplyMediaChange(media, post.id)}
                                  maxFiles={5}
                                  disabled={isUploadingReply[post.id]}
                                />
                                
                                <Button
                                  size="sm"
                                  onClick={() => handleReply(post.id)}
                                  disabled={isUploadingReply[post.id]}
                                  className={cn(
                                    "relative px-4 py-1 bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-none hover:from-[#059669] hover:to-[#047857] hover:scale-105 transition-all duration-300 shadow-lg rounded-full font-medium tracking-wide flex items-center gap-2"
                                  )}
                                >
                                  {isUploadingReply[post.id] ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Posting...
                                    </>
                                  ) : (
                                    'Reply'
                                  )}
                                </Button>
                              </div>

                              {/* Replies List */}
                              <div className="space-y-4">
                                {replies[post.id]?.map((reply) => (
                                  <div
                                    key={`reply-${reply.id}`}
                                    className="bg-gray-50 rounded-lg p-4"
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
                                          {reply.profile?.username || `${reply.profile?.first_name || ''} ${reply.profile?.last_name || ''}`.trim() || t('user.anonymous')}
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
                                              onClick={() => handleDeleteReply(reply.id, post.id)}
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                    </div>
                                    <p className="text-gray-700 text-sm">{reply.content}</p>
                                    {reply.rating && (
                                      <div className="flex items-center gap-2 mt-1">
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
                                ))}
                              </div>

                              {/* View All Comments Button */}
                              {post.replies?.[0]?.count > 3 && (
                                <div className="flex justify-center mt-4">
                                  <Button
                                    variant="outline"
                                    onClick={() => navigateToPost(post.id)}
                                    className="flex items-center gap-2"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                    {t('replies.viewAll')} ({post.replies[0].count})
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Infinite Scroll Trigger */}
                      <div id="load-more-trigger" className="h-4 w-full">
                        {loadingMore && (
                          <div className="text-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
                            <p className="text-sm text-gray-500 mt-2">{t('infiniteScroll.loadingMore')}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Edit Post Dialog */}
                  <Dialog 
                    open={isEditDialogOpen} 
                    onOpenChange={(open) => {
                      setIsEditDialogOpen(open);
                    }}
                  >
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{t('toast.editPost')}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Content
                          </label>
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[100px]"
                            placeholder="What's on your mind?"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Location
                          </label>
                          <GooglePlacesSearch
                            key={editLocationKey}
                            value={editLocation}
                            onChange={(locationName, placeDetails) => {
                              setEditLocation(locationName);
                              setEditPlaceDetails(placeDetails);
                            }}
                            placeholder="Add your location (optional)"
                            currentLocation={currentLocation}
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Media
                          </label>
                          <MediaUpload
                            key={editMediaKey}
                            onMediaChange={setEditMedia}
                            maxFiles={10}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setIsEditDialogOpen(false);
                          // Reset all edit states with a small delay to ensure proper cleanup
                          setTimeout(() => {
                            setEditingPost(null);
                            setEditContent('');
                            setEditMedia([]);
                            setEditLocation('');
                            setEditPlaceDetails(null);
                            setEditLocationKey(prev => prev + 1);
                            setEditMediaKey(prev => prev + 1);
                          }, 100);
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={handleEditPost}>
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Nearby Activities & Destinations */}
            <div className="space-y-6 lg:sticky lg:top-16 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-2">
              {isAdmin && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold flex items-center">
                      <Shield className="h-6 w-6 mr-2 text-blue-500" />
                      Community Management
                    </h2>
                    <Button
                      variant="outline"
                      onClick={() => setShowBlockedUsers(!showBlockedUsers)}
                      className="flex items-center gap-2"
                    >
                      {showBlockedUsers ? (
                        <>
                          <UserCheck className="h-4 w-4" />
                          Hide Blocked Users
                        </>
                      ) : (
                        <>
                          <UserX className="h-4 w-4" />
                          Show Blocked Users
                        </>
                      )}
                    </Button>
                  </div>

                  {showBlockedUsers && (
                    <div className="space-y-4">
                      {blockedUsersList.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          No users are currently blocked.
                        </p>
                      ) : (
                        blockedUsersList.map((block) => (
                          <div
                            key={block.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
                                {block.blocked_user?.avatar_url ? (
                                  <img
                                    src={supabase.storage.from('avatars').getPublicUrl(block.blocked_user.avatar_url).data.publicUrl}
                                    alt={block.blocked_user.username || 'User'}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Users className="h-5 w-5 text-blue-500" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {`${block.blocked_user?.first_name || ''} ${block.blocked_user?.last_name || ''}`.trim() || block.blocked_user?.username || 'Unknown User'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Blocked by {`${block.blocked_by?.first_name || ''} ${block.blocked_by?.last_name || ''}`.trim() || block.blocked_by?.username || 'Unknown'}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {new Date(block.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnblockUser(block.blocked_user_id)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Unblock
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <MapPin className="h-6 w-6 mr-2 text-red-500" />
                                      {t('nearbyPlaces.title')}
                </h2>
                <div className="space-y-4">
                  {!currentLocation ? (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">{t('nearbyPlaces.enableLocation')}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={detectCurrentLocation}
                        className="mt-2"
                      >
                        {t('nearbyPlaces.enableLocation')}
                      </Button>
                    </div>
                  ) : loadingNearbyPlaces ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">{t('nearbyPlaces.loading')}</p>
                    </div>
                  ) : nearbyPlaces.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">{t('nearbyPlaces.noPlaces')}</p>
                      <p className="text-sm text-gray-400 mt-1">{t('nearbyPlaces.checkBackLater')}</p>
                    </div>
                  ) : (
                    nearbyPlaces.map((place) => (
                      <div 
                        key={place.id} 
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handlePlaceClick(place)}
                      >
                        <div className="flex items-start">
                          <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            {place.poi_category?.image_url ? (
                              <img
                                src={place.poi_category.image_url}
                                alt={place.poi_category.name}
                                className="h-8 w-8 object-cover rounded"
                              />
                            ) : (
                              <CalendarClock className="h-6 w-6 text-orange-500" />
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <h3 className="font-semibold text-gray-800">{place.name}</h3>
                            <p className="text-sm text-gray-500">
                              {place.distance.toFixed(1)}{t('nearbyPlaces.distance')}
                              {place.poi_category && ` • ${place.poi_category.name}`}
                            </p>
                            {place.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {place.description}
                              </p>
                            )}
                            {place.address && (
                              <p className="text-xs text-gray-400 mt-1">
                                {place.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>


            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Community;
