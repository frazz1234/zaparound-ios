import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Plane, 
  Clock, 
  MapPin, 
  Calendar, 
  CalendarIcon,
  User, 
  Users, 
  Luggage, 
  ChevronDown, 
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { flightDataPersistence, FlightSearchData } from '@/utils/flightDataPersistence';
import { cn } from '@/lib/utils';
import { PhoneInput } from '@/components/ui/phone-input';
import { DatePicker } from '@/components/ui/date-picker';
import { AncillariesStep } from '@/components/booking/AncillariesStep';
import { AuthModal } from '@/components/auth/AuthModal';
import { useProfile } from '@/hooks/useProfile';
import { useSecurePassport } from '@/hooks/useSecurePassport';
import { useDevMode } from '@/hooks/useDevMode';



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
}

interface PassengerFormData {
  id: string;
  title: string;
  given_name: string;
  family_name: string;
  email: string;
  phone_number: string;
  phone_country_code: string;
  gender: string;
  born_on: string;
  passport_number: string;
  passport_country: string;
  passport_expiry: string;
  luggage?: {
    checked: number;
    carry_on: number;
  };
}

interface LuggageOption {
  type: 'checked' | 'carry_on';
  weight: string;
  price: number;
  currency: string;
}

const PASSPORT_COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "DE", name: "Germany" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "AU", name: "Australia" },
  // ... add more as needed
];

