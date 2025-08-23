import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { TripDeleteDialog } from './TripDeleteDialog';
import { TripCardHeader } from './TripCardHeader';
import { TripCardMap } from './TripCardMap';
import { TripCardDetails } from './TripCardDetails';
import { TripDeleteButton } from './TripDeleteButton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

interface TripCardProps {
  trip: {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    location: string | null;
    coordinates: [number, number] | null;
    ai_content: string | null;
    trip_type?: string | null;
    date: string;
  };
  onDelete: (tripId: string) => Promise<boolean>;
  userRole: string | null;
  hasFreeTrip: boolean;
}

export function TripCard({ trip, onDelete, userRole, hasFreeTrip }: TripCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAiContentLoading, setIsAiContentLoading] = useState(false);
  const [localAiContent, setLocalAiContent] = useState<string | null>(trip.ai_content);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingCountRef = useRef(0);
  const MAX_POLLING_COUNT = 60; // Stop polling after ~5 minutes (5 seconds × 60)
  const POLLING_INTERVAL = 5000; // Check every 5 seconds
  const { i18n } = useTranslation();
  const lang = i18n.language;   
  const handleClick = () => {
    // Navigate to different routes based on trip type
    if (trip.trip_type === 'ZapOut') {
      navigate(`/${lang}/zapout/${trip.id}`);
    } else if (trip.trip_type === 'ZapRoad') {
      navigate(`/${lang}/zaproad/${trip.id}`);
    } else {  
      navigate(`/${lang}/trips/${trip.id}`);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      const success = await onDelete(trip.id);
      if (success) {
        setDeleteDialogOpen(false);
      }
      return success;
    } catch (error) {
      console.error("Error during delete confirmation:", error);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  // Function to check for AI content updates
  const checkForAiContentUpdates = useCallback(async () => {
    if (!trip.id) return;

    try {
      pollingCountRef.current += 1;
      console.log(`Polling for AI content updates (attempt ${pollingCountRef.current})`);

      let result;
      if (trip.trip_type === 'ZapOut') {
        const { data } = await supabase
          .from('zapout_data')
          .select('ai_content')
          .eq('id', trip.id)
          .single();
        result = data;
      } else if (trip.trip_type === 'ZapRoad') {
        const { data } = await supabase
          .from('zaproad_data')
          .select('ai_content')
          .eq('id', trip.id)
          .single();
        result = data;
      } else {
        const { data } = await supabase
          .from('trips')
          .select('ai_content')
          .eq('id', trip.id)
          .single();
        result = data;
      }

      if (result && result.ai_content) {
        console.log('AI content found, stopping polling');
        setLocalAiContent(result.ai_content);

        // Clear the polling interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        // Update loading state
        setIsAiContentLoading(false);
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
  }, [trip.id, trip.trip_type, toast]);

  // Effect to handle AI content polling
  useEffect(() => {
    // Start polling if there's no AI content
    if (!localAiContent) {
      setIsAiContentLoading(true);
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
  }, [localAiContent, checkForAiContentUpdates]);

  return (
    <>
      <motion.div
        className={`bg-white rounded-lg shadow-md overflow-hidden relative group ${
          isAiContentLoading 
            ? 'cursor-not-allowed' 
            : 'cursor-pointer hover:shadow-lg'
        }`}
        whileHover={{ scale: isAiContentLoading ? 1 : 1.02 }}
        transition={{ duration: 0.3 }}
        onClick={handleClick}
      >
        {/* Overlay to darken the entire card by 30% during loading */}
        {isAiContentLoading && (
          <div className="absolute inset-0 bg-black/30 z-10"></div>
        )}
        
        <TripCardHeader 
          title={trip.title} 
          tripType={trip.trip_type} 
        />
        
        <TripDeleteButton onClick={handleDeleteClick} />
        
        <div className="relative">
          <TripCardMap 
            coordinates={trip.coordinates}
            location={trip.location}
            tripId={trip.id}
            tripTitle={trip.title}
          />
        </div>
        
        <div className={`relative ${isAiContentLoading ? 'z-20' : ''}`}>
          <TripCardDetails 
            title={trip.title}
            description={trip.description}
            startDate={trip.start_date}
            endDate={trip.end_date}
            location={trip.location}
            aiContent={localAiContent}
            tripType={trip.trip_type}
            zapOutDate={trip.trip_type === 'ZapOut' ? trip.date : undefined}
            isAiContentLoading={isAiContentLoading}
          />
        </div>
      </motion.div>

      <TripDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        tripTitle={trip.title}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
