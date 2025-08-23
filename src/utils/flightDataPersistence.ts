import localforage from 'localforage';

// Flight Data Persistence Utility
// Implements Google Flights-like logic for data persistence and automatic refresh
// Uses LocalForage for better storage capacity and reliability

export interface FlightSearchData {
  searchParams: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengers: number;
    cabinClass: string;
    currency: string;
    maxConnections?: number;
  };
  searchResults: any;
  timing: {
    search_started_at: string;
    supplier_timeout: number;
    expires_at: string | null;
    created_at: string | null;
  };
  searchTimestamp: number;
  selectedOfferId?: string;
  userProgress: {
    currentStep: 'search' | 'passengers' | 'ancillaries' | 'luggage' | 'payment';
    passengerForms?: any[];
    ancillariesPayload?: any;
    luggageSelections?: any;
  };
  searchId: string; // Unique identifier for this search
  needsRefresh?: boolean; // Flag to indicate if data needs refresh
}

export interface FlightDataCache {
  [key: string]: FlightSearchData;
}

class FlightDataPersistence {
  private readonly CACHE_PREFIX = 'flight_search_';
  private readonly MAX_CACHE_AGE = 30 * 60 * 1000; // 30 minutes
  private readonly OFFER_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes buffer before expiry
  private readonly SUPPLIER_TIMEOUT_MULTIPLIER = 3; // 3x supplier timeout for cache age
  private store: LocalForage;

  constructor() {
    // Configure LocalForage for flight data storage
    this.store = localforage.createInstance({
      name: 'ZapAroundFlightData',
      storeName: 'flight_searches',
      description: 'Flight search data and user progress for ZapAround'
    });
    
    // Set preferred driver order: IndexedDB > WebSQL > localStorage
    this.store.setDriver([
      localforage.INDEXEDDB,
      localforage.WEBSQL,
      localforage.LOCALSTORAGE
    ]);
  }

  /**
   * Generate a unique search ID for URL-based caching
   */
  generateSearchId(searchParams: FlightSearchData['searchParams']): string {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      cabinClass,
      currency,
      maxConnections
    } = searchParams;
    
    const searchString = `${origin}-${destination}-${departureDate}-${returnDate || 'oneway'}-${passengers}-${cabinClass}-${currency}-${maxConnections || 1}`;
    return btoa(searchString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
  }

  /**
   * Create a search URL with parameters
   */
  createSearchUrl(searchParams: FlightSearchData['searchParams'], language: string = 'en'): string {
    const searchId = this.generateSearchId(searchParams);
    const params = new URLSearchParams({
      origin: searchParams.origin,
      destination: searchParams.destination,
      departureDate: searchParams.departureDate,
      passengers: searchParams.passengers.toString(),
      cabinClass: searchParams.cabinClass,
      currency: searchParams.currency,
      searchId: searchId
    });
    
    if (searchParams.returnDate) {
      params.append('returnDate', searchParams.returnDate);
    }
    if (searchParams.maxConnections) {
      params.append('maxConnections', searchParams.maxConnections.toString());
    }
    
    return `/${language}/booking/flights?${params.toString()}`;
  }

  /**
   * Create a flight details URL with search context
   */
  createFlightDetailsUrl(offerId: string, searchParams: FlightSearchData['searchParams'], language: string = 'en'): string {
    const searchId = this.generateSearchId(searchParams);
    return `/${language}/booking/flight-details?offerId=${offerId}&searchId=${searchId}`;
  }

  /**
   * Extract search parameters from URL
   */
  extractSearchParamsFromUrl(url: string): FlightSearchData['searchParams'] | null {
    try {
      const urlObj = new URL(url, window.location.origin);
      const params = urlObj.searchParams;
      
      const origin = params.get('origin');
      const destination = params.get('destination');
      const departureDate = params.get('departureDate');
      const returnDate = params.get('returnDate') || undefined;
      const passengers = parseInt(params.get('passengers') || '1');
      const cabinClass = params.get('cabinClass') || 'economy';
      const currency = params.get('currency') || 'USD';
      const maxConnections = params.get('maxConnections') ? parseInt(params.get('maxConnections')!) : 1;
      
      if (!origin || !destination || !departureDate) {
        return null;
      }
      
      return {
        origin,
        destination,
        departureDate,
        returnDate,
        passengers,
        cabinClass,
        currency,
        maxConnections
      };
    } catch (error) {
      console.error('Error extracting search params from URL:', error);
      return null;
    }
  }

