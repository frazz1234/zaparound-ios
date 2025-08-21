import React from 'react';
import { Star, MapPin, ExternalLink, MessageCircle } from 'lucide-react';
import { POI } from '@/hooks/usePOIs';
import { useTranslation } from 'react-i18next';

interface POIMarkerProps {
  poi: POI;
  onClick?: (poi: POI) => void;
  onReviewClick?: (poi: POI) => void;
}

export const POIMarker: React.FC<POIMarkerProps> = ({ 
  poi, 
  onClick, 
  onReviewClick 
}) => {
  const { t } = useTranslation('navigation');
  // Get category icon based on categories
  const getCategoryIcon = (categories: string[]) => {
    if (categories.includes('restaurant') || categories.includes('food')) {
      return '🍽️';
    } else if (categories.includes('hotel') || categories.includes('lodging')) {
      return '🏨';
    } else if (categories.includes('cafe') || categories.includes('coffee')) {
      return '☕';
    } else if (categories.includes('bar') || categories.includes('pub')) {
      return '🍺';
    } else if (categories.includes('museum') || categories.includes('gallery')) {
      return '🏛️';
    } else if (categories.includes('park') || categories.includes('garden')) {
      return '🌳';
    } else if (categories.includes('shopping') || categories.includes('mall')) {
      return '🛍️';
    } else if (categories.includes('attraction') || categories.includes('landmark')) {
      return '🗽';
    } else if (categories.includes('review')) {
      return '⭐';
    } else {
      return '📍';
    }
  };

  // Get category color
  const getCategoryColor = (categories: string[]) => {
    if (categories.includes('restaurant') || categories.includes('food')) {
      return '#f97316'; // Orange
    } else if (categories.includes('hotel') || categories.includes('lodging')) {
      return '#3b82f6'; // Blue
    } else if (categories.includes('cafe') || categories.includes('coffee')) {
      return '#8b5cf6'; // Purple
    } else if (categories.includes('bar') || categories.includes('pub')) {
      return '#ef4444'; // Red
    } else if (categories.includes('museum') || categories.includes('gallery')) {
      return '#10b981'; // Green
    } else if (categories.includes('park') || categories.includes('garden')) {
      return '#059669'; // Emerald
    } else if (categories.includes('shopping') || categories.includes('mall')) {
      return '#ec4899'; // Pink
    } else if (categories.includes('attraction') || categories.includes('landmark')) {
      return '#f59e0b'; // Amber
    } else if (categories.includes('review')) {
      return '#fbbf24'; // Yellow
    } else {
      return '#6b7280'; // Gray
    }
  };

  const categoryIcon = getCategoryIcon(poi.categories);
  const categoryColor = getCategoryColor(poi.categories);

  return (
    <div className="poi-marker-container">
      {/* Custom marker element */}
      <div 
        className="poi-marker"
        style={{
          width: '28px',
          height: '28px',
          background: categoryColor,
          borderRadius: '50%',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          transition: 'all 0.2s ease',
        }}
        onClick={() => onClick?.(poi)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.zIndex = '10';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.zIndex = '1';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        }}
      >
        {categoryIcon}
      </div>

      {/* Popup content */}
      <div className="poi-popup-content" style={{ display: 'none' }}>
        <div className="p-3 bg-white rounded-lg shadow-lg border border-gray-200 max-w-xs">
          {/* Header with icon and title */}
          <div className="flex items-center space-x-2 mb-2">
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm"
              style={{ background: categoryColor }}
            >
              {categoryIcon}
            </div>
            <h3 className="font-semibold text-sm text-gray-900 truncate">
              {poi.name}
            </h3>
          </div>

          {/* Address */}
          <p className="text-xs text-gray-600 mb-2 truncate">
            {poi.address}
          </p>

          {/* Rating if available */}
          {poi.average_rating && poi.average_rating > 0 && (
            <div className="flex items-center space-x-1 mb-2">
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              <span className="text-xs text-gray-600">
                {poi.average_rating.toFixed(1)}/10
              </span>
              {poi.review_count && (
                <span className="text-xs text-gray-400">
                  ({poi.review_count} reviews)
                </span>
              )}
            </div>
          )}

          {/* Description if available */}
          {poi.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {poi.description}
            </p>
          )}

          {/* Category name if available */}
          {poi.category_name && (
            <div className="flex items-center space-x-1 mb-2">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">
                {poi.category_name}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex space-x-2">
            {poi.url && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(poi.url, '_blank');
                }}
                className="flex-1 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>{t('search.visit')}</span>
              </button>
            )}
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onReviewClick?.(poi);
              }}
              className="flex-1 text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors flex items-center justify-center space-x-1"
            >
              <MessageCircle className="w-3 h-3" />
              <span>{t('search.review')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POIMarker; 