import React from 'react';
import { MapPin, Star, Clock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createPlaceUrl } from '@/utils/placeUtils';

interface LocationDisplayProps {
  location: string;
  placeId?: string;
  placeLat?: number;
  placeLng?: number;
  placeTypes?: string[];
  placeRating?: number;
  placeUserRatingsTotal?: number;
  className?: string;
  place?: any;
}

export const LocationDisplay: React.FC<LocationDisplayProps> = ({
  location,
  placeId,
  placeLat,
  placeLng,
  placeTypes,
  placeRating,
  placeUserRatingsTotal,
  className,
  place
}) => {
  const { t } = useTranslation('community');
  const navigate = useNavigate();

  if (!location) return null;

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

  const getPlaceTypeLabel = (types?: string[]) => {
    if (!types || types.length === 0) return null;
    
    const typeLabels: { [key: string]: string } = {
      restaurant: 'Restaurant',
      food: 'Food',
      tourist_attraction: 'Tourist Attraction',
      point_of_interest: 'Point of Interest',
      lodging: 'Lodging',
      hotel: 'Hotel',
      shopping_mall: 'Shopping Mall',
      store: 'Store',
      park: 'Park',
      natural_feature: 'Natural Feature',
      museum: 'Museum',
      amusement_park: 'Amusement Park',
      entertainment: 'Entertainment'
    };

    for (const type of types) {
      if (typeLabels[type]) {
        return typeLabels[type];
      }
    }
    
    return null;
  };

  const hasPlaceDetails = placeId && placeLat && placeLng;
  const hasNewPlaceData = place && place.place_id;

  const handlePlaceClick = () => {
    if (hasNewPlaceData) {
      // Use new place data structure with SEO-friendly URL
      const placeUrl = createPlaceUrl(place.place_id, place.name);
      navigate(placeUrl, {
        state: {
          placeId: place.place_id,
          name: place.name,
          lat: place.geometry?.location?.lat,
          lng: place.geometry?.location?.lng,
          types: place.types,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total
        }
      });
    } else if (hasPlaceDetails) {
      // Use old place data structure with SEO-friendly URL
      const placeUrl = createPlaceUrl(placeId!, location);
      navigate(placeUrl, {
        state: {
          placeId,
          name: location,
          lat: placeLat,
          lng: placeLng,
          types: placeTypes,
          rating: placeRating,
          userRatingsTotal: placeUserRatingsTotal
        }
      });
    }
  };

  // If we have new place data, use it
  if (hasNewPlaceData) {
    return (
      <div 
        className="inline-flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-700 cursor-pointer transition-colors duration-200"
        onClick={handlePlaceClick}
      >
        <MapPin className="h-3 w-3" />
        <span className="font-medium">{place.name}</span>
        {place.rating && (
          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3 text-yellow-500 fill-current" />
            <span className="text-xs">{place.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    );
  }

  // Fallback to old structure or simple display
  return (
    <div className={cn('flex items-start space-x-2 text-sm text-[#62626a]', className)}>
      <div className="flex-shrink-0 mt-0.5">
        <MapPin className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          {hasPlaceDetails && (
            <span className="text-base">{getPlaceIcon(placeTypes)}</span>
          )}
          <span className="font-medium text-[#030303] truncate">{location}</span>
          
          {hasPlaceDetails && (
            <button
              onClick={handlePlaceClick}
              className="ml-2 px-3 py-1 text-xs bg-[#61936f] text-white rounded-full hover:bg-[#4a7c5a] transition-colors duration-200 flex items-center space-x-1"
              title="View place details"
            >
              <span>View</span>
              <Eye className="h-3 w-3" />
            </button>
          )}
        </div>
        
        {hasPlaceDetails && (
          <div className="flex items-center space-x-4 mt-1">
            {placeRating && (
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                <span className="text-xs">
                  {placeRating.toFixed(1)}
                  {placeUserRatingsTotal && ` (${placeUserRatingsTotal})`}
                </span>
              </div>
            )}
            
            {getPlaceTypeLabel(placeTypes) && (
              <span className="text-xs bg-[#fcfcfc] px-2 py-1 rounded-full border border-[#62626a]/20">
                {getPlaceTypeLabel(placeTypes)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 