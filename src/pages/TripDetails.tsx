import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import TripMap from '@/components/TripMap';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from "@/components/ui/use-toast";
import type { Database } from '@/integrations/supabase/types';
import type { Json } from '../integrations/supabase/types';
import { TripHeader } from '@/components/trip-details/TripHeader';
import { TripBasicInfo } from '@/components/trip-details/TripBasicInfo';
import { TripTransportation } from '@/components/trip-details/TripTransportation';
import { TripAccommodation } from '@/components/trip-details/TripAccommodation';
import { TripAIContent } from '@/components/trip-details/TripAIContent';
import { TripZapOutDetails } from '@/components/trip-details/TripZapOutDetails';
import { TripZapRoadDetails } from '@/components/trip-details/TripZapRoadDetails';
import { EventSuggestions } from '@/components/trip-details/EventSuggestions';
import { TicketmasterEvents } from '@/components/trip-details/TicketmasterEvents';
import { useTranslation } from 'react-i18next';
import { openGoogleMapsNavigation } from '@/utils/navigation';
import { generateTripPDF } from '@/utils/pdfGenerator';
import { Map } from 'lucide-react';
import { TripShareDialog } from '@/components/trip-details/TripShareDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, Save } from "lucide-react";
import { debounce } from "lodash";

type TransportationDetails = {
  mode?: string;
  details?: string;
};

type AccommodationDetails = {
  type?: string;
  details?: string;
};

// Base type from database
type BaseTripRow = Database['public']['Tables']['trips']['Row'];

// Our extended Trip type
type Trip = Database['public']['Tables']['trips']['Row'] & {
  type?: 'ZapOut' | 'ZapRoad' | 'Regular';
  category?: string | null;
  notes?: string | null;
  budget?: number | null;
  geoposition?: GeoPosition[] | null;
  transportation_details: TransportationDetails;
  accommodation_details: AccommodationDetails;
};

// Define the GeoPosition type as a plain object to match Json type
type GeoPosition = {
  [key: string]: string | number | number[] | null;
  name: string;
  type: string;
  coordinates: [number, number];
};

// Extend the ZapOut and ZapRoad types with geoposition
type ZapOutTrip = Database['public']['Tables']['zapout_data']['Row'] & {
  type: 'ZapOut';
  title: string;
  category?: string | null;
  notes?: string | null;
  description?: string | null;
  budget?: number | null;
  geoposition?: GeoPosition[] | null;
  coordinates?: string | null;
  location?: string | null;
  activity_locations?: {
    name: string;
    coordinates: [number, number];
    type: string;
  }[] | null;
};

type ZapRoadTrip = Database['public']['Tables']['zaproad_data']['Row'] & {
  type: 'ZapRoad';
  title: string;
  category?: string | null;
  notes?: string | null;
  description?: string | null;
  budget?: number | null;
  geoposition?: GeoPosition[] | null;
  starting_city: string;
  starting_city_coordinates: string | null;
  end_city: string;
  end_city_coordinates: string | null;
  stopover_cities?: {
    name: string;
    coordinates: string;
  }[] | null;
};

// Add this type definition
type NoteBlock = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  trip_id: string;
  trip_type: 'zaptrip' | 'zapout' | 'zaproad';
};

// Add these types after the existing type definitions
type ChecklistItem = {
  id: string;
  title: string;
  is_checked: boolean;
  subitems: ChecklistSubItem[];
};

type ChecklistSubItem = {
  id: string;
  title: string;
  is_checked: boolean;
};

