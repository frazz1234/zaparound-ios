import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { createPlaceUrl, createPlaceSlug } from '@/utils/placeUtils';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  Globe, 
  ArrowLeft, 
  Heart,
  Share2,
  Navigation,
  Calendar,
  Users,
  MessageCircle,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getMapboxToken } from '@/utils/mapboxUtils';
import { useFavorites } from '@/hooks/useFavorites';
import { SEO } from '@/components/SEO';
import { Helmet } from 'react-helmet-async';

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
  website?: string;
  international_phone_number?: string;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
    profile_photo_url?: string;
  }>;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  price_level?: number;
  vicinity?: string;
}

interface ZapPlacesPageState {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  types: string[];
  rating: number;
  userRatingsTotal: number;
}

const ZapPlaces = () => {
  const { placeSlug } = useParams<{ placeSlug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('zap-places');
  const language = (typeof navigator !== 'undefined' ? (document.documentElement.lang || navigator.language?.slice(0,2)) : 'en') || 'en';
  const LOCALE_MAP: Record<string, string> = { en: 'en_US', fr: 'fr_FR', es: 'es_ES' };
  const locale = LOCALE_MAP[language] || 'en_US';
  const { toast } = useToast();
  const { isFavorited, toggleFavorite } = useFavorites();
  
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  
  const galleryRef = useRef<HTMLDivElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
 

  // Get state from navigation - placeId should be passed here
  const state = location.state as ZapPlacesPageState;
  let placeId = state?.placeId;
  
  // Fallback: check URL query parameters for placeId (for external links)
  if (!placeId) {
    const urlParams = new URLSearchParams(window.location.search);
    placeId = urlParams.get('id');
  }

  // Check if current place is favorited
  const isFavoriteState = isFavorited(placeId || '');

  // Fetch Mapbox token securely
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const token = await getMapboxToken();
        setMapboxToken(token);
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        // Don't set error state here - let the map initialize without token
        // The map will show a placeholder or error message instead
      }
    };

    fetchMapboxToken();
  }, []);



  useEffect(() => {
    if (placeId) {
      fetchPlaceDetails();
      fetchRelatedPosts();
      // setIsFavorite(isFavoriteState); // This line is no longer needed as isFavorited handles state
    }
  }, [placeId]);

  // Initialize Mapbox map when place details are loaded and token is available
  useEffect(() => {
    if (placeDetails?.geometry?.location && mapContainer.current && !map.current) {
      const cleanup = initializeMap();
      return cleanup; // Return cleanup function to prevent memory leak
    }
  }, [placeDetails, mapboxToken]);

  const initializeMap = () => {
    if (!placeDetails?.geometry?.location || !mapContainer.current) return;

    // If no token is available, show a placeholder instead of failing
    if (!mapboxToken) {
      console.warn('Mapbox token not available, showing placeholder');
      const placeholderDiv = document.createElement('div');
      placeholderDiv.className = 'w-full h-full bg-gray-100 flex items-center justify-center text-gray-500';
      placeholderDiv.innerHTML = `
        <div class="text-center">
          <div class="text-2xl mb-2">🗺️</div>
          <p class="text-sm">Map loading...</p>
        </div>
      `;
      mapContainer.current.appendChild(placeholderDiv);
      
      // Return cleanup function
      return () => {
        if (mapContainer.current && placeholderDiv.parentNode) {
          mapContainer.current.removeChild(placeholderDiv);
        }
      };
    }

    // Set Mapbox access token securely
    mapboxgl.accessToken = mapboxToken;

    const { lat, lng } = placeDetails.geometry.location;

    // Create map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 15,
      attributionControl: false
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add attribution
    map.current.addControl(
      new mapboxgl.AttributionControl({
        compact: true
      })
    );

    // Add popup
    const popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <div class="p-2">
          <h3 class="font-semibold text-sm">${placeDetails.name}</h3>
          <p class="text-xs text-gray-600">${placeDetails.formatted_address}</p>
        </div>
      `);

    // Add marker with popup
    new mapboxgl.Marker()
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map.current);

    // Handle map load
    map.current.on('load', () => {
      if (map.current) {
        map.current.resize();
      }
    });

    // Return cleanup function to prevent memory leak
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  };

  const fetchPlaceDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('google-places-search', {
        body: {
          action: 'details',
          placeId: placeId,
          fields: 'place_id,name,formatted_address,geometry,types,rating,user_ratings_total,opening_hours,website,international_phone_number,reviews,photos,price_level,vicinity',
          language: 'en'
        }
      });

      if (error) {
        throw error;
      }

      if (data.status === 'OK' && data.result) {
        setPlaceDetails(data.result);
        // Fetch images if photos are available
        if (data.result.photos && data.result.photos.length > 0) {
          fetchPlaceImages(data.result.photos);
        }
      } else {
        throw new Error('Place not found');
      }
    } catch (err) {
      console.error('Error fetching place details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load place details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaceImages = async (photos: PlaceDetails['photos']) => {
    try {
      const imagePromises = photos?.slice(0, 6).map(async (photo) => {
        const { data, error } = await supabase.functions.invoke('google-places-search', {
          body: {
            action: 'photo',
            photoReference: photo.photo_reference,
            maxWidth: 800,
            maxHeight: 600
          }
        });

        if (error) {
          console.error('Error fetching image:', error);
          return null;
        }

        return data;
      }) || [];

      const images = await Promise.all(imagePromises);
      const validImages = images.filter(img => img !== null) as string[];
      setImageUrls(validImages);
    } catch (err) {
      console.error('Error fetching place images:', err);
    }
  };

  const fetchRelatedPosts = async () => {
    try {
      setLoadingPosts(true);
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
        .eq('place_id', placeId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRelatedPosts(data || []);
    } catch (err) {
      console.error('Error fetching related posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!placeDetails && !state) {
      toast({
        title: 'Error',
        description: 'Place details not available.',
        variant: 'destructive',
      });
      return;
    }

    const favoriteData = {
      place_id: placeId!,
      place_name: placeDetails?.name || state?.name || '',
      place_address: placeDetails?.formatted_address || '',
      place_rating: placeDetails?.rating || state?.rating || 0,
      place_lat: placeDetails?.geometry?.location?.lat ?? state?.lat ?? 0,
      place_lng: placeDetails?.geometry?.location?.lng ?? state?.lng ?? 0,
      place_types: placeDetails?.types || state?.types || []
    };

    await toggleFavorite(favoriteData);
  };

  const sharePlace = async () => {
    if (navigator.share && placeDetails) {
      try {
        const shareUrl = createPlaceUrl(placeId!, placeDetails.name, language);
        await navigator.share({
          title: placeDetails.name,
          text: `Check out ${placeDetails.name} on ZapAround!`,
          url: `https://zaparound.com/${shareUrl}`,
        });
      } catch (err) {
        // Fallback to copying URL
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    const shareUrl = createPlaceUrl(placeId!, placeDetails?.name || '', language);
          const fullUrl = `https://zaparound.com/${shareUrl}`;
    navigator.clipboard.writeText(fullUrl);
    toast({
      title: 'Link Copied',
      description: 'Place page link copied to clipboard.',
    });
  };

  const openInMaps = () => {
    if (placeDetails?.geometry?.location) {
      const { lat, lng } = placeDetails.geometry.location;
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  const getPlaceIcon = (types?: string[]) => {
    if (!types || types.length === 0) return '📍';
    
    if (types.includes('restaurant') || types.includes('food')) {
      return '🍽️';
    } else if (types.includes('tourist_attraction') || types.includes('point_of_interest')) {
      return '🏛️';
    } else if (types.includes('lodging') || types.includes('hotel')) {
      return '🏨';
    } else if (types.includes('shopping_mall') || types.includes('store')) {
      return '🛍️';
    } else if (types.includes('park') || types.includes('natural_feature')) {
      return '🌳';
    } else if (types.includes('museum')) {
      return '🏛️';
    } else if (types.includes('amusement_park') || types.includes('entertainment')) {
      return '🎡';
    } else {
      return '📍';
    }
  };

  const getPriceLevel = (level?: number) => {
    if (!level) return null;
    return '$'.repeat(level);
  };

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeImageModal = () => {
    setSelectedImageIndex(null);
  };

  const nextImage = () => {
    if (selectedImageIndex !== null && imageUrls.length > 0) {
      setSelectedImageIndex((selectedImageIndex + 1) % imageUrls.length);
    }
  };

  const prevImage = () => {
    if (selectedImageIndex !== null && imageUrls.length > 0) {
      setSelectedImageIndex(selectedImageIndex === 0 ? imageUrls.length - 1 : selectedImageIndex - 1);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!galleryRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - galleryRef.current.offsetLeft);
    setScrollLeft(galleryRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !galleryRef.current) return;
    e.preventDefault();
    const x = e.pageX - galleryRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    galleryRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!galleryRef.current) return;
    e.preventDefault();
    galleryRef.current.scrollLeft += e.deltaY;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#61936f] mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Check if we have placeId from navigation state or query parameters
  if (!placeId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Invalid Place URL</h2>
          <p className="text-gray-600 mb-6">This place page cannot be accessed directly. Please navigate to it from the community or map.</p>
          <Button onClick={() => navigate(`/${language}/community`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go to Community
          </Button>
        </div>
      </div>
    );
  }

  if (error || !placeDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('placeNotFound')}</h2>
          <p className="text-gray-600 mb-6">{error || t('placeNotFoundDescription')}</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('goBack')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SEO for Place detail */}
      {placeDetails && (
        <SEO
          title={`${placeDetails.name} | ZapAround`}
          description={`${placeDetails.formatted_address || ''}${placeDetails.rating ? ` • Rating ${placeDetails.rating.toFixed(1)}${placeDetails.user_ratings_total ? ` (${placeDetails.user_ratings_total})` : ''}` : ''}`.trim()}
          image={imageUrls?.[0] || '/og-image.png'}
          url={`/${language}/zap-places/${createPlaceSlug(placeDetails.name)}`}
          locale={locale}
          breadcrumbs={[
            { name: 'Home', url: `/${language}/` },
            { name: 'Place', url: `/${language}/zap-places/${createPlaceSlug(placeDetails.name)}` },
          ]}
          structuredData={{
            '@context': 'https://schema.org',
            '@type': 'Place',
            name: placeDetails.name,
            address: placeDetails.formatted_address || undefined,
            url: `https://zaparound.com/${language}/zap-places/${createPlaceSlug(placeDetails.name)}`,
            geo: placeDetails.geometry?.location
              ? {
                  '@type': 'GeoCoordinates',
                  latitude: placeDetails.geometry.location.lat,
                  longitude: placeDetails.geometry.location.lng,
                }
              : undefined,
            aggregateRating: placeDetails.rating
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: placeDetails.rating,
                  reviewCount: placeDetails.user_ratings_total || undefined,
                }
              : undefined,
            openingHoursSpecification: placeDetails.opening_hours?.weekday_text
              ? placeDetails.opening_hours.weekday_text.map((text) => ({ '@type': 'OpeningHoursSpecification', description: text }))
              : undefined,
            image: imageUrls && imageUrls.length > 0 ? imageUrls.slice(0, 3) : undefined,
          }}
        />
      )}
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t('back')}</span>
              </Button>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={sharePlace}
                  className="flex items-center space-x-2 bg-blue-50 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors duration-200"
                >
                  <Share2 className="h-4 w-4" />
                  <span>{t('share')}</span>
                </Button>
                
                <Button
                  variant={isFavoriteState ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleFavorite}
                  className={`flex items-center space-x-2 transition-colors duration-200 ${
                    isFavoriteState 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-red-50 border-red-500 text-red-600 hover:bg-red-500 hover:text-white'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFavoriteState ? 'fill-current' : ''}`} />
                  <span>{isFavoriteState ? t('saved') : t('save')}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Place Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl">{getPlaceIcon(placeDetails.types)}</div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-[#030303] mb-2">
                        {placeDetails.name}
                      </CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-[#62626a]">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{placeDetails.formatted_address}</span>
                        </div>
                        {placeDetails.rating && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{placeDetails.rating.toFixed(1)}</span>
                            {placeDetails.user_ratings_total && (
                              <span>({placeDetails.user_ratings_total})</span>
                            )}
                          </div>
                        )}
                        {getPriceLevel(placeDetails.price_level) && (
                          <Badge variant="secondary">
                            {getPriceLevel(placeDetails.price_level)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Image Gallery */}
            {imageUrls.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ImageIcon className="h-5 w-5" />
                    <span>{t('photos')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div 
                      ref={galleryRef}
                      className="flex space-x-3 md:space-x-4 overflow-x-auto scrollbar-hide pb-2 -mb-2 snap-x snap-mandatory cursor-grab active:cursor-grabbing"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseLeave}
                      onWheel={handleWheel}
                      style={{ userSelect: isDragging ? 'none' : 'auto' }}
                    >
                      {imageUrls.map((imageUrl, index) => (
                        <div
                          key={index}
                          className="flex-shrink-0 w-48 h-36 md:w-64 md:h-48 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shadow-md snap-start"
                          onClick={(e) => {
                            if (!isDragging) {
                              openImageModal(index);
                            }
                          }}
                          style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
                        >
                          <img
                            src={imageUrl}
                            alt={`${placeDetails.name} - Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            draggable={false}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {/* Scroll indicator */}
                    {imageUrls.length > 2 && (
                      <div className="flex justify-center mt-4 space-x-2">
                        {Array.from({ length: Math.ceil(imageUrls.length / 2) }, (_, i) => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-gray-300"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button
                        variant="outline"
                        onClick={openInMaps}
                        className="flex flex-col items-center space-y-2 h-auto py-4"
                      >
                        <Navigation className="h-5 w-5" />
                        <span className="text-sm">{t('directions')}</span>
                      </Button>
                      
                      {placeDetails.website && (
                        <Button
                          variant="outline"
                          onClick={() => window.open(placeDetails.website, '_blank')}
                          className="flex flex-col items-center space-y-2 h-auto py-4"
                        >
                          <Globe className="h-5 w-5" />
                          <span className="text-sm">{t('website')}</span>
                        </Button>
                      )}
                      
                      {placeDetails.international_phone_number && (
                        <Button
                          variant="outline"
                          onClick={() => window.open(`tel:${placeDetails.international_phone_number}`)}
                          className="flex flex-col items-center space-y-2 h-auto py-4"
                        >
                          <Phone className="h-5 w-5" />
                          <span className="text-sm">{t('call')}</span>
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        onClick={() => navigate('/community', { state: { placeId } })}
                        className="flex flex-col items-center space-y-2 h-auto py-4"
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm">{t('posts')}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Opening Hours */}
                {placeDetails.opening_hours && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Clock className="h-5 w-5" />
                        <span>{t('openingHours')}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant={placeDetails.opening_hours.open_now ? "default" : "secondary"}>
                            {placeDetails.opening_hours.open_now ? t('openNow') : t('closed')}
                          </Badge>
                        </div>
                        {placeDetails.opening_hours.weekday_text && (
                          <div className="space-y-1">
                            {placeDetails.opening_hours.weekday_text.map((day, index) => (
                              <div key={index} className="text-sm text-[#62626a]">
                                {day}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reviews */}
                {placeDetails.reviews && placeDetails.reviews.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5" />
                        <span>{t('reviews')} ({placeDetails.reviews.length})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {placeDetails.reviews.slice(0, 3).map((review, index) => (
                          <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-medium">{review.rating}</span>
                              </div>
                              <span className="text-sm text-[#62626a]">by {review.author_name}</span>
                            </div>
                            <p className="text-sm text-[#030303]">{review.text}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Related Posts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageCircle className="h-5 w-5" />
                      <span>{t('communityPosts')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingPosts ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#61936f] mx-auto"></div>
                      </div>
                    ) : relatedPosts.length > 0 ? (
                      <div className="space-y-4">
                        {relatedPosts.map((post: any) => (
                          <div key={post.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start space-x-3">
                              <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                                {post.profile?.avatar_url ? (
                                  <img
                                    src={post.profile.avatar_url}
                                    alt={post.profile.username || 'User'}
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  <Users className="h-5 w-5 text-blue-500" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-sm">
                                    {post.profile?.username || `${post.profile?.first_name || ''} ${post.profile?.last_name || ''}`.trim() || 'Anonymous'}
                                  </span>
                                  <span className="text-xs text-[#62626a]">
                                    {new Date(post.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-[#030303] line-clamp-2">{post.content}</p>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-[#62626a]">
                                  <span>{post.likes?.[0]?.count || 0} likes</span>
                                  <span>{post.replies?.[0]?.count || 0} replies</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">{t('noPosts')}</p>
                        <Button
                          onClick={() => navigate('/community', { state: { placeId } })}
                          className="mt-4"
                        >
                          {t('beFirstToPost')}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('quickInfo')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {placeDetails.types && (
                      <div>
                        <h4 className="font-medium text-sm text-[#62626a] mb-2">{t('categories')}</h4>
                        <div className="flex flex-wrap gap-2">
                          {placeDetails.types.slice(0, 5).map((type, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {type.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {placeDetails.vicinity && (
                      <div>
                        <h4 className="font-medium text-sm text-[#62626a] mb-1">{t('vicinity')}</h4>
                        <p className="text-sm text-[#030303]">{placeDetails.vicinity}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Interactive Map */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('location')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      ref={mapContainer}
                      className="w-full h-64 rounded-lg overflow-hidden"
                      style={{ minHeight: '256px' }}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Image Modal */}
        {selectedImageIndex !== null && imageUrls.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
            <div className="relative max-w-4xl max-h-full p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={closeImageModal}
                className="absolute top-4 right-4 text-white hover:bg-white hover:text-black z-10"
              >
                <X className="h-6 w-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white hover:text-black z-10"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white hover:text-black z-10"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
              
              <img
                src={imageUrls[selectedImageIndex]}
                alt={`${placeDetails.name} - Photo ${selectedImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
              
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
                {selectedImageIndex + 1} / {imageUrls.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ZapPlaces; 