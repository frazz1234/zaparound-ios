import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FlightFilters, FlightFilters as FlightFiltersType } from '@/components/booking/FlightFilters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plane, Clock, Luggage, Wifi, Coffee, ArrowRight, ArrowDown, User, Briefcase, CheckCircle, XCircle, Info, ShieldCheck, Ticket, Calendar as CalendarIcon, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { flightDataPersistence, FlightSearchData } from '@/utils/flightDataPersistence';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import FlightBookingLoadingDialog from '@/components/FlightBookingLoadingDialog';
import { Menubar } from '@/components/ui/menubar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import AirportSelector from '@/components/booking/AirportSelector';

interface FlightOffer {
  id: string;
  total_amount: string;
  total_currency: string;
  base_amount?: string;
  base_currency?: string;
  conditions: {
    change_before_departure?: {
      allowed: boolean;
      penalty_amount: string | null;
      penalty_currency: string | null;
    } | null;
    refund_before_departure?: {
      allowed: boolean;
      penalty_amount: string | null;
      penalty_currency: string | null;
    } | null;
  };
  slices: Array<{
    segments: Array<{
      origin: {
        iata_code: string;
        name: string;
      };
      destination: {
        iata_code: string;
        name: string;
      };
      departing_at: string;
      arriving_at: string;
      marketing_carrier: {
        name: string;
        iata_code: string;
      };
      operating_carrier: {
        name: string;
        iata_code: string;
        logo_symbol_url?: string;
      };
      origin_terminal?: string;
      destination_terminal?: string;
      aircraft?: {
        iata_code: string;
        name: string;
        id: string;
      };
    }>;
    conditions?: {
      change_before_departure?: {
        allowed: boolean;
        penalty_amount: string | null;
        penalty_currency: string | null;
      } | null;
    };
  }>;
  passengers: Array<{
    id: string;
    title: string;
    given_name: string;
    family_name: string;
    email: string;
    phone_number: string;
    gender: string;
    born_on: string;
  }>;
  // Add these for converted price display
  converted_amount?: string;
  converted_currency?: string;
}

interface BookingFormData {
  id: string;
  title: string;
  given_name: string;
  family_name: string;
  email: string;
  phone_number: string;
  gender: string;
  born_on: string;
}