export function FlightBookingDetails() {
  const { t, i18n } = useTranslation('booking');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDev, getDevModeBadge } = useDevMode();
  const { toast } = useToast();
  const [selectedOffer, setSelectedOffer] = useState<FlightOffer | null>(null);
  const [passengerForms, setPassengerForms] = useState<PassengerFormData[]>([]);
  const [expandedPassengers, setExpandedPassengers] = useState<Set<string>>(new Set());
  const [isBooking, setIsBooking] = useState(false);
  const [currentStep, setCurrentStep] = useState<'passengers' | 'ancillaries' | 'luggage' | 'payment'>('passengers');
  
  // Currency state
  const [currency, setCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({});
  const lastRatesFetch = { current: 0 };
  
  // Timing state
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [searchTiming, setSearchTiming] = useState<{
    search_started_at: string;
    supplier_timeout: number;
    expires_at: string | null;
    created_at: string | null;
  } | null>(null);
  
  // Luggage options
  const luggageOptions: LuggageOption[] = [
    { type: 'checked', weight: '23kg', price: 30, currency: 'USD' },
    { type: 'checked', weight: '32kg', price: 50, currency: 'USD' },
    { type: 'carry_on', weight: '7kg', price: 0, currency: 'USD' },
    { type: 'carry_on', weight: '10kg', price: 15, currency: 'USD' },
  ];

  // Ancillaries state
  const [ancillariesPayload, setAncillariesPayload] = useState<any>(null);
  const [ancillariesMetadata, setAncillariesMetadata] = useState<any>(null);
  
  // Authentication state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(false);
  
  // Payment state
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  
  // Profile state for "Fill with my info" functionality
  const { profile } = useProfile();
  const { passportData } = useSecurePassport();

  useEffect(() => {
    const loadData = async () => {
      const offerId = searchParams.get('offerId');
      if (!offerId) {
        navigate(`/${i18n.language}/booking/internal-flights`);
        return;
      }

      // In a real app, you would fetch the offer details from your backend
      // For now, we'll simulate this with localStorage or redirect back
      const storedOffer = localStorage.getItem('selectedFlightOffer');
      if (storedOffer) {
        const offer = JSON.parse(storedOffer);
        setSelectedOffer(offer);
        
        // Initialize passenger forms based on the offer
        const initialPassengers = offer.passengers.map((passenger: any, index: number) => ({
          id: passenger.id,
          title: '',
          given_name: '',
          family_name: '',
          email: '',
          phone_number: '',
          phone_country_code: '',
          gender: '',
          born_on: '',
          passport_number: '',
          passport_country: '',
          passport_expiry: '',
          luggage: {
            checked: 0,
            carry_on: 0
          }
        }));
        setPassengerForms(initialPassengers);
        
        // Expand first passenger by default
        if (initialPassengers.length > 0) {
          setExpandedPassengers(new Set([initialPassengers[0].id]));
        }
        
        // Set currency from the offer
        if (offer.total_currency) {
          setCurrency(offer.total_currency);
        }
        
        // Fetch exchange rates for penalty currencies
        const fetchPenaltyCurrencyRates = async () => {
          const penaltyCurrencies = new Set<string>();
          
          if (offer.conditions?.change_before_departure?.penalty_currency) {
            penaltyCurrencies.add(offer.conditions.change_before_departure.penalty_currency);
          }
          if (offer.conditions?.refund_before_departure?.penalty_currency) {
            penaltyCurrencies.add(offer.conditions.refund_before_departure.penalty_currency);
          }
          
          // Fetch rates for each unique penalty currency
          for (const penaltyCurrency of penaltyCurrencies) {
            if (penaltyCurrency !== offer.total_currency) {
              await fetchExchangeRates(penaltyCurrency);
            }
          }
        };
        
        await fetchPenaltyCurrencyRates();
        
        // First try to get search ID from URL
        const searchIdFromUrl = flightDataPersistence.getSearchIdFromUrl(window.location.href);
        console.log('FlightBookingDetails - Current URL:', window.location.href);
        console.log('FlightBookingDetails - Search ID from URL:', searchIdFromUrl);
        
        if (searchIdFromUrl) {
          // Try to load data by search ID
          const searchData = await flightDataPersistence.loadFlightDataBySearchId(searchIdFromUrl);
          console.log('FlightBookingDetails - Loaded search data by ID:', searchData);
          if (searchData) {
            setSearchTiming(searchData.timing);
            setCurrency(searchData.searchParams.currency);
            
            // Restore user progress if available
            if (searchData.userProgress && searchData.userProgress.currentStep !== 'search') {
              setCurrentStep(searchData.userProgress.currentStep as 'passengers' | 'ancillaries' | 'luggage' | 'payment');
              if (searchData.userProgress.passengerForms) {
                setPassengerForms(searchData.userProgress.passengerForms);
              }
              if (searchData.userProgress.ancillariesPayload) {
                setAncillariesPayload(searchData.userProgress.ancillariesPayload);
              }
            }
          }
        } else {
        // Fallback to loading by search parameters
        const searchParams = {
          origin: offer.slices[0]?.segments[0]?.origin?.iata_code || '',
          destination: offer.slices[0]?.segments[0]?.destination?.iata_code || '',
          departureDate: offer.slices[0]?.segments[0]?.departing_at?.split('T')[0] || '',
          returnDate: offer.slices.length > 1 ? offer.slices[1]?.segments[0]?.departing_at?.split('T')[0] : undefined,
          passengers: offer.passengers.length,
          cabinClass: 'economy', // Default, could be enhanced
          currency: offer.total_currency,
          maxConnections: 1
        };
        
        const searchData = flightDataPersistence.loadFlightData(searchParams);
        if (searchData) {
          setSearchTiming(searchData.timing);
          setCurrency(searchData.searchParams.currency);
          
          // Restore user progress if available
          if (searchData.userProgress && searchData.userProgress.currentStep !== 'search') {
            setCurrentStep(searchData.userProgress.currentStep as 'passengers' | 'ancillaries' | 'luggage' | 'payment');
            if (searchData.userProgress.passengerForms) {
              setPassengerForms(searchData.userProgress.passengerForms);
            }
            if (searchData.userProgress.ancillariesPayload) {
              setAncillariesPayload(searchData.userProgress.ancillariesPayload);
            }
          }
        }
      }
    } else {
      navigate(`/${i18n.language}/booking/internal-flights`);
    }
    };
    
    loadData();
  }, [searchParams, navigate, i18n.language]);

  // Handle countdown timer for offer expiration
  useEffect(() => {
    if (!selectedOffer) return;
    
    const updateTimer = async () => {
      // First try to get search ID from URL
      const searchIdFromUrl = flightDataPersistence.getSearchIdFromUrl(window.location.href);
      
      if (searchIdFromUrl) {
        // Use search ID to get time remaining
        const searchData = await flightDataPersistence.loadFlightDataBySearchId(searchIdFromUrl);
        if (searchData && searchData.timing.expires_at) {
          const now = new Date().getTime();
          const expiryTime = new Date(searchData.timing.expires_at).getTime();
          const timeRemaining = Math.max(0, expiryTime - now);
          
          if (timeRemaining > 0) {
            setTimeRemaining(timeRemaining);
            setIsExpired(false);
            
            // Auto-refresh logic: If less than 2 minutes remaining, suggest refresh
            if (timeRemaining < 2 * 60 * 1000 && !isExpired) {
              toast({
                title: "Offer Expiring Soon",
                description: "This flight offer will expire in less than 2 minutes. Please complete your booking quickly or refresh to get updated prices.",
                duration: 5000,
              });
            }
          } else {
            setTimeRemaining(0);
            setIsExpired(true);
          }
        }
      } else {
        // Fallback to search parameters
        const searchParams = {
          origin: selectedOffer.slices[0]?.segments[0]?.origin?.iata_code || '',
          destination: selectedOffer.slices[0]?.segments[0]?.destination?.iata_code || '',
          departureDate: selectedOffer.slices[0]?.segments[0]?.departing_at?.split('T')[0] || '',
          returnDate: selectedOffer.slices.length > 1 ? selectedOffer.slices[1]?.segments[0]?.departing_at?.split('T')[0] : undefined,
          passengers: selectedOffer.passengers.length,
          cabinClass: 'economy',
          currency: selectedOffer.total_currency,
          maxConnections: 1
        };
        
        const timeRemaining = await flightDataPersistence.getTimeRemaining(searchParams);
        
        if (timeRemaining > 0) {
          setTimeRemaining(timeRemaining);
          setIsExpired(false);
          
          // Auto-refresh logic: If less than 2 minutes remaining, suggest refresh
          if (timeRemaining < 2 * 60 * 1000 && !isExpired) {
            toast({
              title: "Offer Expiring Soon",
              description: "This flight offer will expire in less than 2 minutes. Please complete your booking quickly or refresh to get updated prices.",
              duration: 5000,
            });
          }
        } else {
          setTimeRemaining(0);
          setIsExpired(true);
        }
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [searchTiming, selectedOffer]);

  // Check for stale offers based on stored timing
  useEffect(() => {
    if (searchTiming?.search_started_at) {
      const now = new Date().getTime();
      const searchStart = new Date(searchTiming.search_started_at).getTime();
      const searchAge = now - searchStart;
      const maxAge = 30 * 60 * 1000; // 30 minutes
      setIsStale(searchAge > maxAge);
    } else {
      // Only mark as stale if we have no timing info at all (indicating old cached data)
      setIsStale(false);
    }
  }, [searchTiming]);

  const togglePassenger = (passengerId: string) => {
    const newExpanded = new Set(expandedPassengers);
    if (newExpanded.has(passengerId)) {
      newExpanded.delete(passengerId);
    } else {
      newExpanded.add(passengerId);
    }
    setExpandedPassengers(newExpanded);
  };

  const updatePassengerForm = (passengerId: string, field: keyof PassengerFormData, value: any) => {
    setPassengerForms(prev => prev.map(passenger => 
      passenger.id === passengerId 
        ? { ...passenger, [field]: value }
        : passenger
    ));
  };

    const updateLuggage = (passengerId: string, type: 'checked' | 'carry_on', value: number) => {
    setPassengerForms(prev => prev.map(passenger =>
      passenger.id === passengerId
        ? {
            ...passenger,
            luggage: {
              ...passenger.luggage,
              [type]: value
            }
          }
        : passenger
    ));
  };

  // Fill passenger form with profile information
  const fillWithProfileInfo = (passengerId: string) => {
    if (!profile) {
      toast({
        title: "No Profile Information",
        description: "Please complete your profile information first.",
        variant: "destructive",
      });
      return;
    }

    const profileData = {
              given_name: profile.first_name || '',
        family_name: profile.last_name || '',
      email: profile.email || '',
      born_on: profile.birth_date || '',
      passport_number: passportData?.passport_number || '',
      passport_country: passportData?.passport_country || '',
      passport_expiry: passportData?.passport_expiry_date || '',
    };

    setPassengerForms(prev => prev.map(passenger =>
      passenger.id === passengerId
        ? { ...passenger, ...profileData }
        : passenger
    ));

    toast({
      title: "Profile Information Filled",
      description: "Your profile information has been filled in.",
    });
  };

  const validatePassengerForm = (passenger: PassengerFormData): string[] => {
    const errors: string[] = [];
    
    if (!passenger.title) errors.push(t('validation.titleRequired'));
    if (!passenger.given_name) errors.push(t('validation.firstNameRequired'));
    if (!passenger.family_name) errors.push(t('validation.lastNameRequired'));
    if (!passenger.email) errors.push(t('validation.emailRequired'));
    if (!passenger.phone_number) errors.push(t('validation.phoneRequired'));
    if (!passenger.gender) errors.push(t('validation.genderRequired'));
    if (!passenger.born_on) errors.push(t('validation.birthDateRequired'));
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (passenger.email && !emailRegex.test(passenger.email)) {
      errors.push(t('validation.invalidEmail'));
    }
    
    // Phone validation (E.164 format)
    if (passenger.phone_number && passenger.phone_country_code) {
      const fullPhone = `${passenger.phone_country_code}${passenger.phone_number.replace(/[^\d]/g, '')}`;
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(fullPhone) || fullPhone.length < 8 || fullPhone.length > 15) {
        errors.push(t('validation.invalidPhone'));
      }
    } else if (!passenger.phone_number || !passenger.phone_country_code) {
      errors.push(t('validation.phoneRequired'));
    }
    
    return errors;
  };

  const validateAllPassengers = (): boolean => {
    for (const passenger of passengerForms) {
      const errors = validatePassengerForm(passenger);
      if (errors.length > 0) {
        toast({
          title: t('booking.validationError'),
          description: `${t('booking.missingInfoDesc')} ${passenger.given_name || 'Unknown'}: ${errors.join(', ')}`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 'passengers') {
      if (validateAllPassengers()) {
        setCurrentStep('ancillaries');
        // Update user progress in persistence
        if (selectedOffer) {
          const searchParams = {
            origin: selectedOffer.slices[0]?.segments[0]?.origin?.iata_code || '',
            destination: selectedOffer.slices[0]?.segments[0]?.destination?.iata_code || '',
            departureDate: selectedOffer.slices[0]?.segments[0]?.departing_at?.split('T')[0] || '',
            returnDate: selectedOffer.slices.length > 1 ? selectedOffer.slices[1]?.segments[0]?.departing_at?.split('T')[0] : undefined,
            passengers: selectedOffer.passengers.length,
            cabinClass: 'economy',
            currency: selectedOffer.total_currency,
            maxConnections: 1
          };
          flightDataPersistence.updateUserProgress(searchParams, { 
            currentStep: 'ancillaries',
            passengerForms 
          });
        }
      }
    } else if (currentStep === 'ancillaries') {
      setCurrentStep('luggage');
      // Update user progress
      if (selectedOffer) {
        const searchParams = {
          origin: selectedOffer.slices[0]?.segments[0]?.origin?.iata_code || '',
          destination: selectedOffer.slices[0]?.segments[0]?.destination?.iata_code || '',
          departureDate: selectedOffer.slices[0]?.segments[0]?.departing_at?.split('T')[0] || '',
          returnDate: selectedOffer.slices.length > 1 ? selectedOffer.slices[1]?.segments[0]?.departing_at?.split('T')[0] : undefined,
          passengers: selectedOffer.passengers.length,
          cabinClass: 'economy',
          currency: selectedOffer.total_currency,
          maxConnections: 1
        };
        flightDataPersistence.updateUserProgress(searchParams, { 
          currentStep: 'luggage',
          ancillariesPayload 
        });
      }
    } else if (currentStep === 'luggage') {
      setCurrentStep('payment');
      // Update user progress
      if (selectedOffer) {
        const searchParams = {
          origin: selectedOffer.slices[0]?.segments[0]?.origin?.iata_code || '',
          destination: selectedOffer.slices[0]?.segments[0]?.destination?.iata_code || '',
          departureDate: selectedOffer.slices[0]?.segments[0]?.departing_at?.split('T')[0] || '',
          returnDate: selectedOffer.slices.length > 1 ? selectedOffer.slices[1]?.segments[0]?.departing_at?.split('T')[0] : undefined,
          passengers: selectedOffer.passengers.length,
          cabinClass: 'economy',
          currency: selectedOffer.total_currency,
          maxConnections: 1
        };
        flightDataPersistence.updateUserProgress(searchParams, { 
          currentStep: 'payment',
          luggageSelections: passengerForms.map(p => p.luggage)
        });
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'ancillaries') {
      setCurrentStep('passengers');
    } else if (currentStep === 'luggage') {
      setCurrentStep('ancillaries');
    } else if (currentStep === 'payment') {
      setCurrentStep('luggage');
    }
  };

  const handleAncillariesSelected = (payload: any, metadata: any) => {
    setAncillariesPayload(payload);
    setAncillariesMetadata(metadata);
  };

  const handleBooking = async () => {
    if (!validateAllPassengers()) return;
    
    // Additional validation for offer expiration
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
    
    // Check if offers have expired or are stale
    if (isExpired || isStale) {
      toast({
        title: "Offers Expired",
        description: "The flight offers have expired or are too old. Please refresh the search to get updated prices.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // User is not authenticated, show auth modal
      setPendingBooking(true);
      setShowAuthModal(true);
      return;
    }
    
    // User is authenticated, proceed with Stripe payment
    await initiateStripePayment();
  };
  
  const initiateStripePayment = async () => {
    if (!selectedOffer) return;
    
    setPaymentProcessing(true);
    
    try {
      // Calculate additional fees
      const luggageFees = passengerForms.reduce((total, p) => {
        const checkedPrice = luggageOptions.find(opt => opt.type === 'checked' && opt.weight === '23kg')?.price || 0;
        const carryOnPrice = luggageOptions.find(opt => opt.type === 'carry_on' && opt.weight === '10kg')?.price || 0;
        return total + (p.luggage?.checked || 0) * checkedPrice + (p.luggage?.carry_on || 0) * carryOnPrice;
      }, 0);

      const ancillariesFees = ancillariesMetadata ? 
        (parseFloat(ancillariesMetadata.offer_total_amount) - parseFloat(selectedOffer?.total_amount || '0')) : 0;

      const totalAmount = calculateTotalPrice();

      // Prepare flight details
      const flightDetails = {
        origin: selectedOffer.slices[0]?.segments[0]?.origin?.iata_code || '',
        destination: selectedOffer.slices[0]?.segments[0]?.destination?.iata_code || '',
        departureDate: selectedOffer.slices[0]?.segments[0]?.departing_at?.split('T')[0] || '',
        returnDate: selectedOffer.slices.length > 1 ? selectedOffer.slices[1]?.segments[0]?.departing_at?.split('T')[0] : undefined,
        airline: selectedOffer.slices[0]?.segments[0]?.marketing_carrier?.name || '',
        flightNumber: selectedOffer.slices[0]?.segments[0]?.marketing_carrier?.iata_code || ''
      };

      // Create payment request
      const paymentRequest = {
        offerId: selectedOffer.id,
        passengers: passengerForms.map(passenger => {
          const phoneNumber = `${passenger.phone_country_code}${passenger.phone_number.replace(/[^\d]/g, '')}`;
          return {
            id: passenger.id,
            title: passenger.title,
            given_name: passenger.given_name,
            family_name: passenger.family_name,
            email: passenger.email,
            phone_number: phoneNumber,
            gender: passenger.gender === 'male' ? 'm' : 'f',
            born_on: passenger.born_on,
          };
        }),
        amount: totalAmount.toFixed(2),
        currency: selectedOffer.total_currency,
        base_amount: selectedOffer.base_amount,
        base_currency: selectedOffer.base_currency,
        luggage_fees: luggageFees.toFixed(2),
        ancillaries_fees: ancillariesFees.toFixed(2),
        ancillaries: ancillariesPayload,
        flightDetails
      };

      console.log('Creating Stripe checkout session:', JSON.stringify(paymentRequest, null, 2));

      // Call our Stripe payment function
      const { data, error } = await supabase.functions.invoke('stripe-flight-payment', {
        body: paymentRequest,
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        toast({
          title: "Payment Error",
          description: error.message || "Failed to create checkout session",
          variant: "destructive",
        });
        return;
      }

      console.log('Checkout session created:', data);
      
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Payment Error",
          description: "No checkout URL received",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Error initiating payment:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
    } finally {
      setPaymentProcessing(false);
    }
  };
  
  const performBooking = async () => {
    setIsBooking(true);
    try {
      // Calculate additional fees
      const luggageFees = passengerForms.reduce((total, p) => {
        const checkedPrice = luggageOptions.find(opt => opt.type === 'checked' && opt.weight === '23kg')?.price || 0;
        const carryOnPrice = luggageOptions.find(opt => opt.type === 'carry_on' && opt.weight === '10kg')?.price || 0;
        return total + (p.luggage?.checked || 0) * checkedPrice + (p.luggage?.carry_on || 0) * carryOnPrice;
      }, 0);

      const ancillariesFees = ancillariesMetadata ? 
        (parseFloat(ancillariesMetadata.offer_total_amount) - parseFloat(selectedOffer?.total_amount || '0')) : 0;

      // Create booking request
      const bookingRequest = {
        offerId: selectedOffer?.id,
        passengers: passengerForms.map(passenger => {
          const phoneNumber = `${passenger.phone_country_code}${passenger.phone_number.replace(/[^\d]/g, '')}`;
          console.log(`Passenger ${passenger.id} phone: ${passenger.phone_country_code} + ${passenger.phone_number} = ${phoneNumber}`);
          
          return {
            id: passenger.id,
            title: passenger.title,
            given_name: passenger.given_name,
            family_name: passenger.family_name,
            email: passenger.email,
            phone_number: phoneNumber, // Include country code and clean number
            gender: passenger.gender === 'male' ? 'm' : 'f',
            born_on: passenger.born_on, // Send the date as is, let Duffel handle validation
          };
        }),
        payments: [{
          type: "balance",
          currency: selectedOffer?.total_currency || "USD",
          amount: selectedOffer?.total_amount || "0" // Send original offer amount to Duffel
        }],
        luggage_fees: luggageFees.toFixed(2),
        ancillaries_fees: ancillariesFees.toFixed(2),
        // Include base amount information if available
        base_amount: selectedOffer?.base_amount,
        base_currency: selectedOffer?.base_currency,
        // Include ancillaries data if available
        ancillaries: ancillariesPayload ? ancillariesPayload : undefined
      };

      console.log('Sending booking request:', JSON.stringify(bookingRequest, null, 2));
      
      // Check authentication before making the request
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      console.log('Auth check - Session:', session ? 'Available' : 'None');
      console.log('Auth check - Error:', authError);
      console.log('Auth check - Token:', session?.access_token ? 'Present' : 'Missing');
      
      if (authError || !session?.access_token) {
        console.error('Authentication error:', authError);
        toast({
          title: "Authentication Error",
          description: "Please log in again to complete your booking.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Session token available, making booking request...');
      
      const { data: bookingResults, error } = await supabase.functions.invoke('duffel-booking', {
        body: bookingRequest,
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast({
        title: t('booking.bookingSuccessful'),
        description: t('booking.bookingSuccessfulDesc'),
      });

      // Redirect to bookings page
      navigate(`/${i18n.language}/bookings`);
    } catch (error: any) {
      console.error('Error booking flight:', error);
      console.error('Error details:', error);
      
      let errorMessage = error.message || t('booking.bookingFailed');
      
      // Handle specific error types
      if (error.status === 401) {
        errorMessage = "Authentication failed. Please log in again to complete your booking.";
      } else if (error.error) {
        errorMessage = error.error;
      }
      
      toast({
        title: t('booking.bookingFailed'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };
  
  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    
    if (pendingBooking) {
      setPendingBooking(false);
      // Proceed with booking after successful authentication
      await performBooking();
    }
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getDuration = (segments: any[]) => {
    if (!segments.length) return '0h 0m';
    
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    
    const departure = new Date(firstSegment.departing_at);
    const arrival = new Date(lastSegment.arriving_at);
    
    const diffMs = arrival.getTime() - departure.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
  };

  const getStops = (segments: any[]) => {
    const stops = Math.max(0, segments.length - 1);
    if (stops === 0) return t('flight.direct');
    if (stops === 1) return `1 ${t('flight.stop')}`;
    return `${stops} ${t('flight.stops')}`;
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
      return exchangeRates[base];
    }
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

  const calculateTotalPrice = () => {
    if (!selectedOffer) return 0;
    
    let basePrice = parseFloat(selectedOffer.total_amount);
    let luggagePrice = 0;
    let ancillariesPrice = 0;
    
    // Calculate luggage costs
    passengerForms.forEach(passenger => {
      if (passenger.luggage) {
        const checkedOption = luggageOptions.find(opt => opt.type === 'checked' && opt.weight === '23kg');
        const carryOnOption = luggageOptions.find(opt => opt.type === 'carry_on' && opt.weight === '10kg');
        
        if (checkedOption) luggagePrice += passenger.luggage.checked * checkedOption.price;
        if (carryOnOption) luggagePrice += passenger.luggage.carry_on * carryOnOption.price;
      }
    });
    
    // Calculate ancillaries costs
    if (ancillariesMetadata) {
      ancillariesPrice = parseFloat(ancillariesMetadata.offer_total_amount) - basePrice;
    }
    
    return basePrice + luggagePrice + ancillariesPrice;
  };

  if (!selectedOffer) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#61936f] mx-auto mb-4"></div>
          <p className="text-[#1d1d1e]">{t('details.title')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  // Get search ID from current URL
                  const searchIdFromUrl = flightDataPersistence.getSearchIdFromUrl(window.location.href);
                  console.log('Go back to research - Current URL:', window.location.href);
                  console.log('Go back to research - Search ID from URL:', searchIdFromUrl);
                  
                  if (searchIdFromUrl) {
                    // Load search data to get original search parameters
                    const searchData = await flightDataPersistence.loadFlightDataBySearchId(searchIdFromUrl);
                    console.log('Go back to research - Loaded search data:', searchData);
                    if (searchData) {
                      // Create search URL with original parameters
                      const searchUrl = flightDataPersistence.createSearchUrl(searchData.searchParams, i18n.language);
                      console.log('Go back to research - Created search URL:', searchUrl);
                      navigate(searchUrl);
                    } else {
                      // Fallback to basic flights URL
                      console.log('Go back to research - No search data found, using fallback URL');
                      navigate(`/${i18n.language}/booking/internal-flights`);
                    }
                  } else {
                    // No search ID, go to basic flights URL
                    console.log('Go back to research - No search ID found, using fallback URL');
                    navigate(`/${i18n.language}/booking/internal-flights`);
                  }
                }}
                className="text-[#1d1d1e] hover:text-[#61936f]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('details.backToSearch')}
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-lg font-semibold text-[#1d1d1e]">
                {t('details.title')}
              </h1>
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
              {isStale && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                  <Clock className="h-4 w-4" />
                  <span>Offers may be expired - Refresh recommended</span>
                </div>
              )}
            </div>
            
            {/* Progress Steps */}
            <div className="hidden md:flex items-center space-x-4">
              <div className={cn(
                "flex items-center space-x-2",
                currentStep === 'passengers' ? "text-[#61936f]" : "text-[#62626a]"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  currentStep === 'passengers' ? "bg-[#61936f] text-white" : "bg-gray-200 text-gray-600"
                )}>
                  1
                </div>
                <span className="text-sm font-medium">{t('steps.passengers')}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-[#62626a]" />
              <div className={cn(
                "flex items-center space-x-2",
                currentStep === 'ancillaries' ? "text-[#61936f]" : "text-[#62626a]"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  currentStep === 'ancillaries' ? "bg-[#61936f] text-white" : "bg-gray-200 text-gray-600"
                )}>
                  2
                </div>
                <span className="text-sm font-medium">{t('steps.ancillaries')}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-[#62626a]" />
              <div className={cn(
                "flex items-center space-x-2",
                currentStep === 'luggage' ? "text-[#61936f]" : "text-[#62626a]"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  currentStep === 'luggage' ? "bg-[#61936f] text-white" : "bg-gray-200 text-gray-600"
                )}>
                  3
                </div>
                <span className="text-sm font-medium">{t('steps.luggage')}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-[#62626a]" />
              <div className={cn(
                "flex items-center space-x-2",
                currentStep === 'payment' ? "text-[#61936f]" : "text-[#62626a]"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  currentStep === 'payment' ? "bg-[#61936f] text-white" : "bg-gray-200 text-gray-600"
                )}>
                  4
                </div>
                <span className="text-sm font-medium">{t('steps.payment')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Flight Details - Left Side */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plane className="h-5 w-5 text-[#61936f]" />
                  <span>{t('flight.details')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Flight Summary */}
                <div className="space-y-4">
                  {selectedOffer.slices.map((slice, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[#61936f] border-[#61936f]">
                          {index === 0 ? t('flight.outbound') : t('flight.return')}
                        </Badge>
                        <span className="text-sm text-[#62626a]">
                          {formatDate(slice.segments[0].departing_at)}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {slice.segments.map((segment, segIndex) => (
                          <div key={segIndex} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="text-center">
                                  <p className="font-semibold text-lg">
                                    {formatTime(segment.departing_at)}
                                  </p>
                                  <p className="text-sm text-[#62626a]">
                                    {segment.origin.iata_code}
                                  </p>
                                </div>
                                <div className="flex-1 flex items-center justify-center">
                                  <div className="flex-1 h-px bg-gray-300"></div>
                                  <Plane className="h-4 w-4 text-[#61936f] mx-2" />
                                  <div className="flex-1 h-px bg-gray-300"></div>
                                </div>
                                <div className="text-center">
                                  <p className="font-semibold text-lg">
                                    {formatTime(segment.arriving_at)}
                                  </p>
                                  <p className="text-sm text-[#62626a]">
                                    {segment.destination.iata_code}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm text-[#62626a]">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-3 w-3" />
                                <span>{getDuration([segment])}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-3 w-3" />
                                <span>{getStops([segment])}</span>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">
                                    {segment.marketing_carrier.name}
                                  </p>
                                  <p className="text-xs text-[#62626a]">
                                    {t('flight.flight')} {segment.marketing_carrier.iata_code}
                                  </p>
                                </div>
                                {segment.aircraft && (
                                  <div className="text-right">
                                    <p className="text-xs text-[#62626a]">
                                      {segment.aircraft.name}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Price Summary */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-[#1d1d1e]">{t('payment.priceBreakdown')}</h3>
                  <div className="space-y-2 text-sm">
                    {selectedOffer.base_amount && selectedOffer.base_currency && (
                      <>
                        <div className="flex justify-between">
                          <span>Base Fare</span>
                          <span>{selectedOffer.base_currency} {selectedOffer.base_amount}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Taxes & Fees</span>
                          <span>{selectedOffer.total_currency} {(parseFloat(selectedOffer.total_amount) - parseFloat(selectedOffer.base_amount)).toFixed(2)}</span>
                        </div>
                        <Separator />
                      </>
                    )}
                    <div className="flex justify-between">
                      <span>{t('payment.baseFare')}</span>
                      <span>{selectedOffer.total_currency} {selectedOffer.total_amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('payment.luggageFees')}</span>
                      <span>USD {passengerForms.reduce((total, p) => {
                        const checkedPrice = luggageOptions.find(opt => opt.type === 'checked' && opt.weight === '23kg')?.price || 0;
                        const carryOnPrice = luggageOptions.find(opt => opt.type === 'carry_on' && opt.weight === '10kg')?.price || 0;
                        return total + (p.luggage?.checked || 0) * checkedPrice + (p.luggage?.carry_on || 0) * carryOnPrice;
                      }, 0)}</span>
                    </div>
                    {ancillariesMetadata && (
                      <div className="flex justify-between">
                        <span>{t('payment.ancillariesFees')}</span>
                        <span>{ancillariesMetadata.offer_total_currency} {(parseFloat(ancillariesMetadata.offer_total_amount) - parseFloat(selectedOffer.total_amount)).toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>{t('payment.total')}</span>
                      <div className="flex items-center gap-2">
                        {isDev && (
                          <Badge variant="secondary" className="text-xs">
                            {getDevModeBadge()}
                          </Badge>
                        )}
                        <span className={isDev ? "line-through text-gray-500" : ""}>
                          {selectedOffer.total_currency} {calculateTotalPrice().toFixed(2)}
                        </span>
                        {isDev && (
                          <span className="text-green-600 font-bold">
                            {selectedOffer.total_currency} 0.00
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Conditions */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-[#1d1d1e]">{t('booking.conditions')}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>
                        {t('booking.changes')}: {selectedOffer.conditions.change_before_departure?.allowed ? t('booking.allowed') : t('booking.notAllowed')}
                        {selectedOffer.conditions.change_before_departure?.allowed && selectedOffer.conditions.change_before_departure?.penalty_amount && (
                          <span className="text-yellow-600 ml-2">
                            (Fee: {formatPenalty(selectedOffer.conditions.change_before_departure.penalty_amount, selectedOffer.conditions.change_before_departure.penalty_currency)})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>
                        {t('booking.refunds')}: {selectedOffer.conditions.refund_before_departure?.allowed ? t('booking.allowed') : t('booking.notAllowed')}
                        {selectedOffer.conditions.refund_before_departure?.allowed && selectedOffer.conditions.refund_before_departure?.penalty_amount && (
                          <span className="text-yellow-600 ml-2">
                            (Fee: {formatPenalty(selectedOffer.conditions.refund_before_departure.penalty_amount, selectedOffer.conditions.refund_before_departure.penalty_currency)})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Passenger Forms - Right Side */}
          <div className="lg:col-span-2 space-y-6">
            {currentStep === 'passengers' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-[#1d1d1e] mb-2">
                    {t('details.passengerInfo')}
                  </h2>
                  <p className="text-[#62626a]">
                    {t('details.passengerInfoDesc')}
                  </p>
                </div>

                {passengerForms.map((passenger, index) => (
                  <Card key={passenger.id}>
                    <Collapsible 
                      open={expandedPassengers.has(passenger.id)}
                      onOpenChange={() => togglePassenger(passenger.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-[#61936f] text-white rounded-full flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </div>
                              <div>
                                                              <CardTitle className="text-lg">
                                {t('details.passenger')} {index + 1}
                              </CardTitle>
                              <CardDescription>
                                {passenger.given_name && passenger.family_name 
                                  ? `${passenger.given_name} ${passenger.family_name}`
                                  : t('details.clickToAddDetails')
                                }
                              </CardDescription>
                              </div>
                            </div>
                            {expandedPassengers.has(passenger.id) ? (
                              <ChevronUp className="h-5 w-5 text-[#62626a]" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-[#62626a]" />
                            )}
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <CardContent className="space-y-4">
                          {/* Fill with profile info button */}
                          {profile && (
                            <div className="flex justify-end mb-4">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fillWithProfileInfo(passenger.id)}
                                className="text-sm"
                              >
                                <User className="h-4 w-4 mr-2" />
                                {t('passenger.fillWithMyInfo')}
                              </Button>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`title-${passenger.id}`}>{t('passenger.title')}</Label>
                              <Select 
                                value={passenger.title} 
                                onValueChange={(value) => updatePassengerForm(passenger.id, 'title', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t('passenger.selectTitle')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mr">{t('passenger.mr')}</SelectItem>
                                  <SelectItem value="mrs">{t('passenger.mrs')}</SelectItem>
                                  <SelectItem value="ms">{t('passenger.ms')}</SelectItem>
                                  <SelectItem value="dr">{t('passenger.dr')}</SelectItem>
                                  <SelectItem value="miss">{t('passenger.miss')}</SelectItem>
                                  <SelectItem value="master">{t('passenger.master')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor={`gender-${passenger.id}`}>{t('passenger.gender')}</Label>
                              <Select 
                                value={passenger.gender} 
                                onValueChange={(value) => updatePassengerForm(passenger.id, 'gender', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t('passenger.selectGender')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="male">{t('passenger.male')}</SelectItem>
                                  <SelectItem value="female">{t('passenger.female')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor={`given-name-${passenger.id}`}>{t('passenger.firstName')}</Label>
                              <Input
                                id={`given-name-${passenger.id}`}
                                value={passenger.given_name}
                                onChange={(e) => updatePassengerForm(passenger.id, 'given_name', e.target.value)}
                                placeholder={t('passenger.enterFirstName')}
                              />
                            </div>

                            <div>
                              <Label htmlFor={`family-name-${passenger.id}`}>{t('passenger.lastName')}</Label>
                              <Input
                                id={`family-name-${passenger.id}`}
                                value={passenger.family_name}
                                onChange={(e) => updatePassengerForm(passenger.id, 'family_name', e.target.value)}
                                placeholder={t('passenger.enterLastName')}
                              />
                            </div>

                            <div>
                              <Label htmlFor={`email-${passenger.id}`}>{t('passenger.email')}</Label>
                              <Input
                                id={`email-${passenger.id}`}
                                type="email"
                                value={passenger.email}
                                onChange={(e) => updatePassengerForm(passenger.id, 'email', e.target.value)}
                                placeholder={t('passenger.enterEmail')}
                              />
                            </div>

                            <div>
                              <Label htmlFor={`phone-${passenger.id}`}>{t('passenger.phoneNumber')}</Label>
                              <PhoneInput
                                value={passenger.phone_number || ''}
                                onChange={val => updatePassengerForm(passenger.id, 'phone_number', val)}
                                countryCode={passenger.phone_country_code || '+1'}
                                onCountryCodeChange={val => updatePassengerForm(passenger.id, 'phone_country_code', val)}
                              />
                            </div>

                            <div>
                              <DatePicker
                                date={passenger.born_on ? (() => {
                                  const [year, month, day] = passenger.born_on.split('-').map(Number);
                                  return new Date(year, month - 1, day);
                                })() : undefined}
                                setDate={date => updatePassengerForm(passenger.id, 'born_on', date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '')}
                                label={t('passenger.dateOfBirth')}
                                placeholder={t('passenger.selectDateOfBirth')}
                                maxYear={new Date().getFullYear()}
                                disabledDates={(date) => date > new Date()}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('passenger.passportNumber')}</Label>
                              <Input
                                value={passenger.passport_number}
                                onChange={e => updatePassengerForm(passenger.id, 'passport_number', e.target.value)}
                                placeholder={t('passenger.enterPassportNumber')}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('passenger.passportCountry')}</Label>
                              <Select
                                value={passenger.passport_country}
                                onValueChange={val => updatePassengerForm(passenger.id, 'passport_country', val)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t('passenger.selectPassportCountry')} />
                                </SelectTrigger>
                                <SelectContent>
                                  {PASSPORT_COUNTRIES.map(c => (
                                    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <DatePicker
                                date={passenger.passport_expiry ? (() => {
                                  const [year, month, day] = passenger.passport_expiry.split('-').map(Number);
                                  return new Date(year, month - 1, day);
                                })() : undefined}
                                setDate={date => updatePassengerForm(passenger.id, 'passport_expiry', date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '')}
                                label={t('passenger.passportExpiry')}
                                placeholder={t('passenger.selectPassportExpiry')}
                                minYear={new Date().getFullYear()}
                                maxYear={new Date().getFullYear() + 20}
                                disabledDates={(date) => date < new Date()}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}

                <div className="flex justify-end">
                  <Button
                    onClick={handleNextStep}
                    className="bg-[#61936f] hover:bg-[#4a7a5a] text-white"
                  >
                    {t('navigation.continueToAncillaries')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'ancillaries' && selectedOffer && (
              <AncillariesStep
                offerId={selectedOffer.id}
                passengers={passengerForms}
                onAncillariesSelected={handleAncillariesSelected}
                onBack={handlePreviousStep}
                onContinue={handleNextStep}
                selectedAncillaries={ancillariesPayload}
                ancillariesMetadata={ancillariesMetadata}
              />
            )}

            {currentStep === 'luggage' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-[#1d1d1e] mb-2">
                    Luggage Selection
                  </h2>
                  <p className="text-[#62626a]">
                    Choose your luggage options for each passenger.
                  </p>
                </div>

                {passengerForms.map((passenger, index) => (
                  <Card key={passenger.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Luggage className="h-5 w-5 text-[#61936f]" />
                        <span>Passenger {index + 1}: {passenger.given_name} {passenger.family_name}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Checked Luggage */}
                      <div className="space-y-3">
                        <h3 className="font-medium text-[#1d1d1e]">Checked Luggage</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {luggageOptions.filter(opt => opt.type === 'checked').map((option) => (
                            <div
                              key={option.weight}
                              className={cn(
                                "border rounded-lg p-4 cursor-pointer transition-colors",
                                (passenger.luggage?.checked || 0) > 0
                                  ? "border-[#61936f] bg-[#61936f]/5"
                                  : "border-gray-200 hover:border-gray-300"
                              )}
                              onClick={() => updateLuggage(passenger.id, 'checked', 
                                (passenger.luggage?.checked || 0) > 0 ? 0 : 1
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{option.weight}</p>
                                  <p className="text-sm text-[#62626a]">Checked bag</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">
                                    {option.price === 0 ? 'Free' : `$${option.price}`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Carry-on Luggage */}
                      <div className="space-y-3">
                        <h3 className="font-medium text-[#1d1d1e]">Carry-on Luggage</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {luggageOptions.filter(opt => opt.type === 'carry_on').map((option) => (
                            <div
                              key={option.weight}
                              className={cn(
                                "border rounded-lg p-4 cursor-pointer transition-colors",
                                (passenger.luggage?.carry_on || 0) > 0
                                  ? "border-[#61936f] bg-[#61936f]/5"
                                  : "border-gray-200 hover:border-gray-300"
                              )}
                              onClick={() => updateLuggage(passenger.id, 'carry_on', 
                                (passenger.luggage?.carry_on || 0) > 0 ? 0 : 1
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{option.weight}</p>
                                  <p className="text-sm text-[#62626a]">Carry-on bag</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">
                                    {option.price === 0 ? 'Free' : `$${option.price}`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('navigation.backToAncillaries')}
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    className="bg-[#61936f] hover:bg-[#4a7a5a] text-white"
                  >
                    {t('navigation.continueToPayment')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'payment' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-[#1d1d1e] mb-2">
                    Payment & Confirmation
                  </h2>
                  <p className="text-[#62626a]">
                    Review your booking details and complete payment.
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Booking Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <h3 className="font-medium text-[#1d1d1e]">Passengers</h3>
                      {passengerForms.map((passenger, index) => (
                        <div key={passenger.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">
                              {passenger.title} {passenger.given_name} {passenger.family_name}
                            </p>
                            <p className="text-sm text-[#62626a]">{passenger.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-[#62626a]">
                              {passenger.luggage?.checked || 0} checked, {passenger.luggage?.carry_on || 0} carry-on
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h3 className="font-medium text-[#1d1d1e]">Price Breakdown</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Base fare</span>
                          <span>{selectedOffer.total_currency} {selectedOffer.total_amount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('payment.luggageFees')}</span>
                          <span>USD {passengerForms.reduce((total, p) => {
                            const checkedPrice = luggageOptions.find(opt => opt.type === 'checked' && opt.weight === '23kg')?.price || 0;
                            const carryOnPrice = luggageOptions.find(opt => opt.type === 'carry_on' && opt.weight === '10kg')?.price || 0;
                            return total + (p.luggage?.checked || 0) * checkedPrice + (p.luggage?.carry_on || 0) * carryOnPrice;
                          }, 0)}</span>
                        </div>
                        {ancillariesMetadata && (
                          <div className="flex justify-between">
                            <span>{t('payment.ancillariesFees')}</span>
                            <span>{ancillariesMetadata.offer_total_currency} {(parseFloat(ancillariesMetadata.offer_total_amount) - parseFloat(selectedOffer.total_amount)).toFixed(2)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-semibold text-lg">
                          <span>{t('payment.total')}</span>
                          <div className="flex items-center gap-2">
                            {isDev && (
                              <Badge variant="secondary" className="text-xs">
                                {getDevModeBadge()}
                              </Badge>
                            )}
                            <span className={isDev ? "line-through text-gray-500" : ""}>
                              {selectedOffer.total_currency} {calculateTotalPrice().toFixed(2)}
                            </span>
                            {isDev && (
                              <span className="text-green-600 font-bold">
                                {selectedOffer.total_currency} 0.00
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">{t('payment.importantInfo')}</p>
                          <p className="text-sm text-blue-700 mt-1">
                            {t('payment.importantInfoDesc')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('navigation.backToLuggage')}
                  </Button>
                  <Button
                    onClick={handleBooking}
                    disabled={paymentProcessing || isExpired || isStale}
                    className="bg-[#61936f] hover:bg-[#4a7a5a] text-white"
                  >
                    {paymentProcessing ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        {t('payment.processing')}
                      </>
                    ) : (
                      <>
                        {t('payment.payNow')} (
                        {isDev ? (
                          <span className="text-green-600 font-bold">
                            {selectedOffer.total_currency} 0.00
                          </span>
                        ) : (
                          `${selectedOffer.total_currency} ${calculateTotalPrice().toFixed(2)}`
                        )}
                        )
                        <CheckCircle className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        title="Sign in to complete your booking"
        description="Please sign in or create an account to complete your flight booking."
        defaultTab="signin"
      />
    </div>
  );
} 