const LoadingOverlay = () => {
  const { t } = useTranslation('trip');
  const [currentTip, setCurrentTip] = useState(0);
  const [currentSection, setCurrentSection] = useState<'tips' | 'preview' | 'message'>('message');
  const [waitMessage, setWaitMessage] = useState('');

  // Get wait messages from translations
  const waitMessages = t('loading.waitMessages', { returnObjects: true }) as string[];

  // Effect to rotate wait messages
  useEffect(() => {
    const updateMessage = () => {
      const randomIndex = Math.floor(Math.random() * waitMessages.length);
      setWaitMessage(waitMessages[randomIndex]);
    };
    
    // Set initial message
    updateMessage();
    
    // Update message every 4 seconds
    const interval = setInterval(updateMessage, 4000);
    return () => clearInterval(interval);
  }, [waitMessages]);

  // Travel tips array from translations
  const travelTips = t('loading.travelTips', { returnObjects: true }) as string[];

  // ZapAround tips from translations
  const zapTips = t('loading.zapTips', { returnObjects: true }) as string[];

  // Blog preview content from translations
  const blogPreview = {
    title: t('loading.preview.title'),
    sections: t('loading.preview.sections', { returnObjects: true }) as {
      title: string;
      description: string;
      readTime: string;
      category: string;
    }[]
  };

  // State for current blog post
  const [currentBlogPost, setCurrentBlogPost] = useState(0);

  // Effect to rotate through blog posts
  useEffect(() => {
    if (currentSection === 'preview') {
      const interval = setInterval(() => {
        setCurrentBlogPost(prev => (prev + 1) % blogPreview.sections.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [currentSection, blogPreview.sections.length]);

  // Effect to rotate through tips
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % (travelTips.length + zapTips.length));
    }, 4000);

    return () => clearInterval(interval);
  }, [travelTips.length, zapTips.length]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#fcfcfc] z-50 overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(#61936f 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}></div>
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-4 sm:p-6">
        {/* Logo Animation */}
        <div className="mb-8 sm:mb-12">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#61936f] to-[#1d1d1e] shadow-xl flex items-center justify-center"
          >
            <span className="text-2xl sm:text-4xl text-white font-bold">Z</span>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#61936f]/10 border border-[#61936f]/20">
            <svg 
              className="w-5 h-5 text-[#61936f]" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
              />
            </svg>
            <span className="text-sm font-medium text-[#1d1d1e]">
              {t('aiContent.emailNotification')}
            </span>
          </div>
        </motion.div>

        {/* Content Sections */}
        <div className="w-full max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {currentSection === 'message' && (
              <motion.div
                key="message"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center px-4 sm:px-0"
              >
                <h2 className="text-xl sm:text-2xl font-semibold text-[#030303] mb-2 sm:mb-3">
                  {waitMessage}
                </h2>
                <p className="text-base sm:text-lg text-[#62626a] max-w-md mx-auto">
                  {t('loading.pleaseWait')}
                </p>
              </motion.div>
            )}

            {currentSection === 'tips' && (
              <motion.div
                key="tips"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center px-4 sm:px-0"
              >
                <h3 className="text-lg font-medium text-[#030303] mb-3">
                  {currentTip < travelTips.length ? t('loading.tips.title') : t('loading.tips.zapTitle')}
                </h3>
                <p className="text-base sm:text-lg text-[#62626a] max-w-md mx-auto">
                  {currentTip < travelTips.length 
                    ? travelTips[currentTip]
                    : zapTips[currentTip - travelTips.length]}
                </p>
              </motion.div>
            )}

            {currentSection === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center px-4 sm:px-0"
              >
                <h3 className="text-lg font-medium text-[#030303] mb-3">
                  {blogPreview.title}
                </h3>
                <div className="space-y-6">
                  <motion.div
                    key={currentBlogPost}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#61936f] px-3 py-1 bg-[#61936f]/10 rounded-full">
                        {blogPreview.sections[currentBlogPost].category}
                      </span>
                      <span className="text-sm text-[#62626a]">
                        {blogPreview.sections[currentBlogPost].readTime}
                      </span>
                    </div>
                    <h4 className="text-xl font-semibold text-[#030303] mb-2">
                      {blogPreview.sections[currentBlogPost].title}
                    </h4>
                    <p className="text-[#62626a] text-base">
                      {blogPreview.sections[currentBlogPost].description}
                    </p>
                  </motion.div>

                  {/* Blog post navigation dots */}
                  <div className="flex justify-center space-x-2">
                    {blogPreview.sections.map((_, index) => (
                      <motion.button
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentBlogPost ? 'bg-[#61936f]' : 'bg-[#62626a]/20'
                        }`}
                        onClick={() => setCurrentBlogPost(index)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Loading Bar */}
        <motion.div 
          className="mt-6 sm:mt-8 w-[280px] sm:w-64 h-1.5 bg-gray-100 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-[#61936f] to-[#1d1d1e]"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Loading Dots */}
        <div className="mt-4 sm:mt-6 flex space-x-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#61936f]"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>

        {/* Return to Dashboard Button */}
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="mt-8 px-6 py-3 rounded-lg font-semibold text-white bg-[#61936f] hover:bg-[#1d1d1e] transition-colors duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-[#61936f] focus:ring-offset-2"
        >
          {t('loading.returnToDashboard')}
        </button>
      </div>
    </motion.div>
  );
};

const TripDetails = () => {
  const {
    tripId
  } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { lang } = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [zapOutTrip, setZapOutTrip] = useState<ZapOutTrip | null>(null);
  const [zapRoadTrip, setZapRoadTrip] = useState<ZapRoadTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAiContentLoading, setIsAiContentLoading] = useState(true);
  const [waitMessage, setWaitMessage] = useState<string>('');
  const {
    toast
  } = useToast();
  const [tripCoordinates, setTripCoordinates] = useState<[number, number]>([2.3488, 48.8534]); // Default to Paris
  const [geopositions, setGeopositions] = useState<GeoPosition[]>([]);
  const { t } = useTranslation('trip');
  const [isStopsExpanded, setIsStopsExpanded] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingCountRef = useRef(0);
  const MAX_POLLING_COUNT = 60; // Stop polling after ~5 minutes (5 seconds × 60)
  const POLLING_INTERVAL = 5000; // Check every 5 seconds
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const isZapOutPath = location.pathname.includes('/zapout/');
  const isZapRoadPath = location.pathname.includes('/zaproad/');
  const [showNotesSection, setShowNotesSection] = useState(false);
  const [travelChecklist, setTravelChecklist] = useState([
    { id: 1, text: "Passport/ID", checked: false },
    { id: 2, text: "Travel Insurance", checked: false },
    { id: 3, text: "Hotel Reservations", checked: false },
    { id: 4, text: "Transportation Tickets", checked: false },
    { id: 5, text: "Local Currency", checked: false },
    { id: 6, text: "Phone Charger", checked: false },
    { id: 7, text: "Medications", checked: false },
    { id: 8, text: "Weather-appropriate clothes", checked: false },
  ]);
  const [noteBlocks, setNoteBlocks] = useState<NoteBlock[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newSubItemTitle, setNewSubItemTitle] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isSavingChecklist, setIsSavingChecklist] = useState(false);

  // Get wait messages from translations
  const waitMessages = t('aiContent.waitMessages', { returnObjects: true }) as string[];
  
  // Function to get random wait message
  const getRandomWaitMessage = () => {
    const randomIndex = Math.floor(Math.random() * waitMessages.length);
    return waitMessages[randomIndex];
  };

  // Determine the correct share URL based on trip type
  const shareUrl = isZapOutPath 
    ? `https://zaparound.com/zapout/${tripId}/share`
    : isZapRoadPath 
    ? `https://zaparound.com/zaproad/${tripId}/share`
    : `https://zaparound.com/trips/${tripId}/share`;

  const [isShareable, setIsShareable] = useState(false);
  const [isZapOutShareable, setIsZapOutShareable] = useState(false);
  const [isZapRoadShareable, setIsZapRoadShareable] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Function to check for AI content updates
  const checkForAiContentUpdates = useCallback(async () => {
    if (!tripId) return;

    try {
      pollingCountRef.current += 1;
      console.log(`Polling for AI content updates (attempt ${pollingCountRef.current})`);

      let result;
      if (isZapOutPath) {
        const { data } = await supabase
          .from('zapout_data')
          .select('ai_content')
          .eq('id', tripId)
          .single();
        result = data;
      } else if (isZapRoadPath) {
        const { data } = await supabase
          .from('zaproad_data')
          .select('ai_content')
          .eq('id', tripId)
          .single();
        result = data;
      } else {
        const { data } = await supabase
          .from('trips')
          .select('ai_content')
          .eq('id', tripId)
          .single();
        result = data;
      }

      if (result && result.ai_content) {
        console.log('AI content found, stopping polling');
        
        // Update the appropriate trip state with new AI content
        if (isZapOutPath && zapOutTrip) {
          setZapOutTrip(prev => ({ ...prev!, ai_content: result.ai_content }));
        } else if (isZapRoadPath && zapRoadTrip) {
          setZapRoadTrip(prev => ({ ...prev!, ai_content: result.ai_content }));
        } else if (trip) {
          setTrip(prev => ({ ...prev!, ai_content: result.ai_content }));
        }

        // Clear the polling interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        // Update loading state
        setIsAiContentLoading(false);

        // Show success toast

      } else if (pollingCountRef.current >= MAX_POLLING_COUNT) {
        console.log('Max polling attempts reached, stopping');
        setIsAiContentLoading(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        toast({
          title: "Note",
          description: "AI content generation is taking longer than expected. Please refresh the page later.",
        });
      }
    } catch (error) {
      console.error('Error checking for AI content updates:', error);
    }
  }, [tripId, isZapOutPath, isZapRoadPath, trip, zapOutTrip, zapRoadTrip, toast]);

  // Effect to handle AI content polling
  useEffect(() => {
    if (isAiContentLoading && tripId) {
      console.log('Starting AI content polling');
      // Check immediately
      checkForAiContentUpdates();
      
      // Then check every 5 seconds
      pollingIntervalRef.current = setInterval(checkForAiContentUpdates, POLLING_INTERVAL);
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isAiContentLoading, tripId, checkForAiContentUpdates]);

  // Effect to rotate wait messages
  useEffect(() => {
    if (isAiContentLoading) {
      setWaitMessage(getRandomWaitMessage());
      const interval = setInterval(() => {
        setWaitMessage(getRandomWaitMessage());
      }, 4000);
      
      return () => clearInterval(interval);
    }
  }, [isAiContentLoading]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (isZapOutPath) {
      fetchZapOutData();
    } else if (isZapRoadPath) {
      fetchZapRoadData();
    } else {
      fetchTripDetails();
    }
  }, [tripId, isZapOutPath, isZapRoadPath]);

  const fetchTripDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();
      
      if (error) throw error;
      console.log("Raw trip data from DB:", data);

      // Handle geoposition data
      let validGeopositions: GeoPosition[] = [];
      if (data.geoposition) {
        try {
          // If it's a string, parse it
          const geoData = typeof data.geoposition === 'string' 
            ? JSON.parse(data.geoposition) 
            : data.geoposition;

          // If it's an array, use it directly, otherwise wrap it in an array
          const geoArray = Array.isArray(geoData) ? geoData : [geoData];
          
          validGeopositions = geoArray.filter(pos => {
            return (
              pos &&
              pos.name &&
              pos.type &&
              Array.isArray(pos.coordinates) &&
              pos.coordinates.length === 2 &&
              !isNaN(pos.coordinates[0]) &&
              !isNaN(pos.coordinates[1])
            );
          });

          console.log("Valid geopositions:", validGeopositions);
        } catch (e) {
          console.error("Error parsing geoposition data:", e);
        }
      }

      // Set the geopositions
      setGeopositions(validGeopositions);

      // Set coordinates directly from the first valid geoposition
      if (validGeopositions.length > 0) {
        setTripCoordinates(validGeopositions[0].coordinates);
      }

      // Convert database types to our Trip type
      const formattedTrip: Trip = {
        ...data,
        transportation_details: typeof data.transportation_details === 'string' 
          ? JSON.parse(data.transportation_details) 
          : (data.transportation_details as TransportationDetails) || {},
        accommodation_details: typeof data.accommodation_details === 'string'
          ? JSON.parse(data.accommodation_details)
          : (data.accommodation_details as AccommodationDetails) || {},
        geoposition: validGeopositions
      };

      console.log("Formatted trip with geopositions:", formattedTrip);
      setTrip(formattedTrip);
      setLoading(false);
      
      // Set AI content loading state based on whether content exists
      setIsAiContentLoading(!formattedTrip.ai_content);
      if (!formattedTrip.ai_content) {
        // Reset polling count when starting fresh
        pollingCountRef.current = 0;
      }

      // After trip is loaded, set isShareable
      if (formattedTrip && typeof formattedTrip.is_shareable === 'boolean') {
        setIsShareable(formattedTrip.is_shareable);
      }
    } catch (error) {
      console.error("Error fetching trip details:", error);
      navigate('/dashboard');
    }
  };

  const fetchZapOutData = async () => {
    try {
      setLoading(true);
      const { data: rawData, error } = await supabase
        .from('zapout_data')
        .select('*')
        .eq('id', tripId)
        .single();

      if (error) {
        console.error("Error fetching ZapOut data:", error);
        navigate('/dashboard');
        return;
      }

      // Cast the raw data to our extended type
      const data = rawData as ZapOutTrip;
      console.log("ZapOut data loaded:", data);

      // Handle geoposition data
      let validGeopositions: GeoPosition[] = [];

      // 1. Try to get locations from geoposition field first
      if (data.geoposition) {
        try {
          const geoData = typeof data.geoposition === 'string' 
            ? JSON.parse(data.geoposition) 
            : data.geoposition;

          const geoArray = Array.isArray(geoData) ? geoData : [geoData];
          
          validGeopositions = geoArray.filter(pos => {
            return (
              pos &&
              pos.name &&
              pos.type &&
              Array.isArray(pos.coordinates) &&
              pos.coordinates.length === 2 &&
              !isNaN(pos.coordinates[0]) &&
              !isNaN(pos.coordinates[1])
            );
          });

          console.log("Valid geopositions from geoposition field:", validGeopositions);
        } catch (e) {
          console.error("Error parsing geoposition data:", e);
        }
      }

      // 2. If no valid geopositions, try activity_locations
      if (validGeopositions.length === 0 && data.activity_locations) {
        try {
          const activityLocations = typeof data.activity_locations === 'string'
            ? JSON.parse(data.activity_locations)
            : data.activity_locations;

          if (Array.isArray(activityLocations)) {
            validGeopositions = activityLocations
              .filter(loc => loc && loc.coordinates && loc.name)
              .map(loc => ({
                name: loc.name,
                type: loc.type || 'activity',
                coordinates: loc.coordinates as [number, number]
              }));
          }
          console.log("Valid geopositions from activity_locations:", validGeopositions);
        } catch (e) {
          console.error("Error parsing activity_locations:", e);
        }
      }

      // 3. If still no valid geopositions, try the main location/coordinates
      if (validGeopositions.length === 0 && data.coordinates) {
        try {
          const coords = JSON.parse(data.coordinates);
          if (Array.isArray(coords) && coords.length === 2) {
            validGeopositions = [{
              name: data.location || 'Main Location',
              type: 'main',
              coordinates: [Number(coords[0]), Number(coords[1])] as [number, number]
            }];
            console.log("Valid geoposition from main coordinates:", validGeopositions);
          }
        } catch (e) {
          console.error("Error parsing main coordinates:", e);
        }
      }

      // Set the geopositions
      setGeopositions(validGeopositions);

      // Set coordinates directly from the first valid geoposition
      if (validGeopositions.length > 0) {
        setTripCoordinates(validGeopositions[0].coordinates);
      }

      // Update the ZapOut trip state
      setZapOutTrip({
        ...data,
        type: 'ZapOut',
        description: data.additional_needs || null,
        geoposition: validGeopositions
      });

      setLoading(false);
      
      // Set AI content loading state based on whether content exists
      setIsAiContentLoading(!data.ai_content);
      if (!data.ai_content) {
        // Reset polling count when starting fresh
        pollingCountRef.current = 0;
      }
    } catch (error) {
      console.error("Error in ZapOut data fetch:", error);
      toast({
        title: "Error",
        description: "Failed to load ZapOut trip details"
      });
      navigate('/dashboard');
    }
  };

  const fetchZapRoadData = async () => {
    try {
      setLoading(true);
      const { data: rawData, error } = await supabase
        .from('zaproad_data')
        .select('*')
        .eq('id', tripId)
        .single();

      if (error) {
        console.error("Error fetching ZapRoad data:", error);
        toast({
          title: "Error",
          description: "Failed to load ZapRoad trip details"
        });
        navigate('/dashboard');
        return;
      }

      // Cast the raw data to our extended type
      const data = rawData as ZapRoadTrip;
      console.log("Raw ZapRoad data loaded:", rawData);
      console.log("ZapRoad data after casting:", data);

      // Handle geoposition data
      let validGeopositions: GeoPosition[] = [];

      // 1. Try to get locations from geoposition field first
      if (data.geoposition) {
        try {
          console.log("Raw geoposition data:", data.geoposition);
          const geoData = typeof data.geoposition === 'string' 
            ? JSON.parse(data.geoposition) 
            : data.geoposition;
          console.log("Parsed geoposition data:", geoData);

          const geoArray = Array.isArray(geoData) ? geoData : [geoData];
          console.log("Geoposition array:", geoArray);
          
          validGeopositions = geoArray.filter(pos => {
            const isValid = pos &&
              pos.name &&
              pos.type &&
              Array.isArray(pos.coordinates) &&
              pos.coordinates.length === 2 &&
              !isNaN(pos.coordinates[0]) &&
              !isNaN(pos.coordinates[1]);
            
            if (!isValid) {
              console.log("Invalid geoposition:", pos);
            }
            return isValid;
          });

          console.log("Valid geopositions from geoposition field:", validGeopositions);
        } catch (e) {
          console.error("Error parsing ZapRoad geoposition data:", e);
        }
      }

      // 2. If no valid geopositions, create them from cities data
      if (validGeopositions.length === 0) {
        const cities: { name: string; coordinates: string | null; type: string }[] = [];
        
        // Add starting city
        if (data.starting_city && data.starting_city_coordinates) {
          console.log("Starting city data:", {
            city: data.starting_city,
            coordinates: data.starting_city_coordinates
          });
          cities.push({
            name: data.starting_city,
            coordinates: data.starting_city_coordinates,
            type: 'start'
          });
        }

        // Add stopover cities
        if (data.stopover_cities) {
          try {
            console.log("Raw stopover cities:", data.stopover_cities);
            const stopovers = typeof data.stopover_cities === 'string' 
              ? JSON.parse(data.stopover_cities) 
              : data.stopover_cities;
            console.log("Parsed stopover cities:", stopovers);

            if (Array.isArray(stopovers)) {
              cities.push(...stopovers.map(city => ({
                name: city.name,
                coordinates: city.coordinates,
                type: 'stopover'
              })));
            }
          } catch (e) {
            console.error("Error parsing stopover cities:", e);
          }
        }

        // Add end city
        if (data.end_city && data.end_city_coordinates) {
          console.log("End city data:", {
            city: data.end_city,
            coordinates: data.end_city_coordinates
          });
          cities.push({
            name: data.end_city,
            coordinates: data.end_city_coordinates,
            type: 'end'
          });
        }

        console.log("Cities array before conversion:", cities);

        // Convert cities to geopositions
        validGeopositions = cities
          .filter(city => city.coordinates)
          .map(city => {
            try {
              console.log("Processing city:", city);
              const coords = JSON.parse(city.coordinates!);
              console.log("Parsed coordinates:", coords);
              
              if (Array.isArray(coords) && coords.length === 2) {
                return {
                  name: city.name,
                  type: city.type,
                  coordinates: [Number(coords[0]), Number(coords[1])] as [number, number]
                };
              }
              return null;
            } catch (e) {
              console.error(`Error parsing coordinates for city ${city.name}:`, e);
              return null;
            }
          })
          .filter((pos): pos is GeoPosition => pos !== null);

        console.log("Final valid geopositions from cities data:", validGeopositions);
      }

      // Set the geopositions
      setGeopositions(validGeopositions);

      // Set coordinates directly from the first valid geoposition
      if (validGeopositions.length > 0) {
        console.log("Setting initial coordinates:", validGeopositions[0].coordinates);
        setTripCoordinates(validGeopositions[0].coordinates);
      }

      // Update the ZapRoad trip state
      const updatedZapRoadTrip: ZapRoadTrip = {
        ...data,
        type: 'ZapRoad' as const,
        description: data.special_requirements || null,
        geoposition: validGeopositions
      };
      console.log("Final ZapRoad trip state:", updatedZapRoadTrip);
      setZapRoadTrip(updatedZapRoadTrip);

      setLoading(false);
      
      // Set AI content loading state based on whether content exists
      setIsAiContentLoading(!data.ai_content);
      if (!data.ai_content) {
        // Reset polling count when starting fresh
        pollingCountRef.current = 0;
      }
    } catch (error) {
      console.error("Error in ZapRoad data fetch:", error);
      toast({
        title: "Error",
        description: "Failed to load ZapRoad trip details"
      });
      navigate('/dashboard');
    }
  };

  const handleSave = async () => {
    if (!trip && !zapOutTrip && !zapRoadTrip) return;

    try {
      setLoading(true);

      // Convert geopositions to database-compatible JSON format
      const geopositionJson = geopositions.map(pos => ({
        name: pos.name,
        type: pos.type,
        coordinates: pos.coordinates
      })) as unknown as Json;

      if (zapOutTrip) {
        // Handle ZapOut data save
        const zapOutUpdateData = {
          title: zapOutTrip.title,
          category: zapOutTrip.category,
          additional_needs: zapOutTrip.notes || zapOutTrip.description,
          location: zapOutTrip.location,
          geoposition: geopositionJson,
          coordinates: geopositions.length > 0 
            ? JSON.stringify(geopositions[0].coordinates)
            : null,
          activity_types: zapOutTrip.activity_types || [],
          activity_times: zapOutTrip.activity_times || []
        };

        const { error: zapoutError } = await supabase
          .from('zapout_data')
          .update(zapOutUpdateData)
          .eq('id', tripId);

        if (zapoutError) throw zapoutError;

        toast({
          title: "Success",
          description: "ZapOut trip details saved successfully"
        });
        navigate('/dashboard');
        return;
      }

      if (zapRoadTrip) {
        // Handle ZapRoad data save
        const geopositionString = JSON.stringify(
          geopositions.map(pos => ({
            name: pos.name,
            type: pos.type,
            coordinates: pos.coordinates
          }))
        );
        console.log('Geoposition before save:', {
          raw: geopositions,
          stringified: geopositionString
        });

        // Prepare stopover cities data
        const stopoverCities = geopositions
          .slice(1, -1) // Exclude start and end points
          .map(pos => ({
            name: pos.name,
            coordinates: JSON.stringify(pos.coordinates)
          }));
        
        console.log('Stopover cities before stringifying:', stopoverCities);
        const stopoverCitiesString = JSON.stringify(stopoverCities);
        console.log('Stopover cities after stringifying:', stopoverCitiesString);

        // Handle coordinates
        const startCoords = geopositions.length > 0 
          ? JSON.stringify(geopositions[0].coordinates)
          : zapRoadTrip.starting_city_coordinates;
        const endCoords = geopositions.length > 1 
          ? JSON.stringify(geopositions[geopositions.length - 1].coordinates)
          : zapRoadTrip.end_city_coordinates;

        console.log('Coordinates before save:', {
          start: startCoords,
          end: endCoords
        });

        const zapRoadUpdateData = {
          title: zapRoadTrip.title,
          category: zapRoadTrip.category,
          special_requirements: zapRoadTrip.notes || zapRoadTrip.description,
          starting_city: zapRoadTrip.starting_city,
          starting_city_coordinates: startCoords,
          end_city: zapRoadTrip.end_city,
          end_city_coordinates: endCoords,
          geoposition: geopositionString,
          stopover_cities: stopoverCitiesString
        };

        console.log('Final ZapRoad update data:', zapRoadUpdateData);

        const { error: zaproadError } = await supabase
          .from('zaproad_data')
          .update(zapRoadUpdateData)
          .eq('id', tripId);

        if (zaproadError) {
          console.error('ZapRoad update error:', zaproadError);
          throw zaproadError;
        }

        toast({
          title: "Success",
          description: "ZapRoad trip details saved successfully"
        });
        navigate('/dashboard');
        return;
      }

      if (trip) {
        // Handle regular trip save
        const tripUpdateData: Database['public']['Tables']['trips']['Update'] = {
          transportation_details: JSON.stringify(trip.transportation_details),
          accommodation_details: JSON.stringify(trip.accommodation_details),
          geoposition: geopositionJson,
          category: trip.category,
          notes: trip.notes,
          budget: trip.budget
        };

        const { error: updateError } = await supabase
          .from('trips')
          .update(tripUpdateData)
          .eq('id', trip.id);

        if (updateError) throw updateError;

        toast({
          title: "Success",
          description: "Trip details saved successfully"
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error saving trip details:', error);
      toast({
        title: "Error",
        description: "Failed to save trip details. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const showComingSoonModal = (feature: string) => {
    toast({
      title: "✨ Coming Soon!",
      description: `${feature} will be available soon. Stay tuned for updates!`,
      className: "backdrop-blur-sm",
      style: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        padding: '2rem',
        background: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '1rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        animation: 'fadeIn 0.3s ease-out',
        zIndex: 50,
        textAlign: 'center',
        color: '#1a1a1a',
        fontSize: '1.1rem',
        fontWeight: 500,
        width: 'auto',
        minWidth: '300px',
        maxWidth: '90vw',
      },
    });
  };

  const openGoogleMapsNavigation = (geopositions: GeoPosition[]) => {
    if (geopositions.length === 0) return;
    
    // For ZapOut, use all locations to create a multi-stop route
    const locations = geopositions.map(pos => {
      const [lng, lat] = pos.coordinates;
      return `${lat},${lng}`;
    }).join('/');
    
    // Open Google Maps in a new tab with all locations
    window.open(`https://www.google.com/maps/dir/${locations}`, '_blank');
  };

  // Modify the loading check to include AI content loading and prevent scrolling
  useEffect(() => {
    if (loading || isAiContentLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [loading, isAiContentLoading]);

  // After loading each trip, set the correct shareable state
  useEffect(() => {
    if (trip && typeof trip.is_shareable === 'boolean') setIsShareable(trip.is_shareable);
    if (zapOutTrip && typeof zapOutTrip.is_shareable === 'boolean') setIsZapOutShareable(zapOutTrip.is_shareable);
    if (zapRoadTrip && typeof zapRoadTrip.is_shareable === 'boolean') setIsZapRoadShareable(zapRoadTrip.is_shareable);
  }, [trip, zapOutTrip, zapRoadTrip]);

  const handleShareClick = async () => {
    if (isZapOutTrip && zapOutTrip?.id && !isZapOutShareable) {
      const { error } = await supabase
        .from('zapout_data')
        .update({ is_shareable: true })
        .eq('id', zapOutTrip.id);
      if (!error) setIsZapOutShareable(true);
    } else if (isZapRoadTrip && zapRoadTrip?.id && !isZapRoadShareable) {
      const { error } = await supabase
        .from('zaproad_data')
        .update({ is_shareable: true })
        .eq('id', zapRoadTrip.id);
      if (!error) setIsZapRoadShareable(true);
    } else if (trip?.id && !isShareable) {
      const { error } = await supabase
        .from('trips')
        .update({ is_shareable: true })
        .eq('id', trip.id);
      if (!error) setIsShareable(true);
    }
    setShareDialogOpen(true);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  const isOwner =
    (trip && currentUserId && trip.user_id === currentUserId) ||
    (zapOutTrip && currentUserId && zapOutTrip.user_id === currentUserId) ||
    (zapRoadTrip && currentUserId && zapRoadTrip.user_id === currentUserId);

  const handleChecklistChange = (id: number) => {
    setTravelChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  // Add this function to fetch note blocks
  const fetchNoteBlocks = async () => {
    try {
      const { data, error } = await supabase
        .from('trip_notes')
        .select('*')
        .eq('trip_id', tripId)
        .eq('trip_type', isZapOutTrip ? 'zapout' : isZapRoadTrip ? 'zaproad' : 'zaptrip')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNoteBlocks(data || []);
    } catch (error) {
      console.error('Error fetching note blocks:', error);
      toast({
        title: "Error",
        description: "Failed to load notes"
      });
    }
  };

  // Add this function to create a new note block
  const createNoteBlock = async () => {
    if (!newNoteTitle.trim()) return;

    try {
      setIsSaving(true);
      const newNote: Omit<NoteBlock, 'id' | 'created_at'> = {
        title: newNoteTitle,
        content: '',
        trip_id: tripId!,
        trip_type: isZapOutTrip ? 'zapout' : isZapRoadTrip ? 'zaproad' : 'zaptrip'
      };

      const { data, error } = await supabase
        .from('trip_notes')
        .insert([newNote])
        .select()
        .single();

      if (error) throw error;
      setNoteBlocks(prev => [data, ...prev]);
      setNewNoteTitle('');
    } catch (error) {
      console.error('Error creating note block:', error);
      toast({
        title: "Error",
        description: "Failed to create note"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add debounced update function
  const debouncedUpdateNote = useCallback(
    debounce(async (id: string, content: string) => {
      try {
        const { error } = await supabase
          .from('trip_notes')
          .update({ content })
          .eq('id', id);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating note:', error);
        toast({
          title: "Error",
          description: "Failed to save changes"
        });
      }
    }, 1000),
    []
  );

  // Add this function to update a note block
  const updateNoteBlock = async (id: string, content: string) => {
    setNoteBlocks(prev => 
      prev.map(note => note.id === id ? { ...note, content } : note)
    );
    debouncedUpdateNote(id, content);
  };

  // Add this function to delete a note block
  const deleteNoteBlock = async (id: string) => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('trip_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNoteBlocks(prev => prev.filter(note => note.id !== id));
    } catch (error) {
      console.error('Error deleting note block:', error);
      toast({
        title: "Error",
        description: "Failed to delete note"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add this effect to fetch note blocks when the notes section is opened
  useEffect(() => {
    if (showNotesSection) {
      fetchNoteBlocks();
    }
  }, [showNotesSection, tripId]);

  // Add these functions in the TripDetails component
  const fetchChecklistItems = async () => {
    try {
      const { data: items, error: itemsError } = await supabase
        .from('trip_checklist_items')
        .select('*')
        .eq('trip_id', tripId)
        .eq('trip_type', isZapOutTrip ? 'zapout' : isZapRoadTrip ? 'zaproad' : 'zaptrip')
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      // Fetch subitems for each item
      const itemsWithSubitems = await Promise.all(
        items.map(async (item) => {
          const { data: subitems, error: subitemsError } = await supabase
            .from('trip_checklist_subitems')
            .select('*')
            .eq('parent_id', item.id)
            .order('created_at', { ascending: true });

          if (subitemsError) throw subitemsError;

          return {
            ...item,
            subitems: subitems || []
          };
        })
      );

      setChecklistItems(itemsWithSubitems);
    } catch (error) {
      console.error('Error fetching checklist items:', error);
      toast({
        title: "Error",
        description: "Failed to load checklist items"
      });
    }
  };

  const createChecklistItem = async () => {
    if (!newItemTitle.trim()) return;

    try {
      setIsSavingChecklist(true);
      const newItem = {
        title: newItemTitle,
        trip_id: tripId!,
        trip_type: isZapOutTrip ? 'zapout' : isZapRoadTrip ? 'zaproad' : 'zaptrip'
      };

      const { data, error } = await supabase
        .from('trip_checklist_items')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;

      setChecklistItems(prev => [...prev, { ...data, subitems: [] }]);
      setNewItemTitle('');
    } catch (error) {
      console.error('Error creating checklist item:', error);
      toast({
        title: "Error",
        description: "Failed to create checklist item"
      });
    } finally {
      setIsSavingChecklist(false);
    }
  };

  const createSubItem = async (parentId: string) => {
    if (!newSubItemTitle.trim()) return;

    try {
      setIsSavingChecklist(true);
      const newSubItem = {
        title: newSubItemTitle,
        parent_id: parentId
      };

      const { data, error } = await supabase
        .from('trip_checklist_subitems')
        .insert([newSubItem])
        .select()
        .single();

      if (error) throw error;

      setChecklistItems(prev =>
        prev.map(item =>
          item.id === parentId
            ? { ...item, subitems: [...item.subitems, data] }
            : item
        )
      );
      setNewSubItemTitle('');
    } catch (error) {
      console.error('Error creating sub-item:', error);
    } finally {
      setIsSavingChecklist(false);
    }
  };

  const toggleItemCheck = async (itemId: string) => {
    try {
      const item = checklistItems.find(i => i.id === itemId);
      if (!item) return;

      const { error } = await supabase
        .from('trip_checklist_items')
        .update({ is_checked: !item.is_checked })
        .eq('id', itemId);

      if (error) throw error;

      setChecklistItems(prev =>
        prev.map(i =>
          i.id === itemId
            ? { ...i, is_checked: !i.is_checked }
            : i
        )
      );
    } catch (error) {
      console.error('Error updating checklist item:', error);
      toast({
        title: "Error",
        description: "Failed to update checklist item"
      });
    }
  };

  const toggleSubItemCheck = async (itemId: string, subItemId: string) => {
    try {
      const item = checklistItems.find(i => i.id === itemId);
      const subItem = item?.subitems.find(s => s.id === subItemId);
      if (!subItem) return;

      const { error } = await supabase
        .from('trip_checklist_subitems')
        .update({ is_checked: !subItem.is_checked })
        .eq('id', subItemId);

      if (error) throw error;

      setChecklistItems(prev =>
        prev.map(i =>
          i.id === itemId
            ? {
                ...i,
                subitems: i.subitems.map(s =>
                  s.id === subItemId
                    ? { ...s, is_checked: !s.is_checked }
                    : s
                )
              }
            : i
        )
      );
    } catch (error) {
      console.error('Error updating sub-item:', error);
      toast({
        title: "Error",
        description: "Failed to update sub-item"
      });
    }
  };

  const deleteChecklistItem = async (itemId: string) => {
    try {
      setIsSavingChecklist(true);
      const { error } = await supabase
        .from('trip_checklist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setChecklistItems(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Success",
        description: "Checklist item deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting checklist item:', error);
      toast({
        title: "Error",
        description: "Failed to delete checklist item"
      });
    } finally {
      setIsSavingChecklist(false);
    }
  };

  const deleteSubItem = async (itemId: string, subItemId: string) => {
    try {
      setIsSavingChecklist(true);
      const { error } = await supabase
        .from('trip_checklist_subitems')
        .delete()
        .eq('id', subItemId);

      if (error) throw error;

      setChecklistItems(prev =>
        prev.map(item =>
          item.id === itemId
            ? {
                ...item,
                subitems: item.subitems.filter(s => s.id !== subItemId)
              }
            : item
        )
      );
      toast({
        title: "Success",
        description: "Sub-item deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting sub-item:', error);
      toast({
        title: "Error",
        description: "Failed to delete sub-item"
      });
    } finally {
      setIsSavingChecklist(false);
    }
  };

  // Add this effect to fetch checklist items when the notes section is opened
  useEffect(() => {
    if (showNotesSection) {
      fetchChecklistItems();
    }
  }, [showNotesSection, tripId]);

  if (loading || isAiContentLoading) {
    return (
      <AnimatePresence>
        <LoadingOverlay />
      </AnimatePresence>
    );
  }
  if (!trip && !zapOutTrip && !zapRoadTrip) {
    return <div className="container mx-auto p-8">Trip not found</div>;
  }

  const isZapOutTrip = isZapOutPath || zapOutTrip !== null || trip && trip.trip_type === 'ZapOut';
  const isZapRoadTrip = isZapRoadPath || zapRoadTrip !== null || trip && trip.trip_type === 'ZapRoad';

  // Determine the correct title and description based on the trip type
  const tripTitle = zapOutTrip ? zapOutTrip.title : zapRoadTrip ? zapRoadTrip.title : trip?.title || '';
  const tripDescription = zapOutTrip ? zapOutTrip.description || '' : 
                         zapRoadTrip ? zapRoadTrip.description || '' : 
                         trip?.description || '';

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      {/* New Header Bar */}
      <div className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          {/* Back Button */}
          <button
            onClick={() => {
              // Check if user came from map dashboard
              const previousPage = localStorage.getItem('tripDetailsPreviousPage');
              if (previousPage === 'mapDashboard') {
                // Clear the storage and navigate to map dashboard
                localStorage.removeItem('tripDetailsPreviousPage');
                navigate('/map-dashboard');
              } else {
                // Default behavior - go to regular dashboard
                navigate('/dashboard');
              }
            }}
            className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            <span className="hidden sm:inline">
              {localStorage.getItem('tripDetailsPreviousPage') === 'mapDashboard' 
                ? t('details.backToDashboard')
                : t('details.backToDashboard')}
            </span>
          </button>

          {/* Edit/Save Button */}
          {isOwner && (
            <>
              <div className="flex items-center gap-2">
                {!isZapOutTrip && (
                  <button
                    onClick={() => setShowNotesSection(!showNotesSection)}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    {t('details.notes')}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (isEditing) {
                      handleSave();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  {isEditing ? t('details.saveChanges') : t('details.editDetails')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Map Section - Now Full Width Above Content on Mobile, Left Side on Desktop */}
          <div className="xl:col-span-8 xl:row-span-2 space-y-6">
            {/* Map Card with Trip Title */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-6">
                <h1 className="text-3xl font-bold text-[#030303] mb-2">
                  {tripTitle}
                </h1>
                {tripDescription && (
                  <p className="mb-4 text-sm text-[#62626a]">{tripDescription}</p>
                )}
                <TripMap 
                  height="300px"
                  geopositions={geopositions}
                  showTerrain={true}
                  onMarkerClick={(position) => {
                    setTripCoordinates(position.coordinates);
                  }}
                  initialCenter={tripCoordinates}
                  className="rounded-xl overflow-hidden shadow-inner h-[300px] sm:h-[400px] lg:h-[600px]"
                />
              </div>
            </div>

            {/* Location Details with Modern Cards */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center cursor-pointer"
                   onClick={() => setIsStopsExpanded(!isStopsExpanded)}>
                <h2 className="text-xl font-bold text-[#030303]">
                  {t('details.stopsAndPoints')}
                </h2>
                <svg 
                  className={`w-5 h-5 transform transition-transform ${isStopsExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className={`relative ${!isStopsExpanded ? 'max-h-[200px]' : 'max-h-none'} overflow-hidden`}>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {geopositions.map((pos, index) => (
                      <div 
                        key={`${pos.name}-${index}`}
                        className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-blue-200 overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-500 rounded-tl-lg rounded-bl-lg"></div>
                        <div className="p-4 pl-5">
                          <div className="flex items-center mb-2">
                            <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                              {index + 1}
                            </div>
                            <h3 className="ml-3 font-semibold text-base text-gray-800 group-hover:text-blue-600 transition-colors">
                              {pos.name}
                            </h3>
                          </div>
                          {pos.description && (
                            <p className="text-gray-600 text-sm mb-2">{pos.description}</p>
                          )}
                          <div className="flex items-center text-xs text-gray-500">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            {(pos as any).Adresse || `${pos.coordinates[1].toFixed(4)}, ${pos.coordinates[0].toFixed(4)}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {!isStopsExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                )}
              </div>
              {!isStopsExpanded && geopositions.length > 2 && (
                <div className="p-4 border-t border-gray-100 text-center">
                  <button
                    onClick={() => setIsStopsExpanded(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {t('details.showAllStops')} ({geopositions.length})
                  </button>
                </div>
              )}
            </div>

            {/* Event Suggestions Section */}
            <EventSuggestions 
              location={trip?.location || zapOutTrip?.location || zapRoadTrip?.starting_city || ''} 
            />

            {/* Ticketmaster Events Section - Only show if we have valid coordinates */}
            {geopositions.length > 0 && (
              <TicketmasterEvents 
                city={trip?.location || zapOutTrip?.location || zapRoadTrip?.starting_city || ''} 
                coordinates={geopositions[0].coordinates}
              />
            )}
          </div>

          {/* Right Sidebar - Trip Information */}
          <div className="xl:col-span-4 space-y-6">
            {/* Combined Info Card for Regular Trips or Trip Type Details */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-4">
                {isZapOutTrip ? (
                  <TripZapOutDetails 
                    tripId={tripId}
                    isDirectZapOut={!!zapOutTrip}
                  />
                ) : isZapRoadTrip ? (
                  <TripZapRoadDetails 
                    tripId={tripId}
                    isDirectZapRoad={!!zapRoadTrip}
                  />
                ) : (
                  <div className="space-y-6">
                    {/* ZapTrip Details Title */}
                    <h3 className="text-lg font-semibold mb-4">{t('zapTrip.details.title')}</h3>
                    {/* Basic Info Section */}
                    <div>
                      <TripBasicInfo
                        startDate={trip?.start_date || ''}
                        endDate={trip?.end_date || ''}
                        location={trip?.location || ''}
                        category={trip?.category || null}
                        activityTypes={[]}
                        budget={trip?.budget || null}
                        isEditing={isEditing}
                        isZapOutTrip={false}
                        isZapRoadTrip={false}
                        hideBudget={false}
                        onCategoryChange={category => setTrip(trip ? {
                          ...trip,
                          category: category as Trip['category']
                        } : null)}
                        onBudgetChange={budget => setTrip(trip ? {
                          ...trip,
                          budget: budget as Trip['budget']
                        } : null)}
                      />
                    </div>

                    {/* Transportation Section */}
                    <div className="pt-6 border-t border-gray-100">

                      <TripTransportation 
                        details={trip?.transportation_details || {}} 
                        isEditing={isEditing}
                        onChange={details => setTrip(trip ? {
                          ...trip,
                          transportation_details: details as Trip['transportation_details']
                        } : null)}
                      />
                    </div>

                    {/* Accommodation Section */}
                    <div className="pt-6 border-t border-gray-100">
                      <TripAccommodation 
                        details={trip?.accommodation_details || {}}
                        isEditing={isEditing}
                        onChange={details => setTrip(trip ? {
                          ...trip,
                          accommodation_details: details as Trip['accommodation_details']
                        } : null)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section with Action Buttons */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-4">
                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  {/* Map View Button - Show for ZapOut and regular trips */}
                  {(isZapOutTrip || (!isZapOutTrip && !isZapRoadTrip)) && (
                    <>
                      <button
                        onClick={() => navigate('/map-dashboard', { 
                          state: { 
                            selectedTripId: tripId, 
                            tripType: isZapOutTrip ? 'zapout' : 'zaptrip' 
                          } 
                        })}
                        className="w-full flex items-center justify-center px-4 py-2 bg-[#1d1d1e] text-white rounded-lg hover:bg-[#2d2d2e] transition-colors"
                      >
                        <Map className="w-5 h-5 mr-2" />
                        {t('types.zapOut.details.viewOnMap')}
                      </button>

                      {/* Google Maps Button - Only show if we have coordinates */}
                      {geopositions.length > 0 && (
                        <button
                          onClick={() => openGoogleMapsNavigation(geopositions)}
                          className="w-full flex items-center justify-center px-4 py-2 bg-[#1d1d1e] text-white rounded-lg hover:bg-[#2d2d2e] transition-colors"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                          </svg>
                          {t('navigation.viewOnGoogleMaps')}
                        </button>
                      )}
                    </>
                  )}

                  {/* Navigation Button - Only show for ZapRoad trips */}
                  {isZapRoadTrip && geopositions.length > 0 && (
                    <button
                      onClick={() => openGoogleMapsNavigation(geopositions)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-[#1d1d1e] text-white rounded-lg hover:bg-[#2d2d2e] transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                      </svg>
                      {t('navigation.startNavigation')}
                    </button>
                  )}

                  {/* Share Button */}
                  {isOwner && (
                    <>
                      <button
                        onClick={handleShareClick}
                        className="w-full flex items-center justify-center px-4 py-2 bg-white text-[#1d1d1e] border border-[#62626a] rounded-lg hover:bg-[#fcfcfc] transition-all duration-200"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
                        </svg>
                        {t('details.shareTrip')}
                      </button>
                      <TripShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} shareUrl={shareUrl} />
                    </>
                  )}

                  {/* Share to Community Button */}
                  {isOwner && (
                    <button
                      onClick={() => showComingSoonModal('Community sharing')}
                      className="w-full flex items-center justify-center px-4 py-2 bg-white text-[#1d1d1e] border border-[#62626a] rounded-lg hover:bg-[#fcfcfc] transition-all duration-200"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {t('details.shareToCommunity')}
                    </button>
                  )}

                  {/* Print Button */}
                  <button
                    onClick={() => {
                      const tripData = {
                        title: tripTitle,
                        description: tripDescription,
                        startDate: trip?.start_date || zapOutTrip?.date || zapRoadTrip?.start_date,
                        endDate: trip?.end_date || zapRoadTrip?.end_date,
                        category: trip?.category || zapOutTrip?.category || zapRoadTrip?.category || undefined,
                        notes: trip?.notes || zapOutTrip?.additional_needs || zapRoadTrip?.special_requirements || undefined,
                        geopositions: geopositions.map(pos => ({
                          ...pos,
                          type: pos.type || 'point',
                          coordinates: pos.coordinates
                        })),
                        ai_content: trip?.ai_content || zapOutTrip?.ai_content || zapRoadTrip?.ai_content
                      };
                      generateTripPDF(tripData);
                    }}
                    className="w-full flex items-center justify-center px-4 py-2 bg-white text-[#1d1d1e] border border-[#62626a] rounded-lg hover:bg-[#fcfcfc] transition-all duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                    </svg>
                    {t('details.printTrip')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Travel Tips Section */}
        <div className="mt-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-white">
              <h2 className="text-xl font-bold text-[#030303] flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                {t('details.travelTips')}
              </h2>
            </div>
            <div className="p-4 sm:p-8">
              <div className="w-full max-w-full mx-auto overflow-hidden">
                {trip?.ai_content && <TripAIContent content={trip.ai_content} tripType={trip?.trip_type || trip?.type || 'ZapTrip'} />}
                {zapOutTrip?.ai_content && <TripAIContent content={zapOutTrip.ai_content} tripType={zapOutTrip?.type || 'ZapOut'} />}
                {zapRoadTrip?.ai_content && <TripAIContent content={zapRoadTrip.ai_content} tripType={zapRoadTrip?.type || 'ZapRoad'} />}
              </div>
            </div>
          </div>
        </div>

        {/* Trip Type Specific Details */}
        <div className="mt-6">
        </div>
      </div>

      <AnimatePresence>
        {showNotesSection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-white z-50 overflow-y-auto"
          >
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">{t('details.notes')}</h2>
                <button
                  onClick={() => setShowNotesSection(false)}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  {t('details.close')}
                </button>
              </div>

              {/* Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Notes Section */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <div className="flex flex-col space-y-4">
                    <h3 className="text-lg font-semibold">{t('details.notesInPage')}</h3>
                    
                    {/* New Note Input */}
                    <div className="flex gap-2">
                      <Input
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        placeholder={t('details.notesPlaceholder')}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            createNoteBlock();
                          }
                        }}
                      />
                      <Button
                        onClick={createNoteBlock}
                        disabled={isSaving || !newNoteTitle.trim()}
                        className="shrink-0"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('details.addNote')}
                      </Button>
                    </div>

                    {/* Note Blocks */}
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-4">
                        {noteBlocks.map((note) => (
                          <div
                            key={note.id}
                            className="bg-gray-50 rounded-lg p-4 space-y-2 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{note.title}</h4>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingNoteId(editingNoteId === note.id ? null : note.id)}
                                  className="hover:bg-gray-200"
                                >
                                  {editingNoteId === note.id ? (
                                    <Save className="w-4 h-4" />
                                  ) : (
                                    <Edit2 className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNoteBlock(note.id)}
                                  className="hover:bg-red-100 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {editingNoteId === note.id ? (
                              <Textarea
                                value={note.content}
                                onChange={(e) => updateNoteBlock(note.id, e.target.value)}
                                placeholder="Write your note here..."
                                className="min-h-[100px] resize-none"
                                autoFocus
                              />
                            ) : (
                              <p className="text-gray-600 whitespace-pre-wrap">
                                {note.content || 'No content yet...'}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              {new Date(note.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                {/* Travel Checklist Section */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <div className="flex flex-col space-y-4">
                    <h3 className="text-lg font-semibold">{t('details.checklist.title')}</h3>
                    
                    {/* New Item Input */}
                    <div className="flex gap-2">
                      <Input
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        placeholder={t('details.checklist.newItem')}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            createChecklistItem();
                          }
                        }}
                      />
                      <Button
                        onClick={createChecklistItem}
                        disabled={isSavingChecklist || !newItemTitle.trim()}
                        className="shrink-0"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('details.checklist.addItem')}
                      </Button>
                    </div>

                    {/* Checklist Items */}
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-4">
                        {checklistItems.map((item) => (
                          <div
                            key={item.id}
                            className="bg-gray-50 rounded-lg p-4 space-y-2 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  id={`checklist-${item.id}`}
                                  checked={item.is_checked}
                                  onCheckedChange={() => toggleItemCheck(item.id)}
                                />
                                <Label
                                  htmlFor={`checklist-${item.id}`}
                                  className={`text-base ${item.is_checked ? 'line-through text-gray-500' : ''}`}
                                >
                                  {item.title}
                                </Label>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setExpandedItems(prev => {
                                      const next = new Set(prev);
                                      if (next.has(item.id)) {
                                        next.delete(item.id);
                                      } else {
                                        next.add(item.id);
                                      }
                                      return next;
                                    });
                                  }}
                                  className="hover:bg-gray-200"
                                >
                                  <svg
                                    className={`w-4 h-4 transform transition-transform ${
                                      expandedItems.has(item.id) ? 'rotate-180' : ''
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M19 9l-7 7-7-7"
                                    />
                                  </svg>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteChecklistItem(item.id)}
                                  className="hover:bg-red-100 hover:text-red-600"
                                  title={t('details.checklist.deleteItem')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Sub-items Section */}
                            {expandedItems.has(item.id) && (
                              <div className="pl-8 space-y-2">
                                {/* New Sub-item Input */}
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Input
                                    value={newSubItemTitle}
                                    onChange={(e) => setNewSubItemTitle(e.target.value)}
                                    placeholder={t('details.checklist.newSubItem')}
                                    className="flex-1"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        createSubItem(item.id);
                                      }
                                    }}
                                  />
                                  <Button
                                    onClick={() => createSubItem(item.id)}
                                    disabled={isSavingChecklist || !newSubItemTitle.trim()}
                                    className="shrink-0 whitespace-nowrap"
                                  >
                                    <Plus className="w-4 h-4 sm:mr-2" />
                                    <span className="hidden sm:inline">{t('details.checklist.addSubItem')}</span>
                                    <span className="sm:hidden">{t('details.checklist.addSubItem')}</span>
                                  </Button>
                                </div>

                                {/* Sub-items List */}
                                {item.subitems.map((subItem) => (
                                  <div
                                    key={subItem.id}
                                    className="flex items-center justify-between p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`subitem-${subItem.id}`}
                                        checked={subItem.is_checked}
                                        onCheckedChange={() => toggleSubItemCheck(item.id, subItem.id)}
                                        className="h-4 w-4"
                                      />
                                      <Label
                                        htmlFor={`subitem-${subItem.id}`}
                                        className={`text-xs sm:text-sm ${subItem.is_checked ? 'line-through text-gray-500' : ''}`}
                                      >
                                        {subItem.title}
                                      </Label>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteSubItem(item.id, subItem.id)}
                                      className="hover:bg-red-100 hover:text-red-600 p-1.5"
                                      title={t('details.checklist.deleteSubItem')}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TripDetails;
