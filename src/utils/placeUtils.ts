// Utility functions for places

// Create a URL-friendly slug from a place name
export const createPlaceSlug = (placeName: string): string => {
  return placeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Create a full place URL with slug (without placeId in URL)
export const createPlaceUrl = (placeId: string, placeName: string, language: string = 'en'): string => {
  const slug = createPlaceSlug(placeName);
  return `/${language}/zap-places/${slug}`;
};

// Extract place ID from URL (for backward compatibility)
export const extractPlaceIdFromUrl = (url: string): string | null => {
  // Match format: /zap-places/slug
  const match = url.match(/\/zap-places\/([^\/]+)/);
  return match ? match[1] : null;
};

// Create a URL with placeId for internal use (when we need to pass placeId)
export const createPlaceUrlWithId = (placeId: string, placeName: string, language: string = 'en'): string => {
  const slug = createPlaceSlug(placeName);
  return `/${language}/zap-places/${placeId}/${slug}`;
};

// Validate if a string looks like a Google Place ID
export const isValidPlaceId = (id: string): boolean => {
  // Google Place IDs typically start with 'ChIJ' and are 27 characters long
  return /^ChIJ[A-Za-z0-9_-]{23}$/.test(id);
};