  /**
   * Get search ID from URL
   */
  getSearchIdFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url, window.location.origin);
      return urlObj.searchParams.get('searchId');
    } catch (error) {
      console.error('Error getting search ID from URL:', error);
      return null;
    }
  }

  /**
   * Check if offers are expired based on Duffel API timing
   */
  private isOffersExpired(timing: FlightSearchData['timing']): boolean {
    if (!timing.expires_at) return false;
    
    const now = new Date().getTime();
    const expiryTime = new Date(timing.expires_at).getTime();
    const bufferTime = expiryTime - this.OFFER_EXPIRY_BUFFER;
    
    return now >= bufferTime;
  }

  /**
   * Check if search data is stale based on search timestamp and supplier timeout
   */
  private isSearchDataStale(searchData: FlightSearchData): boolean {
    const now = Date.now();
    const searchAge = now - searchData.searchTimestamp;
    
    // Use supplier timeout if available, otherwise default to 30 minutes
    const supplierTimeout = searchData.timing.supplier_timeout || 20000; // 20 seconds default
    const maxAge = Math.max(supplierTimeout * this.SUPPLIER_TIMEOUT_MULTIPLIER, this.MAX_CACHE_AGE);
    
    return searchAge > maxAge;
  }

  /**
   * Save flight search data to LocalForage
   */
  async saveFlightData(searchParams: FlightSearchData['searchParams'], searchResults: any, timing: any, selectedOfferId?: string, userProgress?: FlightSearchData['userProgress']): Promise<string> {
    const searchId = this.generateSearchId(searchParams);
    const searchData: FlightSearchData = {
      searchParams,
      searchResults,
      timing,
      searchTimestamp: Date.now(),
      selectedOfferId,
      userProgress: userProgress || { currentStep: 'search' },
      searchId
    };

    try {
      // Clean up old cache entries before saving
      await this.cleanupCache();
      
      // Save the data using LocalForage
      await this.store.setItem(`${this.CACHE_PREFIX}${searchId}`, searchData);
      console.log('Flight data saved to LocalForage with search ID:', searchId);
      return searchId;
    } catch (error) {
      console.error('Error saving flight data to LocalForage:', error);
      
      // If still having issues, try aggressive cleanup
      try {
        await this.aggressiveCleanup();
        await this.store.setItem(`${this.CACHE_PREFIX}${searchId}`, searchData);
        console.log('Flight data saved after aggressive cleanup with search ID:', searchId);
        return searchId;
      } catch (retryError) {
        console.error('Still cannot save after cleanup:', retryError);
        return searchId;
      }
    }
  }

  /**
   * Load flight search data from LocalForage by search ID
   */
  async loadFlightDataBySearchId(searchId: string): Promise<FlightSearchData | null> {
    try {
      const cached = await this.store.getItem(`${this.CACHE_PREFIX}${searchId}`);
      if (!cached) return null;

      const searchData: FlightSearchData = cached as FlightSearchData;
      
      // Check if offers are expired
      if (this.isOffersExpired(searchData.timing)) {
        console.log('Offers expired, removing from cache:', searchId);
        await this.removeFlightDataBySearchId(searchId);
        return null;
      }

      // Check if search data is stale
      if (this.isSearchDataStale(searchData)) {
        console.log('Search data is stale, marking for refresh:', searchId);
        searchData.needsRefresh = true;
      }

      return searchData;
    } catch (error) {
      console.error('Error loading flight data from LocalForage:', error);
      return null;
    }
  }

  /**
   * Load flight search data from LocalForage by search parameters
   */
  async loadFlightData(searchParams: FlightSearchData['searchParams']): Promise<FlightSearchData | null> {
    const searchId = this.generateSearchId(searchParams);
    return await this.loadFlightDataBySearchId(searchId);
  }

  /**
   * Update user progress in cached data
   */
  async updateUserProgress(searchParams: FlightSearchData['searchParams'], progress: Partial<FlightSearchData['userProgress']>): Promise<void> {
    const searchId = this.generateSearchId(searchParams);
    const searchData = await this.loadFlightDataBySearchId(searchId);
    if (!searchData) return;

    searchData.userProgress = { ...searchData.userProgress, ...progress };
    await this.saveFlightData(
      searchData.searchParams,
      searchData.searchResults,
      searchData.timing,
      searchData.selectedOfferId,
      searchData.userProgress
    );
  }

  /**
   * Update selected offer in cached data
   */
  async updateSelectedOffer(searchParams: FlightSearchData['searchParams'], offerId: string): Promise<void> {
    const searchId = this.generateSearchId(searchParams);
    const searchData = await this.loadFlightDataBySearchId(searchId);
    if (!searchData) return;

    searchData.selectedOfferId = offerId;
    await this.saveFlightData(
      searchData.searchParams,
      searchData.searchResults,
      searchData.timing,
      offerId,
      searchData.userProgress
    );
  }

  /**
   * Remove flight data from cache by search ID
   */
  async removeFlightDataBySearchId(searchId: string): Promise<void> {
    try {
      await this.store.removeItem(`${this.CACHE_PREFIX}${searchId}`);
      console.log('Flight data removed from LocalForage:', searchId);
    } catch (error) {
      console.error('Error removing flight data from LocalForage:', error);
    }
  }

  /**
   * Remove flight data from cache
   */
  async removeFlightData(searchParams: FlightSearchData['searchParams']): Promise<void> {
    const searchId = this.generateSearchId(searchParams);
    await this.removeFlightDataBySearchId(searchId);
  }

  /**
   * Get all cached flight searches
   */
  async getAllCachedSearches(): Promise<FlightDataCache> {
    const cache: FlightDataCache = {};
    
    try {
      const keys = await this.store.keys();
      for (const key of keys) {
        if (key.startsWith(this.CACHE_PREFIX)) {
          const cached = await this.store.getItem(key);
          if (cached) {
            const searchData: FlightSearchData = cached as FlightSearchData;
            const searchId = key.replace(this.CACHE_PREFIX, '');
            cache[searchId] = searchData;
          }
        }
      }
    } catch (error) {
      console.error('Error getting cached searches:', error);
    }

    return cache;
  }

  /**
   * Clean up expired and stale cache entries
   */
  async cleanupCache(): Promise<void> {
    const cachedSearches = await this.getAllCachedSearches();
    
    for (const [searchId, searchData] of Object.entries(cachedSearches)) {
      const isExpired = this.isOffersExpired(searchData.timing);
      const isStale = this.isSearchDataStale(searchData);
      
      if (isExpired || isStale) {
        await this.removeFlightDataBySearchId(searchId);
        console.log('Cleaned up expired/stale cache entry:', searchId);
      }
    }
  }

  /**
   * Aggressive cleanup to free up storage space
   */
  async aggressiveCleanup(): Promise<void> {
    const cachedSearches = await this.getAllCachedSearches();
    
    // Sort by timestamp (oldest first)
    const sortedSearches = Object.entries(cachedSearches)
      .sort(([, a], [, b]) => a.searchTimestamp - b.searchTimestamp);
    
    // Keep only the 5 most recent searches
    const searchesToKeep = sortedSearches.slice(-5);
    const searchesToRemove = sortedSearches.slice(0, -5);
    
    for (const [searchId] of searchesToRemove) {
      await this.removeFlightDataBySearchId(searchId);
      console.log('Aggressively cleaned up cache entry:', searchId);
    }
    
    console.log(`Aggressive cleanup: Kept ${searchesToKeep.length} recent searches, removed ${searchesToRemove.length} old searches`);
  }

  /**
   * Check localStorage usage and log statistics
   */
  async logStorageStats(): Promise<void> {
    try {
      const cachedSearches = await this.getAllCachedSearches();
      const totalKeys = Object.keys(cachedSearches).length;
      
      let totalSize = 0;
      for (const [searchId, searchData] of Object.entries(cachedSearches)) {
        const size = JSON.stringify(searchData).length;
        totalSize += size;
        console.log(`Search ${searchId}: ${size} bytes`);
      }
      
      console.log(`Storage stats: ${totalKeys} searches, ${totalSize} total bytes`);
      console.log(`Current driver: ${this.store.driver()}`);
      
      // Test storage capacity
      try {
        await this.store.setItem('test_quota_check', 'test');
        await this.store.removeItem('test_quota_check');
        console.log('LocalForage quota check: OK');
      } catch (error) {
        console.error('LocalForage quota check: FAILED', error);
      }
    } catch (error) {
      console.error('Error checking storage stats:', error);
    }
  }

  /**
   * Check if data needs refresh (expired or stale)
   */
  async needsRefresh(searchParams: FlightSearchData['searchParams']): Promise<{ needsRefresh: boolean; reason: 'expired' | 'stale' | null }> {
    const searchData = await this.loadFlightData(searchParams);
    if (!searchData) {
      return { needsRefresh: true, reason: null };
    }

    if (this.isOffersExpired(searchData.timing)) {
      return { needsRefresh: true, reason: 'expired' };
    }

    if (this.isSearchDataStale(searchData)) {
      return { needsRefresh: true, reason: 'stale' };
    }

    return { needsRefresh: false, reason: null };
  }

  /**
   * Get time remaining until offers expire
   */
  async getTimeRemaining(searchParams: FlightSearchData['searchParams']): Promise<number> {
    const searchData = await this.loadFlightData(searchParams);
    if (!searchData || !searchData.timing.expires_at) return 0;

    const now = new Date().getTime();
    const expiryTime = new Date(searchData.timing.expires_at).getTime();
    return Math.max(0, expiryTime - now);
  }

  /**
   * Format time remaining as MM:SS
   */
  formatTimeRemaining(milliseconds: number): string {
    if (milliseconds <= 0) return '00:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Export singleton instance
export const flightDataPersistence = new FlightDataPersistence(); 