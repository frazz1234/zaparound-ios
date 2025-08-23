import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TripFormContent } from "./trips/TripFormContent";
import { useCreateTrip, TripFormData } from "@/hooks/useCreateTrip";
import { TripType } from "./trips/TripTypeSelector";
import { PlusCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/services/analytics";
import { cacheEventManager, CACHE_EVENTS } from "@/utils/cache";

interface CreateTripDialogProps {
  onTripCreated: () => void;
  buttonVariant?: "default" | "mobile";
}

export function CreateTripDialog({ onTripCreated, buttonVariant = "default" }: CreateTripDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0); // Start at 0 for trip type selection
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState<[number, number]>([0, 0]);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [transportationMode, setTransportationMode] = useState("");
  const [transportationDetails, setTransportationDetails] = useState("");
  const [accommodationType, setAccommodationType] = useState("");
  const [accommodationDetails, setAccommodationDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [tripType, setTripType] = useState<TripType | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // ZapOut specific state
  const [activityTimes, setActivityTimes] = useState<string[]>([]);
  const [includeLunch, setIncludeLunch] = useState(false);
  const [lunchOption, setLunchOption] = useState("before");
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [includeBudgetPerPerson, setIncludeBudgetPerPerson] = useState(false);
  const [budgetPerPerson, setBudgetPerPerson] = useState("");
  const [additionalNeeds, setAdditionalNeeds] = useState("");
  
  // ZapRoad specific state
  const [startingCity, setStartingCity] = useState("");
  const [startingCityCoordinates, setStartingCityCoordinates] = useState<[number, number]>([0, 0]);
  const [stopoverCities, setStopoverCities] = useState<{ name: string; coordinates: [number, number] }[]>([]);
  const [endCity, setEndCity] = useState("");
  const [endCityCoordinates, setEndCityCoordinates] = useState<[number, number]>([0, 0]);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [hasElectricCar, setHasElectricCar] = useState(false);
  const [specialRequirements, setSpecialRequirements] = useState("");
  
  const { toast } = useToast();
  const { t } = useTranslation(['trip']);
  const navigate = useNavigate();
  
  const { isLoading, createTrip } = useCreateTrip({
    onSuccess: (tripId) => {
      setOpen(false);
      
      // Emit cache invalidation events to ensure all components update
      cacheEventManager.emit(CACHE_EVENTS.TRIP_CREATED);
      cacheEventManager.emit(CACHE_EVENTS.MAP_DATA_INVALIDATED);
      cacheEventManager.emit(CACHE_EVENTS.CHECKPOINTS_INVALIDATED);
      
      onTripCreated();
      resetForm();
      
      // Track successful trip creation
      trackEvent('trip_created', {
        trip_id: tripId,
        trip_type: tripType || 'ZapTrip',
        has_location: !!location,
        has_dates: !!(startDate && endDate),
        number_of_travelers: adults + kids,
        category: category || 'none'
      });
    },
    onError: (error) => {
      // Track failed trip creation
      trackEvent('trip_creation_failed', {
        trip_type: tripType || 'ZapTrip',
        error_message: error.message || 'Unknown error'
      });
    }
  });
  
  useEffect(() => {
    async function getUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setUserRole('nosubs');
          return;
        }
        
        // Check if admin
        const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
        if (!adminError && isAdmin) {
          setUserRole('admin');
          return;
        }
        
        // If not admin, get role from user_roles
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!error && data) {
          setUserRole(data.role);
        } else {
          setUserRole('nosubs');
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setUserRole('nosubs');
      }
    }
    
    getUserRole();
  }, []);

  const handleLocationChange = (newLocation: string, newCoordinates: [number, number]) => {
    setLocation(newLocation);
    setCoordinates(newCoordinates);
  };

  const resetForm = () => {
    // Reset general fields
    setTitle("");
    setDescription("");
    setLocation("");
    setStartDate(undefined);
    setEndDate(undefined);
    setCoordinates([0, 0]);
    setCategory("");
    setBudget("");
    setTransportationMode("");
    setTransportationDetails("");
    setAccommodationType("");
    setAccommodationDetails("");
    setNotes("");
    setAdults(1);
    setKids(0);
    setTripType(null);
    
    // Reset ZapOut specific state
    setActivityTimes([]);
    setIncludeLunch(false);
    setLunchOption("before");
    setActivityTypes([]);
    setIncludeBudgetPerPerson(false);
    setBudgetPerPerson("");
    setAdditionalNeeds("");
    
    // Reset ZapRoad specific state
    setStartingCity("");
    setStartingCityCoordinates([0, 0]);
    setStopoverCities([]);
    setEndCity("");
    setEndCityCoordinates([0, 0]);
    setNumberOfPeople(1);
    setHasElectricCar(false);
    setSpecialRequirements("");
    
    setCurrentPage(0);
  };

  const handleNext = (activityId?: 'plan-trip' | 'tinder-date' | 'friends' | 'roadtrip') => {
    if (currentPage === 0 && !tripType) {
      toast({
        title: t('form.required'),
        description: t('selection.featureNotAvailable'),
        variant: "destructive",
      });
      
      // Track trip type selection error
      trackEvent('trip_type_selection_error');
      return;
    }
    
    // Track form progression
    trackEvent('trip_form_step', {
      step: currentPage + 1,
      trip_type: tripType || 'none'
    });
    
    setCurrentPage(currentPage + 1);
  };

  const handleBack = () => {
    // Track form regression
    trackEvent('trip_form_step_back', {
      from_step: currentPage,
      trip_type: tripType || 'none'
    });
    
    setCurrentPage(currentPage - 1);
  };

  const handleCancel = () => {
    // Track form cancellation
    trackEvent('trip_form_cancelled', {
      at_step: currentPage,
      trip_type: tripType || 'none'
    });
    
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent | { formData: TripFormData }, formData?: any) => {
    // If e is an object with formData, use that instead of the formData parameter
    const eventData = 'formData' in e ? e.formData : formData;
    
    console.log("CreateTripDialog - Starting form submission");
    console.log("CreateTripDialog - Received form data:", JSON.stringify(eventData, null, 2));
    
    let finalFormData: TripFormData;
    
    if (tripType === 'ZapRoad' && eventData) {
      // Use the form data passed from ZapRoadFormContent
      finalFormData = {
        ...eventData,
        tripType: 'ZapRoad' as const,
        startDate,
        endDate,
        adults,
        kids,
        notes
      };

      console.log("CreateTripDialog - ZapRoad form data prepared:", JSON.stringify(finalFormData, null, 2));
    } else if (tripType === 'ZapOut' && eventData) {
      // Use the form data passed from ZapOutFormContent
      finalFormData = {
        ...eventData,
        notes
      };

      console.log("CreateTripDialog - ZapOut form data prepared:", JSON.stringify(finalFormData, null, 2));
    } else {
      // Standard trip form data
      finalFormData = {
        title,
        description,
        location,
        coordinates,
        startDate,
        endDate,
        adults,
        kids,
        tripType: (tripType || 'ZapTrip') as 'ZapTrip',
        category,
        budget,
        transportationMode,
        transportationDetails,
        accommodationType,
        accommodationDetails,
        notes
      };
    }
    
    // Track trip submission attempt
    trackEvent('trip_submission_attempt', {
      trip_type: tripType || 'ZapTrip'
    });
    
    console.log("CreateTripDialog - Final form data being sent to createTrip:", JSON.stringify(finalFormData, null, 2));
    await createTrip(finalFormData);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Track dialog closed without submission
      if (currentPage > 0) {
        trackEvent('trip_dialog_closed_early', {
          at_step: currentPage,
          trip_type: tripType || 'none'
        });
      }
      
      resetForm();
    }
    setOpen(open);
  };

  const handleButtonClick = () => {
    // Check if user has subscription
    if (userRole === 'nosubs') {
      // Track subscription required event
      trackEvent('subscription_required', {
        feature: 'trip_creation',
        user_role: userRole
      });
      
      toast({
        title: t('navigation:createZapNotAvailable'),
        description: t('navigation:upgradeForCreatingZaps'),
        variant: "destructive",
      });
      navigate('/pricing');
      return;
    }
    
    // Track dialog open event
    trackEvent('trip_creation_started', {
      user_role: userRole || 'unknown'
    });
    
    // If user has a subscription, open the dialog
    setOpen(true);
  };

  const getPageTitle = () => {
    if (currentPage === 0) return t('selection.title');
    if (currentPage === 1) return t('form.basicInfo');
    if (tripType === 'ZapOut' && currentPage === 2) return t('types.zapOut.details.activityTime');
    if (tripType === 'ZapOut' && currentPage === 3) return t('types.zapOut.personDateTitle');
    if (tripType === 'ZapOut' && currentPage === 4) return t('types.zapOut.details.additionalNeeds');
    
    if (tripType === 'ZapRoad' && currentPage === 2) return t('types.zapRoad.setupTitle');
    if (tripType === 'ZapRoad' && currentPage === 3) return t('types.zapRoad.citySelectionTitle');
    if (tripType === 'ZapRoad' && currentPage === 4) return t('types.zapRoad.detailsTitle');
    
    return t('form.title');
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        {buttonVariant === "mobile" ? (
          <button className="flex flex-col items-center" onClick={(e) => {
            e.preventDefault();
            handleButtonClick();
          }}>
            <div className="relative">
              <PlusCircle className="w-8 h-8 text-primary" />
            </div>
            <span className="text-xs mt-1">{t('form.title')}</span>
          </button>
        ) : (
          <Button onClick={(e) => {
            e.preventDefault();
            handleButtonClick();
          }}>
            {t('form.createZap')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{t('form.title')} - {getPageTitle()}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <TripFormContent
            currentPage={currentPage}
            title={title}
            description={description}
            location={location}
            startDate={startDate}
            endDate={endDate}
            category={category}
            budget={budget}
            transportationMode={transportationMode}
            transportationDetails={transportationDetails}
            accommodationType={accommodationType}
            accommodationDetails={accommodationDetails}
            notes={notes}
            adults={adults}
            kids={kids}
            isLoading={isLoading}
            coordinates={coordinates}
            tripType={tripType}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onLocationChange={handleLocationChange}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onCategoryChange={setCategory}
            onBudgetChange={setBudget}
            onTransportationModeChange={setTransportationMode}
            onTransportationDetailsChange={setTransportationDetails}
            onAccommodationTypeChange={setAccommodationType}
            onAccommodationDetailsChange={setAccommodationDetails}
            onNotesChange={setNotes}
            onAdultsChange={setAdults}
            onKidsChange={setKids}
            onTripTypeChange={setTripType}
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
            onSubmit={handleSubmit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
