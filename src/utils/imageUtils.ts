/**
 * Utility functions for handling images
 */

/**
 * Checks if a local image exists for a given city name
 * @param cityName The name of the city to check
 * @returns A boolean indicating whether the image exists
 */
export const checkIfCityImageExists = (cityName: string): boolean => {
  // Since we're removing city-images, always return false
  return false;
};

/**
 * Get the image URL for a city, with fallback to default image
 * @param cityName The name of the city
 * @returns The image URL
 */
export const getCityImageUrl = (cityName: string): string => {
  // Since we're removing city-images, always return the default image
  return '/zaparound-uploads/defaultimage.png';
};

/**
 * Normalize text for file names (remove accents, special characters)
 * @param text The text to normalize
 * @returns The normalized text
 */
export const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
};

/**
 * Check if we're in a browser environment
 * @returns boolean indicating if we're in a browser
 */
const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Client-side check if a city image exists
 * @param cityName The name of the city to check
 * @returns A Promise that resolves to a boolean indicating whether the image exists
 */
export const checkIfCityImageExistsClient = async (cityName: string): Promise<boolean> => {
  // Since we're removing city-images, always return false
  return false;
}; 