import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useCreateTrip } from "@/hooks/useCreateTrip";
import { AnimatePresence } from 'framer-motion';
import type { DateRange } from "react-day-picker";
import { LocationDetails, HeroProps } from '@/components/subtrip/subtrip-types';

interface CreateTripProps extends HeroProps {
  embedded?: boolean;
}

import { supabase } from "@/integrations/supabase/client";

// Import section components
import ActivitySelection from '@/components/subtrip/subtrip-sections/ActivitySelection';
import CalendarSelection from '@/components/subtrip/subtrip-sections/CalendarSelection';
import LocationPicker from '@/components/subtrip/subtrip-sections/LocationPicker';
import ZapAnimation from '@/components/subtrip/subtrip-sections/ZapAnimation';
import TripInterests from '@/components/subtrip/subtrip-sections/TripInterests';
import TinderOptions from '@/components/subtrip/subtrip-sections/TinderOptions';
import TinderLocationBudget from '@/components/subtrip/subtrip-sections/TinderLocationBudget';
import TravelLogistics from '@/components/subtrip/subtrip-sections/TravelLogistics';
import AccommodationSelector from '@/components/subtrip/subtrip-sections/AccommodationSelector';
import PeopleBudget from '@/components/subtrip/subtrip-sections/PeopleBudget';
import RoadTripVehicle from '@/components/subtrip/subtrip-sections/RoadTripVehicle';
import RoadTripLocations from '@/components/subtrip/subtrip-sections/RoadTripLocations';
import RoadTripDetails from '@/components/subtrip/subtrip-sections/RoadTripDetails';
import RoadTripInterests from '@/components/subtrip/subtrip-sections/RoadTripInterests';
import PetQuestion from '@/components/subtrip/subtrip-sections/PetQuestion';
import ActivityTimeSelector from '@/components/subtrip/subtrip-sections/ActivityTimeSelector';
import StepIndicator from '@/components/subtrip/subtrip-sections/StepIndicator';

// Import dialog components
import { AuthModal } from "@/components/auth/AuthModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import CustomActivityDialog from '@/components/subtrip/subtrip-dialogs/CustomActivityDialog';
import LoadingDialog from '@/components/subtrip/subtrip-dialogs/LoadingDialog';
import { FreeTripDialog } from '@/components/subtrip/subtrip-dialogs/FreeTripDialog';
import ProfileCreationDialog from '@/components/subtrip/subtrip-dialogs/ProfileCreationDialog';

// Import helper functions
import { countryCurrencyMap } from '@/components/subtrip/subtrip-utils/helpers';
import useTranslatedData from '@/components/subtrip/subtrip-utils/data';
import { validateFreeTrip, recordFreeTrip, getTripTypeFromActivity } from '@/components/subtrip/subtrip-utils/freeTripValidation';

