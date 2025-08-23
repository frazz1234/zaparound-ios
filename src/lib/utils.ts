import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface CachedLocation {
  data: {
    city: string;
    region: string;
    country: string;
    formatted: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  timestamp: number;
}

const LOCATION_CACHE_KEY = 'zaparounds_location_cache';
const CACHE_EXPIRATION = 15 * 60 * 1000; // 15 minutes in milliseconds

export function getCachedLocation(): CachedLocation | null {
  const cached = localStorage.getItem(LOCATION_CACHE_KEY);
  if (!cached) return null;

  const parsedCache = JSON.parse(cached) as CachedLocation;
  const now = Date.now();

  // Check if cache is expired
  if (now - parsedCache.timestamp > CACHE_EXPIRATION) {
    localStorage.removeItem(LOCATION_CACHE_KEY);
    return null;
  }

  return parsedCache;
}

export function setCachedLocation(location: CachedLocation['data']): void {
  const cache: CachedLocation = {
    data: location,
    timestamp: Date.now()
  };
  localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cache));
}