export function FlightBooking() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Search state
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [tripType, setTripType] = useState('roundtrip');
  const [passengerCounts, setPassengerCounts] = useState({
    adults: 1,
    children: 0,
    infantsInSeat: 0,
    infantsOnLap: 0
  });
  const [cabinClass, setCabinClass] = useState('economy');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  
  // Popover state management
  const [isDepartureDateOpen, setIsDepartureDateOpen] = useState(false);
  const [isReturnDateOpen, setIsReturnDateOpen] = useState(false);
  
  // Results state
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [lastSearchParams, setLastSearchParams] = useState<string>('');
  const [searchTimestamp, setSearchTimestamp] = useState<number>(0);
  
  // UI state
  const [selectedOffer, setSelectedOffer] = useState<FlightOffer | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingFormData, setBookingFormData] = useState<BookingFormData>({
    id: `pas_${Math.random().toString(36).substr(2, 9)}`,
    title: '',
    given_name: '',
    family_name: '',
    email: '',
    phone_number: '',
    gender: '',
    born_on: ''
  });
  const [isBooking, setIsBooking] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null);
  const [currency, setCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({});
  const [showCurrencyNotice, setShowCurrencyNotice] = useState(false);
  const [convertedOffers, setConvertedOffers] = useState<any>(null);
  const lastRatesFetch = useRef<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const OFFERS_PER_PAGE = 10;
  const offersRef = useRef<HTMLDivElement | null>(null);
  // Track the last processed search parameters to prevent duplicate auto-searches
  const lastAutoSearchParams = useRef<string>('');
  const [currentSort, setCurrentSort] = useState<'best' | 'direct' | 'cheapest' | 'fastest'>('best');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [activeFilters, setActiveFilters] = useState<FlightFiltersType>({
    airlines: [],
    stops: 'any',
    bags: 'any',
    priceRange: [0, 5000],
    connectingAirports: [],
    duration: [0, 24],
  });
  
  // Timing state
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [needsRefresh, setNeedsRefresh] = useState<boolean>(false);
  const [refreshReason, setRefreshReason] = useState<'expired' | 'stale' | null>(null);
  const [searchTiming, setSearchTiming] = useState<{
    search_started_at: string;
    supplier_timeout: number;
    expires_at: string | null;
    created_at: string | null;
  } | null>(null);


  // Handle departure date selection
  const handleDepartureDateSelect = (date: Date | undefined) => {
    setDepartureDate(date);
    if (date) {
      // Close departure date popover
      setIsDepartureDateOpen(false);
      
      // If it's a round trip, automatically open return date popover
      if (tripType === 'roundtrip') {
        setIsReturnDateOpen(true);
      }
    }
  };

  // Handle return date selection
  const handleReturnDateSelect = (date: Date | undefined) => {
    setReturnDate(date);
    if (date) {
      // Close return date popover
      setIsReturnDateOpen(false);
    }
  };

  // State management functions
  const getCurrentSearchParams = () => ({
    origin,
    destination,
    departureDate: departureDate?.toISOString().split('T')[0] || '',
    returnDate: returnDate?.toISOString().split('T')[0],
    passengers: passengerCounts.adults + passengerCounts.children + passengerCounts.infantsInSeat + passengerCounts.infantsOnLap,
    cabinClass,
    currency,
    maxConnections: 1
  });

  const saveSearchState = async (results: any) => {
    const searchParams = getCurrentSearchParams();
    const searchId = await flightDataPersistence.saveFlightData(
      searchParams,
      results,
      results.timing || null,
      selectedOffer?.id,
      { currentStep: 'search' }
    );
    setSearchTimestamp(Date.now());
    
    // Update URL with search ID for better caching
    const searchUrl = flightDataPersistence.createSearchUrl(searchParams, i18n.language);
    window.history.replaceState({}, '', searchUrl);
    
    console.log('Search saved with ID:', searchId);
    console.log('Search URL created:', searchUrl);
  };

  const loadSearchState = async (): Promise<FlightSearchData | null> => {
    const searchParams = getCurrentSearchParams();
    return await flightDataPersistence.loadFlightData(searchParams);
  };

  const restoreSearchState = async () => {
    // First try to get search ID from URL
    const searchIdFromUrl = flightDataPersistence.getSearchIdFromUrl(window.location.href);
    console.log('restoreSearchState - Search ID from URL:', searchIdFromUrl);
    
    if (searchIdFromUrl) {
      // Try to load data by search ID
      const searchData = await flightDataPersistence.loadFlightDataBySearchId(searchIdFromUrl);
      console.log('restoreSearchState - Loaded data by search ID:', searchData);
      if (searchData) {
        await restoreSearchData(searchData);
        return;
      }
    }
    
    // Fallback to loading by search parameters
    const searchData = await loadSearchState();
    console.log('restoreSearchState - Loaded data by search params:', searchData);
    if (searchData) {
      await restoreSearchData(searchData);
    }
  };

  const restoreSearchData = async (searchData: FlightSearchData) => {
    // Check if data needs refresh
    const refreshCheck = await flightDataPersistence.needsRefresh(searchData.searchParams);
    
    if (refreshCheck.needsRefresh) {
      setNeedsRefresh(true);
      setRefreshReason(refreshCheck.reason);
      
      // Show warning about expired/stale data
      const message = refreshCheck.reason === 'expired' 
        ? 'Flight offers have expired. Refreshing search...'
        : 'Flight data is stale. Refreshing search...';
      
      toast({
        title: 'Data Refresh Required',
        description: message,
        duration: 3000,
      });
      
      // Auto-refresh in background
      setIsRefreshing(true);
      handleSearch(true);
    } else {
      // Data is fresh, restore it
      setSearchResults(searchData.searchResults);
      setSearchTimestamp(searchData.searchTimestamp);
      setSearchTiming(searchData.timing);
      setSelectedOffer(searchData.selectedOfferId ? 
        searchData.searchResults.data.offers.find((o: any) => o.id === searchData.selectedOfferId) : null
      );
      
      // Restore form state from cached data
      const params = searchData.searchParams;
      setOrigin(params.origin);
      setDestination(params.destination);
      if (params.departureDate) {
        setDepartureDate(new Date(params.departureDate));
      }
      if (params.returnDate) {
        setReturnDate(new Date(params.returnDate));
      }
      setCabinClass(params.cabinClass);
      setCurrency(params.currency);
      
      // Restore passenger counts (simplified - assumes all passengers are adults)
      setPassengerCounts({
        adults: params.passengers,
        children: 0,
        infantsInSeat: 0,
        infantsOnLap: 0
      });
      
    }
  };

  const toggleCard = (offerId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(offerId)) {
      newExpanded.delete(offerId);
    } else {
      newExpanded.add(offerId);
    }
    setExpandedCards(newExpanded);
  };

  const handleFiltersChange = (filters: FlightFiltersType) => {
    setActiveFilters(filters);
  };

  // Helper function to get duration in hours
  const getDurationInHours = (segments: any[]) => {
    if (!segments.length) return 0;
    
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    
    const departure = new Date(firstSegment.departing_at);
    const arrival = new Date(lastSegment.arriving_at);
    
    return (arrival.getTime() - departure.getTime()) / (1000 * 60 * 60);
  };

  // Filter flight offers based on active filters
  const getFilteredOffers = () => {
    const offersToFilter = convertedOffers || (searchResults?.data?.offers || []);
    if (!offersToFilter.length) return [];

    return offersToFilter.filter(offer => {
      // Filter by airlines
      if (activeFilters.airlines.length > 0) {
        const offerAirline = offer.slices[0]?.segments[0]?.marketing_carrier?.iata_code;
        if (!offerAirline || !activeFilters.airlines.includes(offerAirline)) {
          return false;
        }
      }

      // Filter by stops
      if (activeFilters.stops !== 'any') {
        const totalStops = offer.slices.reduce((total, slice) => {
          return total + Math.max(0, slice.segments.length - 1);
        }, 0);

        switch (activeFilters.stops) {
          case 'nonstop':
            if (totalStops > 0) return false;
            break;
          case '1_or_fewer':
            if (totalStops > 1) return false;
            break;
          case '2_or_fewer':
            if (totalStops > 2) return false;
            break;
        }
      }

      // Filter by price range
      const offerPrice = offer.converted_amount 
        ? parseFloat(offer.converted_amount) 
        : parseFloat(offer.total_amount);
      
      if (offerPrice < activeFilters.priceRange[0] || offerPrice > activeFilters.priceRange[1]) {
        return false;
      }

      // Filter by duration
      const totalDuration = offer.slices.reduce((total, slice) => {
        const sliceDuration = getDurationInHours(slice.segments);
        return total + sliceDuration;
      }, 0);

      if (totalDuration < activeFilters.duration[0] || totalDuration > activeFilters.duration[1]) {
        return false;
      }

      // Filter by connecting airports
      if (activeFilters.connectingAirports.length > 0) {
        const offerConnectingAirports = offer.slices.flatMap(slice => 
          slice.segments.slice(1, -1).map(segment => segment.origin?.iata_code)
        ).filter(Boolean);

        const hasMatchingAirport = offerConnectingAirports.some(airport => 
          activeFilters.connectingAirports.includes(airport!)
        );

        if (!hasMatchingAirport) return false;
      }

      return true;
    });
  };

  // Calculate total passengers
  const totalPassengers = passengerCounts.adults + passengerCounts.children + passengerCounts.infantsInSeat + passengerCounts.infantsOnLap;

  // Update passenger count with validation
  const updatePassengerCount = (type: keyof typeof passengerCounts, increment: number) => {
    const newCounts = { ...passengerCounts };
    const newValue = newCounts[type] + increment;
    
    // Validation rules
    if (type === 'adults') {
      if (newValue >= 1 && newValue <= 9) {
        newCounts[type] = newValue;
      }
    } else if (type === 'children') {
      if (newValue >= 0 && newValue <= 8 && totalPassengers + increment <= 9) {
        newCounts[type] = newValue;
      }
    } else if (type === 'infantsInSeat') {
      if (newValue >= 0 && newValue <= 4 && totalPassengers + increment <= 9) {
        newCounts[type] = newValue;
      }
    } else if (type === 'infantsOnLap') {
      if (newValue >= 0 && newValue <= 4 && totalPassengers + increment <= 9) {
        newCounts[type] = newValue;
      }
    }
    
    setPassengerCounts(newCounts);
  };

  // Fetch exchange rates if needed
  const fetchExchangeRates = async (base: string) => {
    if (exchangeRates[base] && Date.now() - lastRatesFetch.current < 1000 * 60 * 5) return exchangeRates[base]; // 5 min cache
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      const data = await response.json();
      if (data.result === 'success') {
        setExchangeRates((prev) => ({ ...prev, [base]: data.rates }));
        lastRatesFetch.current = Date.now();
        return data.rates;
      } else {
        throw new Error('Invalid response from exchange rate API');
      }
    } catch (e) {
      console.error('Error fetching exchange rates:', e);
      // Keep existing rates if available
      return exchangeRates[base];
    }
  };

  // Format currency amount with proper locale
  const formatAmount = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  };

  // Calculate time remaining until offer expires
  const calculateTimeRemaining = (expiresAt: string | null, searchStartedAt: string | null) => {
    if (!expiresAt) return 0;
    
    const now = new Date().getTime();
    const expiryTime = new Date(expiresAt).getTime();
    const remaining = Math.max(0, expiryTime - now);
    
    return remaining;
  };

  // Format time remaining as MM:SS
  const formatTimeRemaining = (milliseconds: number) => {
    if (milliseconds <= 0) return '00:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // When searchResults change, check for currency mismatch and convert if needed
  useEffect(() => {
    if (!searchResults?.data?.offers || !searchResults.data.offers.length) {
      setShowCurrencyNotice(false);
      setConvertedOffers(null);
      return;
    }
    
    // Set timing information from search results
    if (searchResults.timing) {
      setSearchTiming(searchResults.timing);
    }
    
    // Reset stale state for fresh search results
    if (searchResults?.data?.offers && searchResults.data.offers.length > 0) {
      setIsStale(false);
      setNeedsRefresh(false);
      setRefreshReason(null);
    }
    
    const offerCurrency = searchResults.data.offers[0].total_currency;
    if (offerCurrency !== currency) {
      setShowCurrencyNotice(true);
      // Convert offers when currency changes
      const convertOffers = async () => {
        const rates = await fetchExchangeRates(offerCurrency);
        if (rates && rates[currency]) {
          // Convert all offers for display
          const offers = searchResults.data.offers.map((offer: any) => ({
            ...offer,
            converted_amount: (parseFloat(offer.total_amount) * rates[currency]).toFixed(2),
            converted_currency: currency
          }));
          setConvertedOffers(offers);
        } else {
          setConvertedOffers(null);
        }
      };
      convertOffers();
    } else {
      setShowCurrencyNotice(false);
      setConvertedOffers(null);
    }
    
    // Also fetch exchange rates for penalty currencies if they exist
    const fetchPenaltyCurrencyRates = async () => {
      const penaltyCurrencies = new Set<string>();
      
      searchResults.data.offers.forEach((offer: any) => {
        if (offer.conditions?.change_before_departure?.penalty_currency) {
          penaltyCurrencies.add(offer.conditions.change_before_departure.penalty_currency);
        }
        if (offer.conditions?.refund_before_departure?.penalty_currency) {
          penaltyCurrencies.add(offer.conditions.refund_before_departure.penalty_currency);
        }
      });
      
      // Fetch rates for each unique penalty currency
      for (const penaltyCurrency of penaltyCurrencies) {
        if (penaltyCurrency !== currency && !exchangeRates[penaltyCurrency]) {
          await fetchExchangeRates(penaltyCurrency);
        }
      }
    };
    
    fetchPenaltyCurrencyRates();
    // eslint-disable-next-line
  }, [searchResults]); // Only depend on searchResults changes

  // Handle currency changes when search results already exist
  useEffect(() => {
    if (!searchResults?.data?.offers || !searchResults.data.offers.length) {
      return;
    }
    const offerCurrency = searchResults.data.offers[0].total_currency;
    if (offerCurrency !== currency) {
      setShowCurrencyNotice(true);
      // Convert offers when currency changes
      const convertOffers = async () => {
        const rates = await fetchExchangeRates(offerCurrency);
        if (rates && rates[currency]) {
          // Convert all offers for display
          const offers = searchResults.data.offers.map((offer: any) => ({
            ...offer,
            converted_amount: (parseFloat(offer.total_amount) * rates[currency]).toFixed(2),
            converted_currency: currency
          }));
          setConvertedOffers(offers);
        } else {
          setConvertedOffers(null);
        }
      };
      convertOffers();
    } else {
      setShowCurrencyNotice(false);
      setConvertedOffers(null);
    }
    
    // Also fetch exchange rates for penalty currencies when currency changes
    const fetchPenaltyCurrencyRates = async () => {
      const penaltyCurrencies = new Set<string>();
      
      searchResults.data.offers.forEach((offer: any) => {
        if (offer.conditions?.change_before_departure?.penalty_currency) {
          penaltyCurrencies.add(offer.conditions.change_before_departure.penalty_currency);
        }
        if (offer.conditions?.refund_before_departure?.penalty_currency) {
          penaltyCurrencies.add(offer.conditions.refund_before_departure.penalty_currency);
        }
      });
      
      // Fetch rates for each unique penalty currency
      for (const penaltyCurrency of penaltyCurrencies) {
        if (penaltyCurrency !== currency) {
          await fetchExchangeRates(penaltyCurrency);
        }
      }
    };
    
    fetchPenaltyCurrencyRates();
  }, [currency]); // Only depend on currency changes

  // Handle countdown timer for offer expiration
  useEffect(() => {
    const updateTimer = async () => {
      const searchParams = getCurrentSearchParams();
      const timeRemaining = await flightDataPersistence.getTimeRemaining(searchParams);
      
      if (timeRemaining > 0) {
        setTimeRemaining(timeRemaining);
        setIsExpired(false);
        
        // Auto-refresh logic: If less than 2 minutes remaining, suggest refresh
        if (timeRemaining < 2 * 60 * 1000 && !isRefreshing && !isExpired) {
          toast({
            title: "Offers Expiring Soon",
            description: "Flight offers will expire in less than 2 minutes. Consider refreshing to get updated prices.",
            duration: 5000,
          });
        }
      } else {
        setTimeRemaining(0);
        setIsExpired(true);
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [searchTiming, searchResults]);

  // Check for stale offers based on search timestamp
  useEffect(() => {
    if (searchTimestamp > 0) {
      const now = Date.now();
      const searchAge = now - searchTimestamp;
      const maxAge = 30 * 60 * 1000; // 30 minutes
      setIsStale(searchAge > maxAge);
    } else {
      // Only mark as stale if we have search results but no timestamp AND no timing info
      // This indicates truly old cached data without proper timing information
      setIsStale(
        searchResults?.data?.offers && 
        searchResults.data.offers.length > 0 && 
        !searchTiming?.expires_at &&
        !searchTiming?.search_started_at
      );
    }
  }, [searchTimestamp, searchResults, searchTiming]);

  // Handle URL search parameters and auto-search in a single effect
  useEffect(() => {
    const urlOrigin = searchParams.get('origin');
    const urlDestination = searchParams.get('destination');
    const urlDepartureDate = searchParams.get('departureDate');
    const urlReturnDate = searchParams.get('returnDate');
    const urlTripType = searchParams.get('tripType');
    const urlAdults = searchParams.get('adults');
    const urlChildren = searchParams.get('children');
    const urlInfantsInSeat = searchParams.get('infantsInSeat');
    const urlInfantsOnLap = searchParams.get('infantsOnLap');
    const urlCabinClass = searchParams.get('cabinClass');

    console.log('URL Parameters:', {
      urlOrigin,
      urlDestination,
      urlDepartureDate,
      urlCabinClass
    });

    // Set values from URL parameters
    if (urlOrigin) setOrigin(urlOrigin);
    if (urlDestination) setDestination(urlDestination);
    if (urlDepartureDate) setDepartureDate(new Date(urlDepartureDate));
    if (urlReturnDate) setReturnDate(new Date(urlReturnDate));
    if (urlTripType) setTripType(urlTripType);
    if (urlCabinClass) setCabinClass(urlCabinClass);
    
    if (urlAdults) setPassengerCounts(prev => ({ ...prev, adults: parseInt(urlAdults) }));
    if (urlChildren) setPassengerCounts(prev => ({ ...prev, children: parseInt(urlChildren) }));
    if (urlInfantsInSeat) setPassengerCounts(prev => ({ ...prev, infantsInSeat: parseInt(urlInfantsInSeat) }));
    if (urlInfantsOnLap) setPassengerCounts(prev => ({ ...prev, infantsOnLap: parseInt(urlInfantsOnLap) }));

    // Check if we have a search ID in the URL - if so, try to restore from cache first
    const searchIdFromUrl = flightDataPersistence.getSearchIdFromUrl(window.location.href);
    if (searchIdFromUrl) {
      console.log('Found search ID in URL, attempting to restore from cache:', searchIdFromUrl);
      restoreSearchState();
      return;
    }

    // If no URL parameters, try to restore from cache
    if (!urlOrigin && !urlDestination) {
      restoreSearchState();
      return;
    }

    // Create a unique key for the current search parameters
    const currentParamsKey = `${urlOrigin}-${urlDestination}-${urlDepartureDate}-${urlReturnDate}-${urlAdults}-${urlChildren}-${urlInfantsInSeat}-${urlInfantsOnLap}-${urlCabinClass}`;

    // Auto-search if we have all required URL parameters and haven't already searched with these exact params
    if (urlOrigin && urlDestination && urlDepartureDate && urlCabinClass && 
        lastAutoSearchParams.current !== currentParamsKey) {
      
      console.log('Triggering auto-search with URL parameters');
      lastAutoSearchParams.current = currentParamsKey;
      
      // Format dates properly (same as regular search)
      const formattedDepartureDate = urlDepartureDate; // URL dates are already in YYYY-MM-DD format
      const formattedReturnDate = urlReturnDate || undefined;
      
      // Use the URL parameters directly for the search
      const searchRequest = {
        origin: urlOrigin.toUpperCase(),
        destination: urlDestination.toUpperCase(),
        departureDate: formattedDepartureDate,
        returnDate: formattedReturnDate,
        passengers: parseInt(urlAdults || '1') + 
                   parseInt(urlChildren || '0') + 
                   parseInt(urlInfantsInSeat || '0') + 
                   parseInt(urlInfantsOnLap || '0'),
        passengerTypes: {
          adults: parseInt(urlAdults || '1'),
          children: parseInt(urlChildren || '0'),
          infantsInSeat: parseInt(urlInfantsInSeat || '0'),
          infantsOnLap: parseInt(urlInfantsOnLap || '0')
        },
        cabinClass: urlCabinClass.toLowerCase(),
        maxConnections: 1,
        currency
      };

      console.log('Auto-search request:', searchRequest);

      // Perform the search directly
      const performSearch = async () => {
        try {
          console.log('Starting auto-search...');
          setIsLoading(true);
          
          console.log('Calling Supabase function with request:', searchRequest);
          const { data: searchResults, error } = await supabase.functions.invoke('duffel-search', {
            body: searchRequest
          });

          console.log('Supabase function response received');
          console.log('Error:', error);
          console.log('Data:', searchResults);

          if (error) {
            console.error('Supabase function error:', error);
            throw new Error(error.message || 'Failed to search for flights');
          }

          if (!searchResults) {
            console.error('No search results received from Supabase function');
            throw new Error('No search results received');
          }

          console.log('Auto-search completed successfully with results:', searchResults);
          setSearchResults(searchResults);
          saveSearchState(searchResults);
        } catch (error: any) {
          console.error('Error in auto-search:', error);
          console.error('Error stack:', error.stack);
          toast({
            title: "Search Failed",
            description: error.message || "Failed to search for flights. Please try again.",
            variant: "destructive",
          });
        } finally {
          console.log('Auto-search cleanup: setting loading to false');
          setIsLoading(false);
        }
      };

      // Execute search immediately since we already have deduplication
      performSearch();
    }
  }, [searchParams, currency]);

  // Reset page when new results come in
  useEffect(() => {
    setCurrentPage(1);
  }, [searchResults, convertedOffers]);

  const handleSearch = async (silent: boolean = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }

      // Validate inputs
      if (!origin || !destination || !departureDate || !cabinClass) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Format dates
      const formattedDepartureDate = departureDate.toISOString().split('T')[0];
      const formattedReturnDate = returnDate ? returnDate.toISOString().split('T')[0] : undefined;

      // Create search request
      const searchRequest = {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departureDate: formattedDepartureDate,
        returnDate: formattedReturnDate,
        passengers: totalPassengers,
        passengerTypes: {
          adults: passengerCounts.adults,
          children: passengerCounts.children,
          infantsInSeat: passengerCounts.infantsInSeat,
          infantsOnLap: passengerCounts.infantsOnLap
        },
        cabinClass: cabinClass.toLowerCase(),
        maxConnections: 1,
        currency,// Limit results to prevent memory issues
      };

      console.log('Sending search request:', searchRequest);

      const { data: searchResults, error } = await supabase.functions.invoke('duffel-search', {
        body: searchRequest
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to search for flights');
      }

      if (!searchResults) {
        throw new Error('No search results received');
      }

      console.log('Search results:', searchResults);
      setSearchResults(searchResults);
      saveSearchState(searchResults);
    } catch (error) {
      console.error('Error searching flights:', error);
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search for flights. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      // Log the incoming date string
     
      
      // Parse the ISO string
      const date = new Date(dateString);
      
      // Log the parsed date
     
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString);
        return 'N/A';
      }

      // Format with timezone consideration
      return format(date, 'HH:mm');
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'N/A';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Parse the ISO string
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString);
        return 'N/A';
      }

      // Format with timezone consideration
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Ensure it starts with 1 (US/Canada)
    const withCountryCode = cleaned.startsWith('1') ? cleaned : `1${cleaned}`;
    // Format as E.164 (e.g., +1234567890)
    return `+${withCountryCode}`;
  };

  const handleBooking = async () => {
    try {
      setIsBooking(true);

          // Check if offers have expired or are stale
    if (isExpired || isStale) {
      toast({
        title: "Offers Expired",
        description: "The flight offers have expired or are too old. Please refresh the search to get updated prices.",
        variant: "destructive",
      });
      return;
    }

      // Validate form data
      if (!bookingFormData.title || !bookingFormData.given_name || !bookingFormData.family_name || 
          !bookingFormData.email || !bookingFormData.phone_number || !bookingFormData.gender || !bookingFormData.born_on) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required passenger information",
          variant: "destructive",
        });
        return;
      }

      // Get the passenger ID from the offer
      if (!selectedOffer?.passengers?.[0]?.id) {
        throw new Error('No passenger ID found in the offer');
      }

      // Create booking request
      const bookingRequest = {
        offerId: selectedOffer?.id,
        passengers: [{
          ...bookingFormData,
          id: selectedOffer.passengers[0].id,
          gender: bookingFormData.gender === 'male' ? 'm' : 'f',
          phone_number: formatPhoneNumber(bookingFormData.phone_number),
          born_on: new Date(bookingFormData.born_on).toISOString().split('T')[0]
        }],
        payments: [{
          type: "balance",
          currency: currency || selectedOffer?.total_currency || "USD",
          amount: selectedOffer?.total_amount || "0"
        }]
      };

      const { data: bookingResults, error } = await supabase.functions.invoke('duffel-booking', {
        body: bookingRequest
      });

      if (error) {
        throw error;
      }

      // Store booking confirmation
      setBookingConfirmation(bookingResults);

      // Show success message
      toast({
        title: "Booking Successful",
        description: "Your flight has been booked successfully!",
      });

      // Reset form and state
      setShowBookingForm(false);
      setSelectedOffer(null);
      setSearchResults(null);
      setBookingFormData({
        id: '',
        title: '',
        given_name: '',
        family_name: '',
        email: '',
        phone_number: '',
        gender: '',
        born_on: ''
      });

    } catch (error) {
      console.error('Error booking flight:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book the flight",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const renderBookingForm = () => {
    if (!showBookingForm || !selectedOffer) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-semibold mb-4">Passenger Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Select 
                value={bookingFormData.title} 
                onValueChange={(value) => setBookingFormData({ ...bookingFormData, title: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mr">Mr</SelectItem>
                  <SelectItem value="mrs">Mrs</SelectItem>
                  <SelectItem value="ms">Ms</SelectItem>
                  <SelectItem value="dr">Dr</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">First Name</label>
              <Input
                value={bookingFormData.given_name}
                onChange={(e) => setBookingFormData({ ...bookingFormData, given_name: e.target.value })}
                placeholder="Enter first name"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Last Name</label>
              <Input
                value={bookingFormData.family_name}
                onChange={(e) => setBookingFormData({ ...bookingFormData, family_name: e.target.value })}
                placeholder="Enter last name"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={bookingFormData.email}
                onChange={(e) => setBookingFormData({ ...bookingFormData, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <div className="flex gap-2">
                <Select 
                  value={bookingFormData.phone_number.split('+')[1]?.substring(0, 2) || '1'} 
                  onValueChange={(value) => {
                    const currentNumber = bookingFormData.phone_number.replace(/\D/g, '');
                    const newNumber = currentNumber.length > 2 ? currentNumber.substring(2) : '';
                    setBookingFormData({ 
                      ...bookingFormData, 
                      phone_number: `+${value}${newNumber}`
                    });
                  }}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="+1" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">+1 (US/CA)</SelectItem>
                    <SelectItem value="44">+44 (UK)</SelectItem>
                    <SelectItem value="33">+33 (FR)</SelectItem>
                    <SelectItem value="49">+49 (DE)</SelectItem>
                    <SelectItem value="61">+61 (AU)</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  value={bookingFormData.phone_number.replace(/\D/g, '').substring(2)}
                  onChange={(e) => {
                    const countryCode = bookingFormData.phone_number.split('+')[1]?.substring(0, 2) || '1';
                    const newNumber = e.target.value.replace(/\D/g, '');
                    if (newNumber.length <= 10) {
                      setBookingFormData({ 
                        ...bookingFormData, 
                        phone_number: `+${countryCode}${newNumber}`
                      });
                    }
                  }}
                  placeholder="Enter phone number"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter your phone number without spaces or special characters
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Gender</label>
              <Select 
                value={bookingFormData.gender} 
                onValueChange={(value) => setBookingFormData({ ...bookingFormData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Date of Birth</label>
              <Input
                type="date"
                value={bookingFormData.born_on}
                onChange={(e) => setBookingFormData({ ...bookingFormData, born_on: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowBookingForm(false)}
              disabled={isBooking}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#72ba87] hover:bg-[#61936f] text-white"
              onClick={handleBooking}
              disabled={isBooking}
            >
              {isBooking ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Booking...
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Add sorting functions
  const sortOffers = (offers: FlightOffer[], sortType: string) => {
    if (!offers || offers.length === 0) return offers;

    const sortedOffers = [...offers];

    switch (sortType) {
      case 'cheapest':
        return sortedOffers.sort((a, b) => {
          const priceA = parseFloat(a.converted_amount || a.total_amount);
          const priceB = parseFloat(b.converted_amount || b.total_amount);
          return priceA - priceB;
        });

      case 'fastest':
        return sortedOffers.sort((a, b) => {
          const getTotalDuration = (offer: FlightOffer) => {
            return offer.slices.reduce((total, slice) => {
              if (!slice.segments.length) return total;
              const start = new Date(slice.segments[0].departing_at);
              const end = new Date(slice.segments[slice.segments.length - 1].arriving_at);
              return total + (end.getTime() - start.getTime());
            }, 0);
          };
          return getTotalDuration(a) - getTotalDuration(b);
        });

      case 'direct':
        return sortedOffers.sort((a, b) => {
          const getTotalStops = (offer: FlightOffer) => {
            return offer.slices.reduce((total, slice) => {
              return total + Math.max(0, slice.segments.length - 1);
            }, 0);
          };
          return getTotalStops(a) - getTotalStops(b);
        });

      case 'best':
      default:
        // Best: combination of price, duration, and stops
        return sortedOffers.sort((a, b) => {
          const getScore = (offer: FlightOffer) => {
            const price = parseFloat(offer.converted_amount || offer.total_amount);
            const totalDuration = offer.slices.reduce((total, slice) => {
              if (!slice.segments.length) return total;
              const start = new Date(slice.segments[0].departing_at);
              const end = new Date(slice.segments[slice.segments.length - 1].arriving_at);
              return total + (end.getTime() - start.getTime());
            }, 0);
            const totalStops = offer.slices.reduce((total, slice) => {
              return total + Math.max(0, slice.segments.length - 1);
            }, 0);
            
            // Normalize values (price in hundreds, duration in hours, stops as is)
            const normalizedPrice = price / 100;
            const normalizedDuration = totalDuration / (1000 * 60 * 60); // Convert to hours
            const normalizedStops = totalStops;
            
            // Weighted score (lower is better)
            return normalizedPrice * 0.5 + normalizedDuration * 0.3 + normalizedStops * 0.2;
          };
          return getScore(a) - getScore(b);
        });
    }
  };

  const renderFlightOffers = () => {
    const offersToShowAll = convertedOffers || (searchResults?.data?.offers || []);
    if (!offersToShowAll.length) {
      console.log('No offers data available');
      return null;
    }
    
    // Apply filters first, then sort
    const filteredOffers = getFilteredOffers();
    const sortedOffers = sortOffers(filteredOffers, currentSort);
    
    // Filter out expired offers
    const validOffers = sortedOffers.filter(offer => {
      if (!searchTiming?.expires_at) return true; // No timing info, assume valid
      
      const now = new Date().getTime();
      const expiryTime = new Date(searchTiming.expires_at).getTime();
      const bufferTime = expiryTime - (5 * 60 * 1000); // 5 minutes buffer
      
      return now < bufferTime;
    });

    // Show warning if some offers are expired
    if (validOffers.length < sortedOffers.length) {
      const expiredCount = sortedOffers.length - validOffers.length;
      console.log(`${expiredCount} offers have expired and been filtered out`);
    }

    // If all offers are expired, show message
    if (validOffers.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">All Offers Have Expired</h3>
            <p className="text-red-600 mb-4">The flight offers have expired. Please refresh your search to get current prices.</p>
            <Button 
              onClick={() => handleSearch(false)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Refresh Search
            </Button>
          </div>
        </div>
      );
    }
    
    const totalPages = Math.ceil(validOffers.length / OFFERS_PER_PAGE);
    const startIdx = (currentPage - 1) * OFFERS_PER_PAGE;
    const endIdx = startIdx + OFFERS_PER_PAGE;
    const offersToShow = validOffers.slice(startIdx, endIdx);

    return (
      <div ref={offersRef} className="space-y-6">
        {offersToShow.map((offer: FlightOffer) => {
          if (!offer?.slices?.length) {
            console.log('Invalid offer structure:', offer);
            return null;
          }
          // Helper function to format penalty amount with currency conversion
          const formatPenalty = (amount: string | null, penaltyCurrency: string | null) => {
            if (amount === null || penaltyCurrency === null) return 'Unknown';
            
            // If the penalty currency matches the user's selected currency, show as is
            if (penaltyCurrency === currency) {
              return `${amount} ${penaltyCurrency}`;
            }
            
            // If we have exchange rates and the penalty currency is different, convert it
            if (exchangeRates[penaltyCurrency] && exchangeRates[penaltyCurrency][currency]) {
              const convertedAmount = (parseFloat(amount) * exchangeRates[penaltyCurrency][currency]).toFixed(2);
              return `${convertedAmount} ${currency}`;
            }
            
            // Fallback: show original amount with original currency
            return `${amount} ${penaltyCurrency}`;
          };
          // Helper function to get condition status
          const getConditionStatus = (condition: { allowed: boolean; penalty_amount: string | null; penalty_currency: string | null; } | null | undefined) => {
            if (!condition) return { text: 'Unknown', color: 'text-gray-500', icon: Info };
            if (!condition.allowed) return { text: 'Not allowed', color: 'text-red-500', icon: XCircle };
            if (condition.penalty_amount === '0.00') return { text: 'Free', color: 'text-green-500', icon: CheckCircle };
            return {
              text: `Fee: ${formatPenalty(condition.penalty_amount, condition.penalty_currency)}`,
              color: 'text-yellow-500',
              icon: Info
            };
          };
          // Calculate total duration
          const getDuration = (segments: any[]) => {
            if (!segments.length) return '';
            const start = new Date(segments[0].departing_at);
            const end = new Date(segments[segments.length - 1].arriving_at);
            const diff = (end.getTime() - start.getTime()) / 1000 / 60; // minutes
            const h = Math.floor(diff / 60);
            const m = Math.round(diff % 60);
            return `${h}h${m > 0 ? ` ${m}m` : ''}`;
          };
          // Count stops
          const getStops = (segments: any[]) => Math.max(0, segments.length - 1);

          // Check if offer is close to expiring
          const isCloseToExpiring = () => {
            if (!searchTiming?.expires_at) return false;
            const now = new Date().getTime();
            const expiryTime = new Date(searchTiming.expires_at).getTime();
            const timeUntilExpiry = expiryTime - now;
            return timeUntilExpiry < (10 * 60 * 1000); // Less than 10 minutes
          };

          // Main card
          return (
            <Collapsible key={offer.id} open={expandedCards.has(offer.id)} onOpenChange={() => toggleCard(offer.id)}>
              <Card className={`overflow-hidden border rounded-2xl shadow-md bg-white ${
                isCloseToExpiring() 
                  ? 'border-orange-300 bg-orange-50' 
                  : 'border-[#e5e5e5]'
              }`}>
                <CollapsibleTrigger asChild>
                  <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                    {/* Compact View */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Airline Logo */}
                        <div className="flex items-center gap-3">
                          {offer.slices[0]?.segments[0]?.operating_carrier?.logo_symbol_url ? (
                            <img
                              src={offer.slices[0].segments[0].operating_carrier.logo_symbol_url}
                              alt={offer.slices[0].segments[0].operating_carrier.name + ' logo'}
                              className="w-8 h-8 object-contain rounded-full border border-[#e5e5e5] bg-white shadow-sm"
                              loading="lazy"
                              onError={e => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#f3f3f3] flex items-center justify-center">
                              <Plane className="w-4 h-4 text-[#61936f]" />
                            </div>
                          )}
                        </div>
                        
                        {/* Flight Times and Route */}
                        <div className="flex items-center gap-3 flex-1">
                          <div className="text-center">
                            <div className="font-bold text-lg text-[#1d1d1e]">
                              {formatTime(offer.slices[0]?.segments[0]?.departing_at)}
                            </div>
                            <div className="text-xs text-[#62626a]">
                              {offer.slices[0]?.segments[0]?.origin?.iata_code}
                            </div>
                          </div>
                          
                          {/* Expiry Warning Badge */}
                          {isCloseToExpiring() && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                              <Clock className="h-3 w-3" />
                              <span>Expires Soon</span>
                            </div>
                          )}
                          
                          <div className="flex flex-col items-center">
                            <div className="text-xs text-[#62626a] font-medium">
                              {getDuration(offer.slices[0]?.segments)}
                            </div>
                            <div className="flex items-center gap-1">
                              {getStops(offer.slices[0]?.segments) === 0 ? (
                                <span className="text-xs text-[#61936f]">Nonstop</span>
                              ) : (
                                <span className="text-xs text-[#eab308]">{getStops(offer.slices[0]?.segments)} stop{getStops(offer.slices[0]?.segments) > 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="font-bold text-lg text-[#1d1d1e]">
                              {formatTime(offer.slices[0]?.segments[offer.slices[0]?.segments.length - 1]?.arriving_at)}
                            </div>
                            <div className="text-xs text-[#62626a]">
                              {offer.slices[0]?.segments[offer.slices[0]?.segments.length - 1]?.destination?.iata_code}
                            </div>
                          </div>
                        </div>
                        
                        {/* Airline Name */}
                        <div className="flex-1">
                          <div className="font-medium text-sm text-[#1d1d1e]">
                            {offer.slices[0]?.segments[0]?.marketing_carrier?.name || 'Unknown Airline'}
                          </div>
                          <div className="text-xs text-[#62626a]">
                            {tripType === 'roundtrip' ? 'round trip' : 'one way'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Price and Expand Button */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xl font-bold text-[#61936f]">
                            {offer.converted_amount
                              ? formatAmount(parseFloat(offer.converted_amount), offer.converted_currency)
                              : formatAmount(parseFloat(offer.total_amount), offer.total_currency)}
                          </div>
                          {offer.converted_amount && (
                            <span className="block text-xs text-gray-400">({formatAmount(parseFloat(offer.total_amount), offer.total_currency)} USD)</span>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                        >
                          {expandedCards.has(offer.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t border-gray-100">
                    {/* Expanded View - Full Details */}
                    <div className="pt-4 space-y-4">
                      {/* Flight Segments */}
                      {offer.slices.map((slice, sliceIndex) => {
                        if (!slice?.segments?.length) return null;
                        const stops = getStops(slice.segments);
                        return (
                          <div key={sliceIndex} className="mb-4">
                            {sliceIndex > 0 && <Separator className="my-4" />}
                            <div className="flex flex-col md:flex-row md:items-center md:gap-6">
                              {/* Times and Airports */}
                              <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4">
                                {/* Departure */}
                                <div className="flex flex-col items-center min-w-[80px]">
                                  <div className="font-bold text-lg text-[#1d1d1e]">{formatTime(slice.segments[0].departing_at)}</div>
                                  <div className="text-xs text-[#62626a]">{slice.segments[0].origin?.iata_code}</div>
                                  <div className="text-xs text-[#62626a]">{formatDate(slice.segments[0].departing_at)}</div>
                                </div>
                                {/* Arrow/Stops */}
                                <div className="flex flex-col items-center flex-1">
                                  <div className="flex items-center gap-2">
                                    <ArrowRight className="w-5 h-5 text-[#61936f]" />
                                    <span className="text-xs text-[#62626a] font-medium">
                                      {getDuration(slice.segments)}
                                    </span>
                                    <ArrowRight className="w-5 h-5 text-[#61936f] rotate-180" />
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    {stops === 0 ? (
                                      <span className="text-xs text-[#61936f] flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Nonstop</span>
                                    ) : (
                                      <span className="text-xs text-[#eab308] flex items-center gap-1"><ArrowDown className="w-4 h-4" /> {stops} stop{stops > 1 ? 's' : ''}</span>
                                    )}
                                  </div>
                                </div>
                                {/* Arrival */}
                                <div className="flex flex-col items-center min-w-[80px]">
                                  <div className="font-bold text-lg text-[#1d1d1e]">{formatTime(slice.segments[slice.segments.length-1].arriving_at)}</div>
                                  <div className="text-xs text-[#62626a]">{slice.segments[slice.segments.length-1].destination?.iata_code}</div>
                                  <div className="text-xs text-[#62626a]">{formatDate(slice.segments[slice.segments.length-1].arriving_at)}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Amenities and Class */}
                      <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2 bg-[#f3f3f3] rounded px-3 py-1">
                          <User className="w-4 h-4 text-[#61936f]" />
                          <div className="text-xs text-[#1d1d1e] flex flex-wrap gap-1">
                            {passengerCounts.adults > 0 && (
                              <span>{passengerCounts.adults} Adult{passengerCounts.adults > 1 ? 's' : ''}</span>
                            )}
                            {passengerCounts.children > 0 && (
                              <span>{passengerCounts.children} Child{passengerCounts.children > 1 ? 'ren' : ''}</span>
                            )}
                            {passengerCounts.infantsInSeat > 0 && (
                              <span>{passengerCounts.infantsInSeat} Infant{passengerCounts.infantsInSeat > 1 ? 's' : ''} (seat)</span>
                            )}
                            {passengerCounts.infantsOnLap > 0 && (
                              <span>{passengerCounts.infantsOnLap} Infant{passengerCounts.infantsOnLap > 1 ? 's' : ''} (lap)</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-[#f3f3f3] rounded px-3 py-1">
                          <Briefcase className="w-4 h-4 text-[#61936f]" />
                          <span className="text-xs text-[#1d1d1e] capitalize">
                            {cabinClass === 'premium_economy' ? 'Premium Economy' : 
                             cabinClass === 'business' ? 'Business' : 
                             cabinClass === 'first' ? 'First' : 
                             'Economy'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-[#f3f3f3] rounded px-3 py-1">
                          <Luggage className="w-4 h-4 text-[#61936f]" />
                          <span className="text-xs text-[#1d1d1e]">Baggage info</span>
                        </div>
                        <div className="flex items-center gap-2 bg-[#f3f3f3] rounded px-3 py-1">
                          <Wifi className="w-4 h-4 text-[#61936f]" />
                          <span className="text-xs text-[#1d1d1e]">Wi-Fi</span>
                        </div>
                        <div className="flex items-center gap-2 bg-[#f3f3f3] rounded px-3 py-1">
                          <Coffee className="w-4 h-4 text-[#61936f]" />
                          <span className="text-xs text-[#1d1d1e]">Snacks</span>
                        </div>
                      </div>
                      
                      {/* Booking Conditions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#61936f]" />
                          <span className="font-medium text-[#1d1d1e]">Changes:</span>
                          {(() => {
                            const status = getConditionStatus(offer.conditions?.change_before_departure);
                            const Icon = status.icon;
                            return (
                              <span className={`ml-2 text-xs ${status.color} flex items-center gap-1`}><Icon className="w-4 h-4" />{status.text}</span>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-[#61936f]" />
                          <span className="font-medium text-[#1d1d1e]">Refunds:</span>
                          {(() => {
                            const status = getConditionStatus(offer.conditions?.refund_before_departure);
                            const Icon = status.icon;
                            return (
                              <span className={`ml-2 text-xs ${status.color} flex items-center gap-1`}><Icon className="w-4 h-4" />{status.text}</span>
                            );
                          })()}
                        </div>
                      </div>
                      
                      {/* Select Flight Button */}
                      <div className="flex justify-end pt-4">
                        <Button 
                          className="bg-[#1d1d1e] hover:bg-[#61936f] text-white font-semibold px-6 py-2 rounded-lg"
                          onClick={async () => {
                            // Validate offer is still valid before selection
                            if (searchTiming?.expires_at) {
                              const now = new Date().getTime();
                              const expiryTime = new Date(searchTiming.expires_at).getTime();
                              const bufferTime = expiryTime - (5 * 60 * 1000); // 5 minutes buffer
                              
                              if (now >= bufferTime) {
                                toast({
                                  title: "Offer Expired",
                                  description: "This flight offer has expired. Please refresh your search to get current prices.",
                                  variant: "destructive",
                                });
                                return;
                              }
                            }
                            
                            // Store the selected offer in localStorage
                            localStorage.setItem('selectedFlightOffer', JSON.stringify(offer));
                            
                            // Save selected offer to persistence
                            const searchParams = getCurrentSearchParams();
                            await flightDataPersistence.updateSelectedOffer(searchParams, offer.id);
                            
                            // Create flight details URL with search context
                            const flightDetailsUrl = flightDataPersistence.createFlightDetailsUrl(
                              offer.id, 
                              searchParams, 
                              i18n.language
                            );
                            
                            console.log('Flight selection - Search params:', searchParams);
                            console.log('Flight selection - Flight details URL:', flightDetailsUrl);
                            
                            // Navigate to the booking details page
                            navigate(flightDetailsUrl);
                          }}
                        >
                          Select Flight
                        </Button>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
        {/* Paging Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-[#62626a]">Page {currentPage} of {totalPages}</span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderBookingConfirmation = () => {
    if (!bookingConfirmation) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Booking Confirmed!</h2>
            <p className="text-gray-600 mt-2">Your flight has been successfully booked.</p>
          </div>

          <div className="space-y-6">
            {/* Booking Reference */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900">Booking Reference</h3>
              <p className="text-2xl font-mono mt-2">{bookingConfirmation.data?.booking_reference || 'N/A'}</p>
            </div>

            {/* Flight Details */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Flight Details</h3>
              {bookingConfirmation.data?.slices?.map((slice: any, index: number) => (
                <div key={index} className="mb-6 last:mb-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <Plane className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {slice.origin?.iata_code} → {slice.destination?.iata_code}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(slice.segments[0]?.departing_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{slice.segments[0]?.marketing_carrier?.name}</p>
                      <p className="text-sm text-gray-500">
                        Flight {slice.segments[0]?.marketing_carrier?.iata_code}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Departure</p>
                      <p className="font-medium">{formatTime(slice.segments[0]?.departing_at)}</p>
                      <p className="text-sm">{slice.origin?.name}</p>
                      {slice.segments[0]?.origin_terminal && (
                        <p className="text-sm text-gray-500">Terminal {slice.segments[0].origin_terminal}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Arrival</p>
                      <p className="font-medium">{formatTime(slice.segments[0]?.arriving_at)}</p>
                      <p className="text-sm">{slice.destination?.name}</p>
                      {slice.segments[0]?.destination_terminal && (
                        <p className="text-sm text-gray-500">Terminal {slice.segments[0].destination_terminal}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Passenger Information */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Passenger Information</h3>
              {bookingConfirmation.data?.passengers?.map((passenger: any) => (
                <div key={passenger.id} className="bg-gray-50 p-4 rounded-lg mb-4 last:mb-0">
                  <p className="font-medium">
                    {passenger.title} {passenger.given_name} {passenger.family_name}
                  </p>
                  <p className="text-sm text-gray-500">{passenger.email}</p>
                </div>
              ))}
            </div>

            {/* Price Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Price Details</h3>
              <div className="space-y-2">
                {bookingConfirmation.data?.base_amount && bookingConfirmation.data?.base_currency && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Base Fare</span>
                      <span className="font-medium">
                        {bookingConfirmation.data.base_currency} {bookingConfirmation.data.base_amount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Taxes & Fees</span>
                      <span className="font-medium">
                        {bookingConfirmation.data.total_currency} {(parseFloat(bookingConfirmation.data.total_amount) - parseFloat(bookingConfirmation.data.base_amount)).toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="text-xl font-semibold">
                    {bookingConfirmation.data?.total_amount} {bookingConfirmation.data?.total_currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => {
                setBookingConfirmation(null);
                // Optionally redirect to a bookings page or home
                navigate(`/${i18n.language}/bookings`);
              }}
            >
              View All Bookings
            </Button>
            <Button
              className="bg-[#72ba87] hover:bg-[#61936f] text-white"
              onClick={() => {
                setBookingConfirmation(null);
                // Reset the form and start a new search
                setOrigin('');
                setDestination('');
                setDepartureDate(undefined);
                setReturnDate(undefined);
                setPassengerCounts({ adults: 1, children: 0, infantsInSeat: 0, infantsOnLap: 0 });
                setCabinClass('');
              }}
            >
              Book Another Flight
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      {/* Waiting Popup */}
      <FlightBookingLoadingDialog isOpen={isLoading} />


      {/* Sticky Search Bar */}
      <div className="sticky top-16 z-20 bg-white border-b border-[#e5e5e5] shadow-sm">
        {/* Search Form */}
        <div className="px-4 pb-4 flex justify-center">
          <div className="max-w-6xl w-full">
            <form
              onSubmit={e => { e.preventDefault(); handleSearch(); }}
              className="flex flex-col gap-4 justify-center w-full pt-8"
              role="search"
              aria-label="Flight search form"
            >
              {/* Trip Type Selection - Positioned Above */}
              <div className="flex justify-left w-full items-end">
                <ToggleGroup 
                  type="single" 
                  value={tripType} 
                  onValueChange={(value) => value && setTripType(value as 'roundtrip' | 'oneway')}
                  className="justify-center"
                  id="trip-type"
                >
                  <ToggleGroupItem 
                    value="roundtrip" 
                    className="px-3 py-1.5 text-sm data-[state=on]:text-[#61936f] data-[state=on]:border-[#61936f] data-[state=on]:bg-[#61936f]/5 hover:bg-[#61936f]/10 data-[state=off]:bg-transparent data-[state=off]:text-[#62626a] data-[state=off]:border-[#e5e5e5]"
                  >
                    Round Trip
                  </ToggleGroupItem>
                  <ToggleGroupItem 
                    value="oneway" 
                    className="px-3 py-1.5 text-sm data-[state=on]:text-[#61936f] data-[state=on]:border-[#61936f] data-[state=on]:bg-[#61936f]/5 hover:bg-[#61936f]/10 data-[state=off]:bg-transparent data-[state=off]:text-[#62626a] data-[state=off]:border-[#e5e5e5]"
                  >
                    One Way
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              
              {/* Search Form Elements */}
              <div className="flex flex-col lg:flex-row gap-4 items-end justify-center w-full">
              {/* From */}
              <div className="w-full md:w-auto">
                <label htmlFor="from" className="sr-only">From</label>
                <AirportSelector
                  value={origin}
                  onChange={setOrigin}
                  placeholder="From"
                  className="min-w-[200px]"
                />
              </div>
              {/* To */}
              <div className="w-full md:w-auto">
                <label htmlFor="to" className="sr-only">To</label>
                <AirportSelector
                  value={destination}
                  onChange={setDestination}
                  placeholder="To"
                  className="min-w-[200px]"
                />
              </div>
              {/* Passengers - Hidden on mobile, will be moved after currency */}
              <div className="hidden md:block w-full md:w-auto">
                <label htmlFor="passengers" className="sr-only">Passengers</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-16 justify-center text-left font-normal"
                      id="passengers"
                      type="button"
                    >
                      <User className="mr-2 h-4 w-4" />
                      {totalPassengers}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="start">
                    <div className="space-y-4">
                      <h4 className="font-medium leading-none">Passengers</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Adults</p>
                            <p className="text-xs text-muted-foreground">Age 12+</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('adults', -1)}
                              disabled={passengerCounts.adults <= 1}
                              className="h-8 w-8 p-0"
                            >
                              -
                            </Button>
                            <span className="w-8 text-center text-sm">{passengerCounts.adults}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('adults', 1)}
                              disabled={passengerCounts.adults >= 9 || totalPassengers >= 9}
                              className="h-8 w-8 p-0"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Children</p>
                            <p className="text-xs text-muted-foreground">Age 2-11</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('children', -1)}
                              disabled={passengerCounts.children <= 0}
                              className="h-8 w-8 p-0"
                            >
                              -
                            </Button>
                            <span className="w-8 text-center text-sm">{passengerCounts.children}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('children', 1)}
                              disabled={passengerCounts.children >= 8 || totalPassengers >= 9}
                              className="h-8 w-8 p-0"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Infants (In seat)</p>
                            <p className="text-xs text-muted-foreground">Under 2 with seat</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('infantsInSeat', -1)}
                              disabled={passengerCounts.infantsInSeat <= 0}
                              className="h-8 w-8 p-0"
                            >
                              -
                            </Button>
                            <span className="w-8 text-center text-sm">{passengerCounts.infantsInSeat}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('infantsInSeat', 1)}
                              disabled={passengerCounts.infantsInSeat >= 4 || totalPassengers >= 9}
                              className="h-8 w-8 p-0"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Infants (On lap)</p>
                            <p className="text-xs text-muted-foreground">Under 2 without seat</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('infantsOnLap', -1)}
                              disabled={passengerCounts.infantsOnLap <= 0}
                              className="h-8 w-8 p-0"
                            >
                              -
                            </Button>
                            <span className="w-8 text-center text-sm">{passengerCounts.infantsOnLap}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('infantsOnLap', 1)}
                              disabled={passengerCounts.infantsOnLap >= 4 || totalPassengers >= 9}
                              className="h-8 w-8 p-0"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="pt-3 border-t">
                        <p className="text-sm text-muted-foreground">
                          Total: {totalPassengers} passenger{totalPassengers !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              {/* Departure Date */}
              <div className="w-full md:w-auto">
                <label htmlFor="departure-date" className="sr-only">Departure Date</label>
                <Popover open={isDepartureDateOpen} onOpenChange={setIsDepartureDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full min-w-[140px] justify-start text-left font-normal",
                        !departureDate && "text-muted-foreground"
                      )}
                      id="departure-date"
                      type="button"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {departureDate ? format(departureDate, "PPP") : "Departure"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                                          <Calendar
                        mode="single"
                        selected={departureDate}
                        onSelect={handleDepartureDateSelect}
                        initialFocus
                        disabled={(date) => {
                          // Disable only past dates (before today), allow today
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const checkDate = new Date(date);
                          checkDate.setHours(0, 0, 0, 0);
                          
                          return checkDate < today;
                        }}
                      />
                  </PopoverContent>
                </Popover>
              </div>
              {/* Return Date (only for round trip) */}
              {tripType === 'roundtrip' && (
                <div className="w-full md:w-auto">
                  <label htmlFor="return-date" className="sr-only">Return Date</label>
                  <Popover open={isReturnDateOpen} onOpenChange={setIsReturnDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full min-w-[140px] justify-start text-left font-normal",
                          !returnDate && "text-muted-foreground"
                        )}
                        id="return-date"
                        type="button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {returnDate ? format(returnDate, "PPP") : "Return"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={returnDate}
                        onSelect={handleReturnDateSelect}
                        initialFocus
                        disabled={(date) => {
                          // Disable past dates and dates before or equal to departure date
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const departure = departureDate ? new Date(departureDate) : today;
                          departure.setHours(0, 0, 0, 0);
                          const checkDate = new Date(date);
                          checkDate.setHours(0, 0, 0, 0);
                          
                          return checkDate < today || (departureDate && checkDate <= departure);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              {/* Class */}
              <div className="w-full md:w-auto">
                <label htmlFor="class" className="sr-only">Class</label>
                <Select value={cabinClass} onValueChange={setCabinClass}>
                  <SelectTrigger id="class" className="w-full min-w-[120px]">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="premium_economy">Premium Economy</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="first">First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Currency */}
              <div className="w-full md:w-auto">
                <label htmlFor="currency" className="sr-only">Currency</label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency" className="w-20">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                    <SelectItem value="CHF">CHF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Passengers - Mobile only, positioned after currency */}
              <div className="block md:hidden w-full md:w-auto">
                <label htmlFor="passengers-mobile" className="sr-only">Passengers</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-16 justify-center text-left font-normal"
                      id="passengers-mobile"
                      type="button"
                    >
                      <User className="mr-2 h-4 w-4" />
                      {totalPassengers}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="start">
                    <div className="space-y-4">
                      <h4 className="font-medium leading-none">Passengers</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Adults</p>
                            <p className="text-xs text-muted-foreground">Age 12+</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('adults', -1)}
                              disabled={passengerCounts.adults <= 1}
                              className="h-8 w-8 p-0"
                            >
                              -
                            </Button>
                            <span className="w-8 text-center text-sm">{passengerCounts.adults}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('adults', 1)}
                              disabled={passengerCounts.adults >= 9 || totalPassengers >= 9}
                              className="h-8 w-8 p-0"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Children</p>
                            <p className="text-xs text-muted-foreground">Age 2-11</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('children', -1)}
                              disabled={passengerCounts.children <= 0}
                              className="h-8 w-8 p-0"
                            >
                              -
                            </Button>
                            <span className="w-8 text-center text-sm">{passengerCounts.children}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('children', 1)}
                              disabled={passengerCounts.children >= 8 || totalPassengers >= 9}
                              className="h-8 w-8 p-0"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Infants (In seat)</p>
                            <p className="text-xs text-muted-foreground">Under 2 with seat</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('infantsInSeat', -1)}
                              disabled={passengerCounts.infantsInSeat <= 0}
                              className="h-8 w-8 p-0"
                            >
                              -
                            </Button>
                            <span className="w-8 text-center text-sm">{passengerCounts.infantsInSeat}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('infantsInSeat', 1)}
                              disabled={passengerCounts.infantsInSeat >= 4 || totalPassengers >= 9}
                              className="h-8 w-8 p-0"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Infants (On lap)</p>
                            <p className="text-xs text-muted-foreground">Under 2 without seat</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('infantsOnLap', -1)}
                              disabled={passengerCounts.infantsOnLap <= 0}
                              className="h-8 w-8 p-0"
                            >
                              -
                            </Button>
                            <span className="w-8 text-center text-sm">{passengerCounts.infantsOnLap}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('infantsOnLap', 1)}
                              disabled={passengerCounts.infantsOnLap >= 4 || totalPassengers >= 9}
                              className="h-8 w-8 p-0"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="pt-3 border-t">
                        <p className="text-sm text-muted-foreground">
                          Total: {totalPassengers} passenger{totalPassengers !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              {/* Search Button */}
              <div className="w-full md:w-auto">
                <Button
                  className="w-full min-w-[120px] bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-none hover:from-[#059669] hover:to-[#047857] hover:scale-105 transition-all duration-300 shadow-lg rounded-full font-medium tracking-wide"
                  type="submit"
                  disabled={isLoading}
                  aria-label="Search flights"
                >
                  <span className="flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Search
                      </>
                    )}
                  </span>
                </Button>
              </div>
              </div>
            </form>
          </div>
        </div>

        {/* Sort Options */}
        {(searchResults?.data?.offers && searchResults.data.offers.length > 0) && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#62626a]">Sort by:</span>
              <ToggleGroup 
                type="single" 
                value={currentSort} 
                onValueChange={(value) => value && setCurrentSort(value as 'best' | 'direct' | 'cheapest' | 'fastest')}
                className="justify-start"
              >
                <ToggleGroupItem 
                  value="best" 
                  className="px-4 py-1 text-xs data-[state=on]:bg-[#61936f] data-[state=on]:text-white data-[state=on]:border-[#61936f] hover:bg-[#61936f]/10"
                >
                  Best
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="direct" 
                  className="px-4 py-1 text-xs data-[state=on]:bg-[#61936f] data-[state=on]:text-white data-[state=on]:border-[#61936f] hover:bg-[#61936f]/10"
                >
                  Most Direct
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="cheapest" 
                  className="px-4 py-1 text-xs data-[state=on]:bg-[#61936f] data-[state=on]:text-white data-[state=on]:border-[#61936f] hover:bg-[#61936f]/10"
                >
                  Cheapest
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="fastest" 
                  className="px-4 py-1 text-xs data-[state=on]:bg-[#61936f] data-[state=on]:text-white data-[state=on]:border-[#61936f] hover:bg-[#61936f]/10"
                >
                  Fastest
                </ToggleGroupItem>
              </ToggleGroup>
              <span className="text-xs text-[#62626a] ml-2">
                ({currentSort === 'best' ? 'Price + Duration + Stops' : 
                  currentSort === 'direct' ? 'Fewest stops' : 
                  currentSort === 'cheapest' ? 'Lowest price' : 'Shortest duration'})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content: Results and Booking Logic */}
      <div className="max-w-5xl mx-auto px-2 md:px-0 pt-8">
        {/* Filters */}
        {searchResults && searchResults.data.offers && searchResults.data.offers.length > 0 && (
          <FlightFilters onFiltersChange={handleFiltersChange} />
        )}
        
        {/* Search Results */}
        {searchResults && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-semibold text-[#1d1d1e]">Available Flights</h2>
                {searchTiming?.expires_at && (
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    isExpired 
                      ? 'bg-red-100 text-red-700 border border-red-200' 
                      : timeRemaining < 60000 
                        ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                        : 'bg-green-100 text-green-700 border border-green-200'
                  }`}>
                    <Clock className="h-4 w-4" />
                    {isExpired ? (
                      <span>Offers Expired</span>
                    ) : (
                      <span>Expires in {flightDataPersistence.formatTimeRemaining(timeRemaining)}</span>
                    )}
                  </div>
                )}
                {/* Show warning for stale offers */}
                {searchResults?.data?.offers && searchResults.data.offers.length > 0 && isStale && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                    <Clock className="h-4 w-4" />
                    <span>Offers may be expired - Refresh recommended</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {searchTimestamp > 0 && (
                  <div className="text-sm text-[#62626a]">
                    {t('search.lastUpdated')}: {new Date(searchTimestamp).toLocaleTimeString()}
                  </div>
                )}
                {isRefreshing && (
                  <div className="flex items-center gap-2 text-sm text-[#61936f]">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#61936f] border-t-transparent"></div>
                    {t('search.refreshing')}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearch(true)}
                  disabled={isRefreshing}
                  className="text-[#61936f] border-[#61936f] hover:bg-[#61936f] hover:text-white"
                >
                  <Search className="h-4 w-4 mr-1" />
                  {t('search.refresh')}
                </Button>
              </div>
            </div>
            {showCurrencyNotice && (
              <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm">
                      <strong>Currency Conversion:</strong> Original prices are in {searchResults?.data?.offers[0]?.total_currency}. 
                      Converted prices in {currency} are shown for your convenience using real-time exchange rates.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {renderFlightOffers()}
          </div>
        )}
        {/* Additional Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="font-semibold mb-2 text-[#1d1d1e]">Best Price Guarantee</h3>
            <p className="text-sm text-[#62626a]">We guarantee the best prices for your flights</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="font-semibold mb-2 text-[#1d1d1e]">24/7 Support</h3>
            <p className="text-sm text-[#62626a]">Our team is always here to help you</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="font-semibold mb-2 text-[#1d1d1e]">Flexible Booking</h3>
            <p className="text-sm text-[#62626a]">Free cancellation on most flights</p>
          </div>
        </div>
        {/* Add the booking form */}
        {renderBookingForm()}
        {/* Add the booking confirmation modal */}
        {renderBookingConfirmation()}
      </div>
    </div>
  );
} 