// Add new imports
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { PencilLine, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const CreateTrip = memo(({ session, onTripCreated, embedded = false }: CreateTripProps): JSX.Element => {
    const { t } = useTranslation('home');
    const { currencies } = useTranslatedData();
    const { toast } = useToast();
    const { createTrip, isLoading: isCreatingTripFromHook } = useCreateTrip();
    const navigate = useNavigate();
    const { lang } = useParams();
    const MAX_SELECTIONS = 3;
    const MAX_TRIP_INTERESTS = 15; // Maximum number of interests that can be selected
    
    // Ref for focusing on step content
    const stepContentRef = useRef<HTMLDivElement>(null);
  
    // Utility function to scroll to top
    const scrollToTop = () => {
      if (embedded) {
        // When embedded, dispatch a custom event to notify the parent component
        window.dispatchEvent(new CustomEvent('trip-step-changed', { 
          detail: { step: currentStep } 
        }));
      } else {
        // When not embedded, scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    // Function to focus on step content
    const focusOnStepContent = () => {
      if (stepContentRef.current) {
        // Focus on the step content container
        stepContentRef.current.focus();
        // Scroll the step content into view if needed
        stepContentRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    };
  
    // State variables
    const [location, setLocation] = useState<string>("");
    const [coordinates, setCoordinates] = useState<[number, number]>([0, 0]);
    const [isMobile, setIsMobile] = useState(false);
    const [currentStep, setCurrentStep] = useState<'activity' | 'location-picker' | 'tinder-options' | 'calendar' | 'trip-interests' | 'travel-logistics' | 'accommodation' | 'travel-details' | 'road-trip-locations' | 'road-trip-vehicle' | 'road-trip-interests' | 'tinder-location-budget' | 'people-budget' | 'road-trip-details' | 'pet-question' | 'title-description' | 'activity-time'>('activity');
    const [selectedActivity, setSelectedActivity] = useState<'plan-trip' | 'tinder-date' | 'friends' | 'roadtrip' | null>(null);
    const [selectedTinderOptions, setSelectedTinderOptions] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [customActivityDialogOpen, setCustomActivityDialogOpen] = useState(false);
    const [customActivity, setCustomActivity] = useState("");
    const [customActivities, setCustomActivities] = useState<string[]>([]);
    const [selectedTripInterests, setSelectedTripInterests] = useState<string[]>([]);
    const [departureLocation, setDepartureLocation] = useState<string>("");
    const [departureCoordinates, setDepartureCoordinates] = useState<[number, number]>([0, 0]);
    const [transportMode, setTransportMode] = useState<string | null>(null);
    const [isElectricCar, setIsElectricCar] = useState<boolean>(false);
    const [isCarpool, setIsCarpool] = useState<boolean>(false);
    const [isLocating, setIsLocating] = useState(false);
    const [accommodation, setAccommodation] = useState<string | null>(null);
    const [adultCount, setAdultCount] = useState<number>(1);
    const [childCount, setChildCount] = useState<number>(0);
    const [maxBudget, setMaxBudget] = useState<string>("");
    const [isCreatingTrip, setIsCreatingTrip] = useState(false);
    const [showZapAnimation, setShowZapAnimation] = useState(false);
    const [zapAnimationType, setZapAnimationType] = useState<'ZAPTRIP' | 'ZAPOUT' | 'ZAPROAD'>('ZAPTRIP');
      const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileCreationDialog, setShowProfileCreationDialog] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [tinderLocation, setTinderLocation] = useState<string>("");
    const [tinderCoordinates, setTinderCoordinates] = useState<[number, number]>([0, 0]);
    const [minBudget, setMinBudget] = useState<string>("");
    const [isTinderLocating, setIsTinderLocating] = useState(false);
    const [isCreatingTinderDate, setIsCreatingTinderDate] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
    const [currencySymbol, setCurrencySymbol] = useState<string>("$");
    const [isCreatingFriendActivity, setIsCreatingFriendActivity] = useState(false);
    const [startLocation, setStartLocation] = useState<string>("");
    const [startCoordinates, setStartCoordinates] = useState<[number, number]>([0, 0]);
    const [intermediateLocations, setIntermediateLocations] = useState<Array<{name: string, coordinates: [number, number]}>>([]);
    const [endLocation, setEndLocation] = useState<string>("");
    const [endCoordinates, setEndCoordinates] = useState<[number, number]>([0, 0]);
    const [isStartLocating, setIsStartLocating] = useState(false);
    const [isEndLocating, setIsEndLocating] = useState(false);
    const [roadTripVehicleType, setRoadTripVehicleType] = useState<'car' | 'electric-car' | 'bike' | 'bicycle' | 'rv' | null>(null);
    const [roadTripAdults, setRoadTripAdults] = useState<number>(1);
    const [roadTripKids, setRoadTripKids] = useState<number>(0);
    const [hasPets, setHasPets] = useState<boolean | null>(null);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [selectedRoadTripInterests, setSelectedRoadTripInterests] = useState<string[]>([]);
  
    // Background image state
    const [backgroundImage, setBackgroundImage] = useState<string>("");
  
    // Add new state for title and description
    const [title, setTitle] = useState<string>("");
    const [personalDescription, setPersonalDescription] = useState<string>("");
  
    // Add new state for activity times
    const [selectedActivityTimes, setSelectedActivityTimes] = useState<string[]>([]);
  
    // Add new state for showBudget
    const [showBudget, setShowBudget] = useState<boolean>(false);
  
    // Add new state for free trip validation
    const [showFreeTripDialog, setShowFreeTripDialog] = useState(false);
    const [freeTripStatus, setFreeTripStatus] = useState<{
      can_use: boolean;
      remaining: number | null;
      next_reset: string | null;
      message: string;
    } | null>(null);
  
    // Select background image on mount
    useEffect(() => {
      const desktopImages = ['/zaparound-uploads/create-trip1.webp', '/zaparound-uploads/create-trip1.webp'];
      const mobileImages = ['/zaparound-uploads/create-trip2.webp', '/zaparound-uploads/create-trip2.webp'];
      
      const randomIndex = Math.floor(Math.random() * (isMobile ? mobileImages.length : desktopImages.length));
      const selectedImage = isMobile ? mobileImages[randomIndex] : desktopImages[randomIndex];
      
      setBackgroundImage(selectedImage);
    }, [isMobile]);
    // Detect mobile device once on mount
    useEffect(() => {
      const checkMobile = () => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        return mobile;
      };
      
      const isMobileDevice = checkMobile();
      
      let resizeTimer: number;
      const handleResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          checkMobile();
        }, 100);
      };
      
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(resizeTimer);
      };
    }, []);

    // Effect to focus on step content when step changes
    useEffect(() => {
      if (embedded) {
        // Small delay to ensure the new step content is rendered
        const timer = setTimeout(focusOnStepContent, 150);
        return () => clearTimeout(timer);
      }
    }, [currentStep, embedded]);
  
    const handleSearch = () => {
      if (location && coordinates) {
        setCurrentStep('activity');
      }
    };
  
    const handleLocationChange = (newLocation: string, newCoordinates: [number, number]) => {
      setLocation(newLocation);
      setCoordinates(newCoordinates);
    };
  
    const handleLocationSelect = (newLocation: string, newCoordinates: [number, number]) => {
      setLocation(newLocation);
      setCoordinates(newCoordinates);
    };
  
    const handleActivitySelect = (activity: 'plan-trip' | 'tinder-date' | 'friends' | 'roadtrip') => {
      setSelectedActivity(activity);
    };
  
    const handleTripInterestSelect = (interestId: string) => {
      setSelectedTripInterests(prev => {
        // If already selected, remove it
        if (prev.includes(interestId)) {
          return prev.filter(id => id !== interestId);
        }
        
        // If at max selections, show toast and don't add
        if (prev.length >= MAX_TRIP_INTERESTS) {
          toast({
            title: t('interests.maxSelectionsReached'),
            description: t('interests.maxSelectionsDescription', { max: MAX_TRIP_INTERESTS }),
            variant: "destructive"
          });
          return prev;
        }
        
        // Add new selection
        return [...prev, interestId];
      });
    };
  
    const handleRoadTripInterestSelect = (interestId: string) => {
      setSelectedRoadTripInterests(prev => {
        if (prev.includes(interestId)) {
          return prev.filter(id => id !== interestId);
        }
        return [...prev, interestId];
      });
    };
  
    const handleTinderOptionSelect = (optionId: string) => {
      setSelectedTinderOptions(prev => {
        if (prev.includes(optionId)) {
          // Remove if already selected
          return prev.filter(id => id !== optionId);
        } else if (prev.length < MAX_SELECTIONS) {
          // Add if under the limit
          return [...prev, optionId];
        }
        return prev;
      });
    };
  
    const handleActivityTimeSelect = (timeId: string) => {
      setSelectedActivityTimes(prev => {
        if (prev.includes(timeId)) {
          return prev.filter(id => id !== timeId);
        }
        return [...prev, timeId];
      });
    };
  
    const handleDateSelect = useCallback((value: Date | DateRange | undefined) => {
      if (selectedActivity === 'tinder-date' || selectedActivity === 'friends') {
        // For tinder date and friends activity, we expect a single date
        setSelectedDate(value as Date);
      } else {
        // For trip planning, we expect a date range
        setDateRange(value as DateRange);
      }
    }, [selectedActivity]);
  
    const handleNext = (activityId?: 'plan-trip' | 'tinder-date' | 'friends' | 'roadtrip') => {
      console.log('handleNext called with activityId:', activityId);
      scrollToTop();
      
      // Use the passed activityId or fall back to selectedActivity state
      const currentActivity = activityId || selectedActivity;
      
      if (currentActivity === 'plan-trip') {
        console.log('ZAPTRIP');
        setZapAnimationType('ZAPTRIP');
        setShowZapAnimation(true);
        setTimeout(() => {
          setShowZapAnimation(false);
          setCurrentStep('title-description');
        }, 1500);
      } else if (currentActivity === 'tinder-date' || currentActivity === 'friends') {
        setZapAnimationType('ZAPOUT');
        setShowZapAnimation(true);
        setTimeout(() => {
          setShowZapAnimation(false);
          setCurrentStep('title-description');
        }, 1500);
      } else if (currentActivity === 'roadtrip') {
        setZapAnimationType('ZAPROAD');
        setShowZapAnimation(true);
        setTimeout(() => {
          setShowZapAnimation(false);
          setCurrentStep('title-description');
        }, 1500);
      }
    };
  
    // Update handleTitleDescriptionContinue function
    const handleTitleDescriptionContinue = () => {
      if (!title.trim()) {
        toast({
          title: t('form.titleDescription.titleRequired'),
          description: t('form.titleDescription.titleRequired'),
          variant: "destructive"
        });
        return;
      }

      // Navigate to appropriate next step based on activity type
      if (selectedActivity === 'plan-trip' || selectedActivity === 'roadtrip') {
        setCurrentStep('pet-question');
      } else if (selectedActivity === 'tinder-date' || selectedActivity === 'friends') {
        // For ZapOut, go to pet question first
        setCurrentStep('pet-question');
      }
    };

    // Update PetQuestion component navigation
    const handlePetQuestionContinue = (value: boolean) => {
      setHasPets(value);
      if (selectedActivity === 'plan-trip') {
        setCurrentStep('location-picker');
      } else if (selectedActivity === 'tinder-date' || selectedActivity === 'friends') {
        setCurrentStep('tinder-options');
      } else if (selectedActivity === 'roadtrip') {
        setCurrentStep('calendar');
      }
    };

    // Update TinderOptions navigation
    const handleTinderOptionsContinue = () => {
      scrollToTop();
      setCurrentStep('calendar');
    };

    // Update CalendarSelection navigation for ZapOut
    const handleCalendarContinue = () => {
      scrollToTop();
      if (selectedActivity === 'roadtrip') {
        setCurrentStep('road-trip-vehicle');
      } else if (selectedActivity === 'plan-trip') {
        setCurrentStep('trip-interests');
      } else if (selectedActivity === 'tinder-date' || selectedActivity === 'friends') {
        setCurrentStep('activity-time');
      }
    };

    // Update ActivityTimeSelector navigation
    const handleActivityTimeContinue = () => {
      scrollToTop();
      setCurrentStep('tinder-location-budget');
    };
  
    const handleContinue = async () => {
      // Scroll to top
      scrollToTop();
  
      // Check if user is logged in
      if (!session) {
        // Show auth modal if not logged in
        setShowAuthModal(true);
        return;
      }

      try {
        // Check if user has a subscription
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        // If user has no subscription, validate free trip usage
        if (userRole?.role === 'nosubs') {
          const tripType = getTripTypeFromActivity(selectedActivity!);
          if (!tripType) {
            throw new Error('Invalid activity type');
          }

          const validationResult = await validateFreeTrip(tripType);
          setFreeTripStatus(validationResult);

          if (validationResult.remaining === 0) {
            setShowFreeTripDialog(true);
            return;
          }
        }

        // User is logged in and can proceed with trip creation
        setIsCreatingTrip(true);
        
        // Prepare trip data
        const tripData: any = {
          title: title || `Trip to ${location}`,
          description: personalDescription || "Edit your description",
          location: location,
          coordinates: coordinates,
          startDate: selectedActivity === 'tinder-date' || selectedActivity === 'friends' 
            ? selectedDate 
            : dateRange?.from,
          endDate: selectedActivity === 'tinder-date' || selectedActivity === 'friends' 
            ? selectedDate 
            : dateRange?.to,
          tripType: selectedActivity === 'plan-trip' 
            ? 'ZapTrip' 
            : selectedActivity === 'roadtrip' 
              ? 'ZapRoad' 
              : 'ZapOut',
          adults: selectedActivity === 'roadtrip' ? roadTripAdults : adultCount,
          kids: selectedActivity === 'roadtrip' ? roadTripKids : childCount,
          transportationMode: transportMode || undefined,
          accommodationType: accommodation || undefined,
          budget: maxBudget || "0",
          currency: selectedCurrency || "USD",
          activityTimes: selectedActivityTimes
        };
        
        // Add appropriate additional fields based on trip type
        if (selectedActivity === 'plan-trip') {
          // For ZapTrip
          tripData.interests = selectedTripInterests;
          tripData.hasPets = hasPets;
          tripData.departureLocation = departureLocation;
          tripData.departureCoordinates = departureCoordinates;
        } else if (selectedActivity === 'roadtrip') {
          // For ZapRoad
          tripData.startingCity = startLocation;
          tripData.startingCityCoordinates = startCoordinates;
          tripData.endCity = endLocation;
          tripData.endCityCoordinates = endCoordinates;
          tripData.stopoverCities = intermediateLocations;
          tripData.car_type = roadTripVehicleType || '';
          tripData.has_electric_car = (roadTripVehicleType === 'electric-car') || (roadTripVehicleType === 'car' && isElectricCar === true);
          tripData.has_pets = hasPets === true;
          tripData.specialRequirements = "";
          tripData.interests = selectedRoadTripInterests;
        } else if (selectedActivity === 'tinder-date' || selectedActivity === 'friends') {
          // For ZapOut
          tripData.location = tinderLocation || location;
          tripData.coordinates = tinderCoordinates.length ? tinderCoordinates : coordinates;
          tripData.activityTypes = [...selectedTinderOptions, ...customActivities];
          tripData.activityTimes = selectedActivityTimes;
          tripData.minBudget = minBudget || "0";
          tripData.maxBudget = maxBudget || "100";
          tripData.currency = selectedCurrency;
          tripData.currency_symbol = currencySymbol;
          tripData.additionalNeeds = "";
        }
  
        // Create the trip
        const result = await createTrip(tripData);
        
        if (result && result[0] && result[0].id) {
          // If user has no subscription, record the free trip usage
          if (userRole?.role === 'nosubs') {
            const tripType = getTripTypeFromActivity(selectedActivity!);
            if (tripType) {
              await recordFreeTrip(tripType, result[0].id);
            }
          }
          
          // Call onTripCreated callback if provided
          onTripCreated?.();
          
          // Navigate to dashboard with language parameter
          const currentLang = lang || 'en';
          navigate(`/${currentLang}/dashboard`);
        }
      } catch (error) {
        console.error('Error creating trip:', error);
        toast({
          title: "Error",
          description: "Failed to create trip. Please try again."
        });
      } finally {
        setIsCreatingTrip(false);
      }
    };
  
    // Function that runs when auth is successful
    const handleAuthSuccess = () => {
      // Scroll to top
      scrollToTop();
      
      // Show profile creation dialog instead of directly continuing
      setShowProfileCreationDialog(true);
    };

    // Function that runs when profile creation is complete
    const handleProfileCreated = () => {
      // Close the profile creation dialog
      setShowProfileCreationDialog(false);
      
      // Add a quick 0.3 second delay for smooth transition
      // This prevents the popups from overlapping and creates a smooth flow
      setTimeout(() => {
        // After profile creation, try continue again
        handleContinue();
      }, 300);
    };
  
    const handleAddCustomActivity = () => {
      if (customActivity.trim()) {
        setCustomActivities(prev => [...prev, customActivity.trim()]);
        setCustomActivity("");
        setCustomActivityDialogOpen(false);
      }
    };
  
    const handleTinderLocationChange = async (newLocation: string, newCoordinates: [number, number]) => {
      setTinderLocation(newLocation);
      setTinderCoordinates(newCoordinates);
      
      // Get country from coordinates using reverse geocoding
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${newCoordinates[1]},${newCoordinates[0]}.json?access_token=pk.eyJ1IjoibWlzdGVyZnJhenoiLCJhIjoiY203M2ZnM3BoMDhpMTJqcTNiYWpkamIzNyJ9.2SlcuEPIL2yCJw5TIPunVQ&types=country`
        );
        const data = await response.json();
        
        if (data.features && data.features[0]) {
          const countryCode = data.features[0].properties.short_code?.toUpperCase();
  
          if (countryCode && countryCurrencyMap[countryCode]) {
            setSelectedCurrency(countryCurrencyMap[countryCode].code);
            setCurrencySymbol(countryCurrencyMap[countryCode].symbol);
          }
        }
      } catch (error) {
        console.error('Error getting country currency:', error);
      }
    };
  
    const handleCurrencyChange = (currency: string) => {
      setSelectedCurrency(currency);
      const selectedCurrencyData = currencies.find(c => c.value === currency);
      if (selectedCurrencyData) {
        setCurrencySymbol(selectedCurrencyData.symbol);
      }
    };
  
    // Add the tinder locate me function
    const handleTinderLocateMe = () => {
      setIsTinderLocating(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            
            // Use reverse geocoding to get location name
            fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibWlzdGVyZnJhenoiLCJhIjoiY203M2ZnM3BoMDhpMTJqcTNiYWpkamIzNyJ9.2SlcuEPIL2yCJw5TIPunVQ&types=place`
            )
              .then((response) => response.json())
              .then((data) => {
                if (data.features && data.features[0]) {
                  const placeName = data.features[0].place_name;
                  setTinderLocation(placeName);
                  setTinderCoordinates([longitude, latitude]);
                }
                
                // Get country for currency - separate call with country type
                fetch(
                  `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibWlzdGVyZnJhenoiLCJhIjoiY203M2ZnM3BoMDhpMTJqcTNiYWpkamIzNyJ9.2SlcuEPIL2yCJw5TIPunVQ&types=country`
                )
                  .then((response) => response.json())
                  .then((data) => {
                    if (data.features && data.features[0]) {
                      const countryCode = data.features[0].properties.short_code?.toUpperCase();
                      
                      if (countryCode && countryCurrencyMap[countryCode]) {
                        setSelectedCurrency(countryCurrencyMap[countryCode].code);
                        setCurrencySymbol(countryCurrencyMap[countryCode].symbol);
                      }
                    }
                  })
                  .catch((error) => {
                    console.error("Error getting country currency:", error);
                  });
              })
              .catch((error) => {
                console.error("Error getting location:", error);
              })
              .finally(() => {
                setIsTinderLocating(false);
              });
          },
          (error) => {
            console.error("Error getting location:", error);
            setIsTinderLocating(false);
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
        setIsTinderLocating(false);
      }
    };
  
    // Update PeopleBudget navigation
    const handlePeopleBudgetContinue = () => {
      scrollToTop();
      setCurrentStep('title-description');
    };
  
    // Update TinderLocationBudget navigation
    const handleTinderLocationBudgetContinue = () => {
      scrollToTop();
      setCurrentStep('title-description');
    };
  
    // Update RoadTripDetails navigation
    const handleRoadTripDetailsContinue = () => {
      scrollToTop();
      setCurrentStep('title-description');
    };
  
    return (
      <div 
        className={cn(
          "relative w-full",
          embedded ? "" : "min-h-screen",
          "flex flex-col",
          // Conditional background based on embedded prop
          embedded ? "bg-transparent" : "bg-white",
          // Safe area insets
          "safe-top safe-bottom"
        )}
        style={embedded ? undefined : { backgroundImage: `url(${backgroundImage})` }}
      >
        {!embedded && (
          <div
            className={cn(
              "absolute inset-0",
              "bg-black/50 backdrop-blur-[2px]",
              "z-1"
            )}
          />
        )}
        
        {/* Content container with higher z-index */}
        <div className="relative z-10 flex-1 flex flex-col">
          <ZapAnimation 
            show={showZapAnimation} 
            type={zapAnimationType} 
          />
          
          <div className={cn(
            "container mx-auto flex-1",
            "flex flex-col",
            "px-2 sm:px-4 md:px-6",
            // Adjust padding based on screen size
            "pt-2 sm:pt-4",
            // Ensure content is centered
            "items-center justify-start",
            // Handle very small screens
            "min-h-[60vh]",
            // Safe area insets
            "safe-left safe-right",
            // Remove any potential margins
            "m-0"
          )}>
            <div className={cn(
              "w-full max-w-5xl mx-auto",
              "text-center z-10",
              "flex flex-col flex-1"
            )}>
              <AnimatePresence mode="popLayout">
                <div 
                  ref={stepContentRef}
                  tabIndex={-1}
                  className={cn(
                    "flex-1",
                    "flex flex-col",
                    // Ensure content is centered
                    "items-center justify-center",
                    // Add some spacing
                    "gap-4",
                    // Handle overflow
                    "overflow-y-auto",
                    // Smooth scrolling
                    "scroll-smooth",
                    // Hide scrollbar but keep functionality
                    "scrollbar-none",
                    // Focus styles for accessibility
                    "focus:outline-none"
                  )}
                >
                  {currentStep === 'activity' && (
                    <div className={cn(
                      "hero-card w-full",
                      "bg-black/30 backdrop-blur-sm",
                      "p-4 sm:p-6 rounded-xl",
                      "my-2 sm:my-4",
                      "min-h-[300px]",
                      "flex flex-col items-center justify-center gap-4"
                    )}>
                      <StepIndicator currentStep={currentStep} selectedActivity={selectedActivity} />
                      <ActivitySelection 
                        selectedActivity={selectedActivity}
                        onSelectActivity={handleActivitySelect}
                        onNext={handleNext}
                        embedded={embedded}
                      />
                    </div>
                  )}

                  {currentStep === 'pet-question' && (
                    <div className={cn(
                      "hero-card w-full",
                      "bg-black/30 backdrop-blur-sm",
                      "p-4 sm:p-6 rounded-xl",
                      "my-2 sm:my-4",
                      "flex flex-col items-center justify-center gap-4"
                    )}>
                      <StepIndicator currentStep={currentStep} selectedActivity={selectedActivity} />
                      <PetQuestion
                        selectedActivity={selectedActivity}
                        onSetHasPets={handlePetQuestionContinue}
                        onBack={() => {
                          setCurrentStep('title-description');
                          setHasPets(null);
                        }}
                      />
                    </div>
                  )}

                  {currentStep === 'location-picker' && (
                    <>
                      <StepIndicator currentStep={currentStep} selectedActivity={selectedActivity} />
                      <LocationPicker
                        location={location}
                        isLoadingImage={false}
                        locationImage={null}
                        locationDetails={null}
                        onLocationChange={handleLocationChange}
                        onLocationSelect={handleLocationSelect}
                        onBack={() => {
                          scrollToTop();
                          setCurrentStep('pet-question');
                        }}
                        onContinue={() => {
                          scrollToTop();
                          setCurrentStep('calendar');
                        }}
                        onCurrencyChange={handleCurrencyChange}
                      />
                    </>
                  )}

                  {currentStep === 'tinder-options' && (
                    <div className={cn(
                      "hero-card w-full",
                      "bg-black/30 backdrop-blur-sm",
                      "p-4 sm:p-6 rounded-xl",
                      "my-2 sm:my-4",
                      "flex flex-col items-center justify-center gap-4"
                    )}>
                      <StepIndicator currentStep={currentStep} selectedActivity={selectedActivity} />
                      <TinderOptions
                        selectedActivity={selectedActivity}
                        selectedTinderOptions={selectedTinderOptions}
                        onSelectOption={handleTinderOptionSelect}
                        onOpenCustomActivityDialog={() => setCustomActivityDialogOpen(true)}
                        customActivities={customActivities}
                        onBack={() => {
                          scrollToTop();
                          setCurrentStep('pet-question');
                        }}
                        onContinue={handleTinderOptionsContinue}
                      />
                    </div>
                  )}

                  {currentStep === 'activity-time' && (
                    <>
                      <StepIndicator currentStep={currentStep} selectedActivity={selectedActivity} />
                      <ActivityTimeSelector
                        selectedTimes={selectedActivityTimes}
                        onSelectTime={handleActivityTimeSelect}
                        onBack={() => {
                          scrollToTop();
                          setCurrentStep('calendar');
                        }}
                        onContinue={handleActivityTimeContinue}
                        isHomepage={embedded}
                      />
                    </>
                  )}

                  {currentStep === 'tinder-location-budget' && (
                    <>
                      <StepIndicator currentStep={currentStep} selectedActivity={selectedActivity} />
                      <TinderLocationBudget
                        selectedActivity={selectedActivity === 'tinder-date' || selectedActivity === 'friends' ? selectedActivity : null}
                        tinderLocation={tinderLocation}
                        tinderCoordinates={tinderCoordinates}
                        minBudget={minBudget}
                        maxBudget={maxBudget}
                        selectedCurrency={selectedCurrency}
                        currencySymbol={currencySymbol}
                        isTinderLocating={isTinderLocating}
                        adultCount={adultCount}
                        childCount={childCount}
                        onTinderLocationChange={handleTinderLocationChange}
                        onTinderLocateMe={handleTinderLocateMe}
                        onMinBudgetChange={setMinBudget}
                        onMaxBudgetChange={setMaxBudget}
                        onCurrencyChange={handleCurrencyChange}
                        onAdultCountChange={setAdultCount}
                        onChildCountChange={setChildCount}
                        onBack={() => {
                          scrollToTop();
                          setCurrentStep('activity-time');
                        }}
                        onContinue={handleContinue}
                        showBudget={showBudget}
                        setShowBudget={setShowBudget}
                      />
                    </>
                  )}

                  {currentStep === 'calendar' && (
                    <>
                      <StepIndicator currentStep={currentStep} selectedActivity={selectedActivity} />
                      <CalendarSelection 
                        selectedActivity={selectedActivity}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        onContinue={handleCalendarContinue}
                        onBack={() => {
                          scrollToTop();
                          if (selectedActivity === 'tinder-date' || selectedActivity === 'friends') {
                            setCurrentStep('tinder-options');
                          } else if (selectedActivity === 'plan-trip') {
                            setCurrentStep('location-picker');
                          } else {
                            setCurrentStep('pet-question');
                          }
                        }}
                        isFinalStep={false}
                      />
                    </>
                  )}

                  {currentStep === 'trip-interests' && (
                    <>
                      <StepIndicator currentStep={currentStep} selectedActivity={selectedActivity} />
                      <div className="w-full max-w-4xl mx-auto">
                        <TripInterests
                          selectedTripInterests={selectedTripInterests}
                          onSelectInterest={handleTripInterestSelect}
                          expandedCategory={expandedCategory}
                          onToggleCategory={(category) => setExpandedCategory(prev => prev === category ? null : category)}
                          maxSelections={MAX_TRIP_INTERESTS}
                          onBack={() => {
                            scrollToTop();
                            setCurrentStep('calendar');
                          }}
                          onContinue={() => {
                            if (selectedTripInterests.length === 0) {
                              toast({
                                title: t('interests.noSelections'),
                                description: t('interests.selectAtLeastOne'),
                                variant: "destructive"
                              });
                              return;
                            }
                            scrollToTop();
                            setCurrentStep('travel-logistics');
                          }}
                        />
                      </div>
                    </>
                  )}

                  {currentStep === 'travel-logistics' && (
                    <>
                      <StepIndicator currentStep={currentStep} selectedActivity={selectedActivity} />
                      <TravelLogistics
                        departureLocation={departureLocation}
                        isLocating={isLocating}
                        transportMode={transportMode}
                        isElectricCar={isElectricCar}
                        isCarpool={isCarpool}
                        onDepartureLocationChange={(loc, coords) => {
                          setDepartureLocation(loc);
                          setDepartureCoordinates(coords);
                        }}
                        onLocateMe={() => {
                          setIsLocating(true);
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                const { latitude, longitude } = position.coords;
                                
                                // Use reverse geocoding to get location name
                                fetch(
                                  `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibWlzdGVyZnJhenoiLCJhIjoiY203M2ZnM3BoMDhpMTJqcTNiYWpkamIzNyJ9.2SlcuEPIL2yCJw5TIPunVQ&types=place`
                                )
                                  .then((response) => response.json())
                                  .then((data) => {
                                    if (data.features && data.features[0]) {
                                      const placeName = data.features[0].place_name;
                                      setDepartureLocation(placeName);
                                      setDepartureCoordinates([longitude, latitude]);
                                    }
                                  })
                                  .catch((error) => {
                                    console.error("Error getting location:", error);
                                  })
                                  .finally(() => {
                                    setIsLocating(false);
                                  });
                              },
                              (error) => {
                                console.error("Error getting location:", error);
                                setIsLocating(false);
                              }
                            );
                          } else {
                            console.error("Geolocation is not supported by this browser.");
                            setIsLocating(false);
                          }
                        }}
                        onTransportModeChange={setTransportMode}
                        onElectricCarChange={setIsElectricCar}
                        onCarpoolChange={setIsCarpool}
                        onCurrencyChange={(currency) => {
                          setSelectedCurrency(currency);
                          const selectedCurrencyData = currencies.find(c => c.value === currency);
                          if (selectedCurrencyData) {
                            setCurrencySymbol(selectedCurrencyData.symbol);
                          }
                        }}
                        onBack={() => setCurrentStep('trip-interests')}
                        onContinue={() => setCurrentStep('accommodation')}
                      />
                    </>
                  )}

                  {currentStep === 'accommodation' && (
                    <>
                      <StepIndicator currentStep={currentStep} selectedActivity={selectedActivity} />
                      <AccommodationSelector
                        accommodation={accommodation}
                        onAccommodationChange={setAccommodation}
                        onBack={() => {
                          scrollToTop();
                          setCurrentStep('travel-logistics');
                        }}
                        onContinue={() => {
                          scrollToTop();
                          setCurrentStep('people-budget');
                        }}
                      />
                    </>
                  )}

                  {currentStep === 'people-budget' && (
                    <>
                      <StepIndicator currentStep={currentStep} selectedActivity={selectedActivity} />
                      <PeopleBudget
                        adultCount={adultCount}
                        childCount={childCount}
                        maxBudget={maxBudget}
                        selectedCurrency={selectedCurrency}
                        currencySymbol={currencySymbol}
                        onAdultCountChange={setAdultCount}
                        onChildCountChange={setChildCount}
                        onMaxBudgetChange={setMaxBudget}
                        onCurrencyChange={handleCurrencyChange}
                        onBack={() => {
                          scrollToTop();
                          setCurrentStep('accommodation');
                        }}
                        onContinue={handleContinue}
                      />
                    </>
                  )}

                  {currentStep === 'road-trip-vehicle' && (
                    <>
                      <StepIndicator currentStep={currentStep} selectedActivity={selectedActivity} />
                      <RoadTripVehicle
                        vehicleType={roadTripVehicleType}
                        isElectricCar={isElectricCar}
                        onVehicleTypeChange={(type) => {
                          setRoadTripVehicleType(type);
                          // Reset electric car if not a car
                          if (type !== 'car') {
                            setIsElectricCar(false);
                          }
                        }}
                        onElectricCarChange={setIsElectricCar}
                        onBack={() => {
                          scrollToTop();
                          setCurrentStep('calendar');
                        }}
                        onContinue={() => {
                          scrollToTop();
                          setCurrentStep('road-trip-locations');
                        }}
                      />
                    </>
                  )}

                  {currentStep === 'road-trip-locations' && (
                    <>
                      <StepIndicator currentStep={currentStep} selectedActivity={selectedActivity} />
                      <RoadTripLocations
                        startLocation={startLocation}
                        startCoordinates={startCoordinates}
                        intermediateLocations={intermediateLocations}
                        endLocation={endLocation}
                        endCoordinates={endCoordinates}
                        isStartLocating={isStartLocating}
                        isEndLocating={isEndLocating}
                        onStartLocationChange={(loc, coords) => {
                          setStartLocation(loc);
                          setStartCoordinates(coords);
                        }}
                        onEndLocationChange={(loc, coords) => {
                          setEndLocation(loc);
                          setEndCoordinates(coords);
                        }}
                        onAddIntermediateLocation={(loc, coords) => {
                          setIntermediateLocations([...intermediateLocations, { name: loc, coordinates: coords }]);
                        }}
                        onRemoveIntermediateLocation={(index) => {
                          setIntermediateLocations(intermediateLocations.filter((_, i) => i !== index));
                        }}
                        onStartLocateMe={() => {
                          setIsStartLocating(true);
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                const { latitude, longitude } = position.coords;
                                
                                // Use reverse geocoding to get location name
                                fetch(
                                  `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibWlzdGVyZnJhenoiLCJhIjoiY203M2ZnM3BoMDhpMTJqcTNiYWpkamIzNyJ9.2SlcuEPIL2yCJw5TIPunVQ&types=place`
                                )
                                  .then((response) => response.json())
                                  .then((data) => {
                                    if (data.features && data.features[0]) {
                                      const placeName = data.features[0].place_name;
                                      setStartLocation(placeName);
                                      setStartCoordinates([longitude, latitude]);
                                    }
                                  })
                                  .catch((error) => {
                                    console.error("Error getting location:", error);
                                  })
                                  .finally(() => {
                                    setIsStartLocating(false);
                                  });
                              },
                              (error) => {
                                console.error("Error getting location:", error);
                                setIsStartLocating(false);
                              }
                            );
                          } else {
                            console.error("Geolocation is not supported by this browser.");
                            setIsStartLocating(false);
                          }
                        }}
                        onEndLocateMe={() => {
                          setIsEndLocating(true);
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                const { latitude, longitude } = position.coords;
                                
                                // Use reverse geocoding to get location name
                                fetch(
                                  `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibWlzdGVyZnJhenoiLCJhIjoiY203M2ZnM3BoMDhpMTJqcTNiYWpkamIzNyJ9.2SlcuEPIL2yCJw5TIPunVQ&types=place`
                                )
                                  .then((response) => response.json())
                                  .then((data) => {
                                    if (data.features && data.features[0]) {
                                      const placeName = data.features[0].place_name;
                                      setEndLocation(placeName);
                                      setEndCoordinates([longitude, latitude]);
                                    }
                                  })
                                  .catch((error) => {
                                    console.error("Error getting location:", error);
                                  })
                                  .finally(() => {
                                    setIsEndLocating(false);
                                  });
                              },
                              (error) => {
                                console.error("Error getting location:", error);
                                setIsEndLocating(false);
                              }
                            );
                          } else {
                            console.error("Geolocation is not supported by this browser.");
                            setIsEndLocating(false);
                          }
                        }}
                        onCurrencyChange={(currency) => {
                          setSelectedCurrency(currency);
                          const selectedCurrencyData = currencies.find(c => c.value === currency);
                          if (selectedCurrencyData) {
                            setCurrencySymbol(selectedCurrencyData.symbol);
                          }
                        }}
                        onBack={() => {
                          scrollToTop();
                          setCurrentStep('road-trip-vehicle');
                        }}
                        onContinue={() => {
                          scrollToTop();
                          setCurrentStep('road-trip-interests');
                        }}
                      />
                    </>
                  )}

                  {currentStep === 'road-trip-interests' && (
                    <>
                      <StepIndicator currentStep={currentStep} selectedActivity={selectedActivity} />
                      <RoadTripInterests
                        selectedRoadTripInterests={selectedRoadTripInterests}
                        onSelectInterest={handleRoadTripInterestSelect}
                        expandedCategory={expandedCategory}
                        onToggleCategory={(category) => setExpandedCategory(prev => prev === category ? null : category)}
                        onBack={() => {
                          scrollToTop();
                          setCurrentStep('road-trip-locations');
                        }}
                        onContinue={() => {
                          scrollToTop();
                          setCurrentStep('road-trip-details');
                        }}
                      />
                    </>
                  )}

                  {currentStep === 'road-trip-details' && (
                    <>
                      <StepIndicator currentStep={currentStep} selectedActivity={selectedActivity} />
                      <RoadTripDetails
                        adultCount={roadTripAdults}
                        childCount={roadTripKids}
                        maxBudget={maxBudget}
                        selectedCurrency={selectedCurrency}
                        currencySymbol={currencySymbol}
                        onAdultCountChange={setRoadTripAdults}
                        onChildCountChange={setRoadTripKids}
                        onMaxBudgetChange={setMaxBudget}
                        onCurrencyChange={handleCurrencyChange}
                        onBack={() => {
                          scrollToTop();
                          setCurrentStep('road-trip-locations');
                        }}
                        onContinue={handleContinue}
                      />
                    </>
                  )}

                  {currentStep === 'title-description' && (
                    <>
                      <StepIndicator currentStep={currentStep} selectedActivity={selectedActivity} />
                      <Card
                        className={cn(
                          "w-full mx-auto",
                          isMobile ? "max-w-xs p-2 my-2" : "max-w-2xl p-6 my-6",
                          "border-2",
                          "border-[#61936f] bg-black/20 shadow-xl backdrop-blur-md",
                          "rounded-2xl flex flex-col items-center justify-center"
                        )}
                        style={{ boxShadow: '0 4px 32px 0 rgba(97,147,111,0.10)' }}
                      >
                        <CardHeader
                          className={cn(
                            "w-full flex flex-col items-center justify-center gap-2",
                            isMobile ? "p-2 pb-0" : "p-6 pb-0"
                          )}
                        >
                          <div className={cn(
                            "flex items-center justify-center rounded-full",
                            isMobile ? "bg-white/15 p-2 w-8 h-8 mb-1" : "bg-[#61936f]/10 p-3 w-12 h-12 mb-2"
                          )}>
                            <PencilLine className={cn("text-white", isMobile ? "h-5 w-5" : "h-7 w-7")} />
                          </div>
                          <CardTitle className={cn(
                            isMobile ? "text-xl font-bold" : "text-3xl font-bold",
                            "text-white text-center"
                          )}>
                            {t('form.titleDescription.title')}
                          </CardTitle>
                          <CardDescription className={cn(
                            isMobile ? "text-sm" : "text-lg",
                            "text-white/80 text-center"
                          )}>
                            {t('form.titleDescription.subtitle')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className={cn(
                          "w-full flex flex-col items-center justify-center",
                          isMobile ? "gap-3 p-2" : "gap-6 p-6"
                        )}>
                          <div className={cn("w-full", isMobile ? "space-y-1" : "space-y-2")}>  
                            <Label htmlFor="title" className={cn(
                              "block text-white",
                              isMobile ? "text-base text-left" : "text-lg text-center"
                            )}>
                              {t('form.titleDescription.titleLabel')}
                            </Label>
                            <Input
                              id="title"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder={t('form.titleDescription.titlePlaceholder')}
                              className={cn(
                                "w-full border-2 bg-white/95 backdrop-blur-sm",
                                isMobile ? "py-2 px-2 text-base" : "py-4 px-4 text-lg",
                                "rounded-lg focus:ring-[#61936f] focus:border-[#61936f]",
                                title.trim() ? "border-[#61936f]" : "border-[#e0e0e0]",
                                "transition-all duration-300 placeholder:text-gray-400"
                              )}
                            />
                          </div>
                          <div className={cn("w-full", isMobile ? "space-y-1" : "space-y-2")}>  
                            <Label htmlFor="description" className={cn(
                              "block text-white",
                              isMobile ? "text-base text-left" : "text-lg text-center"
                            )}>
                              {t('form.titleDescription.descriptionLabel')}
                            </Label>
                            <Textarea
                              id="description"
                              value={personalDescription}
                              onChange={(e) => setPersonalDescription(e.target.value)}
                              placeholder={t('form.titleDescription.descriptionPlaceholder')}
                              className={cn(
                                "w-full min-h-[80px] border-2 bg-white/95 backdrop-blur-sm",
                                isMobile ? "py-2 px-2 text-base" : "py-4 px-4",
                                "rounded-lg focus:ring-[#61936f] focus:border-[#61936f]",
                                personalDescription.trim() ? "border-[#61936f]" : "border-[#e0e0e0]",
                                "transition-all duration-300 placeholder:text-gray-400"
                              )}
                            />
                          </div>
                        </CardContent>
                        <CardFooter className={cn(
                          "w-full flex justify-center items-center",
                          isMobile ? "gap-2 p-2 flex-col mt-2" : "gap-4 p-6 flex-row mt-4"
                        )}>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setCurrentStep('activity')}
                            className={cn(
                              "text-[#61936f] hover:text-white hover:bg-[#61936f]/80 border border-[#61936f]",
                              "transition-all duration-200"
                            )}
                          >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            {t('form.back')}
                          </Button>
                          <Button
                            type="button"
                            onClick={handleTitleDescriptionContinue}
                            disabled={!title.trim()}
                            className={cn(
                              isMobile ? "px-4 py-3 rounded-lg text-base min-w-[120px]" : "px-8 py-4 rounded-xl text-lg min-w-[200px]",
                              "font-medium bg-[#61936f] hover:bg-[#4a7256] text-white",
                              "shadow-lg shadow-[#61936f]/20 hover:shadow-xl hover:shadow-[#61936f]/30",
                              "transform transition-all duration-300 hover:scale-[1.02]",
                              !title.trim() && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {t('form.next')}
                          </Button>
                        </CardFooter>
                      </Card>
                    </>
                  )}
                </div>
              </AnimatePresence>
            </div>
          </div>

          {/* Modals */}
          <CustomActivityDialog 
            isOpen={customActivityDialogOpen}
            onOpenChange={setCustomActivityDialogOpen}
            customActivity={customActivity}
            onCustomActivityChange={setCustomActivity}
            onAddCustomActivity={handleAddCustomActivity}
          />

          <LoadingDialog
            isOpen={isCreatingTrip}
            onOpenChange={setIsCreatingTrip}
            type="trip"
          />

          <LoadingDialog
            isOpen={isCreatingTinderDate}
            onOpenChange={setIsCreatingTinderDate}
            type="date"
          />

          <LoadingDialog
            isOpen={isCreatingFriendActivity}
            onOpenChange={setIsCreatingFriendActivity}
            type="groupActivity"
          />

          <AuthModal 
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
            title={t('authModal.createTitle')}
            description={t('authModal.createDescription')}
            defaultTab="signup"
          />

          <ProfileCreationDialog
            isOpen={showProfileCreationDialog}
            onOpenChange={setShowProfileCreationDialog}
            onProfileCreated={handleProfileCreated}
          />
          
          <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
          />

          <FreeTripDialog
            isOpen={showFreeTripDialog}
            onClose={() => setShowFreeTripDialog(false)}
            onUpgrade={() => {
              setShowFreeTripDialog(false);
              setShowUpgradeModal(true);
            }}
            remaining={freeTripStatus?.remaining ?? null}
            nextReset={freeTripStatus?.next_reset ?? null}
            tripType={getTripTypeFromActivity(selectedActivity!) ?? 'zaptrip'}
          />
        </div>
      </div>
    );
  });

CreateTrip.displayName = 'CreateTrip';

export default CreateTrip; 