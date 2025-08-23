import React, { forwardRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '../subtrip-utils/animations';
import useTranslatedData from '../subtrip-utils/data';
import { Compass, Lock, PlaneTakeoff, CableCar, Car, Heart } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { setHomepageCreateTripCache } from '@/utils/cache';
import { supabase } from '@/integrations/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActivitySelectionProps {
  selectedActivity: 'plan-trip' | 'tinder-date' | 'friends' | 'roadtrip' | null;
  hasPets?: boolean | null;
  onSelectActivity: (activity: 'plan-trip' | 'tinder-date' | 'friends' | 'roadtrip') => void;
  onSetHasPets?: (value: boolean) => void;
  onNext: (activityId?: 'plan-trip' | 'tinder-date' | 'friends' | 'roadtrip') => void;
  embedded?: boolean;
}

type ActivityType = 'plan-trip' | 'tinder-date' | 'friends' | 'roadtrip';

interface Activity {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const ActivitySelection = forwardRef<HTMLDivElement, ActivitySelectionProps>(({
  selectedActivity,
  hasPets,
  onSelectActivity,
  onSetHasPets,
  onNext,
  embedded = false
}, ref) => {
  const { t } = useTranslation('home');
  const { activities } = useTranslatedData();
  const { userRole } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Override the activities with our custom icons
  const customActivities: Activity[] = [
    {
      id: 'plan-trip',
      label: embedded ? t('activity.planTrip') : 'ZapTrip',
      icon: PlaneTakeoff,
      description: t('activity.description.plan-trip')
    },
    // Romantic Date option only shown when embedded
    ...(embedded ? [{
      id: 'romantic-date' as any,
      label: embedded ? t('activity.tinderDate') : 'Romantic Date',
      icon: Heart,
      description: t('activity.description.tinder-date'),
    }] : []),
    {
      id: 'friends',
      label: embedded ? t('activity.friendsActivity') : 'ZapOut',
      icon: CableCar,
      description: t('activity.description.friends')
    },
    {
      id: 'roadtrip',
      label: embedded ? t('activity.roadTrip') : 'ZapRoad',
      icon: Car,
      description: t('activity.description.roadtrip')
    }
  ];

  const canAccessActivity = (activityId: string) => {
    // If user is not connected (no userRole), allow access to all activities
    if (!userRole) return true;
    // Allow access to all activities for users with 'nosubs' role
    if (userRole === 'nosubs') return true;
    switch (activityId) {
      case 'plan-trip':
        return ['admin', 'tier1', 'tier4'].includes(userRole);
      case 'friends':
        return ['admin', 'tier2', 'tier4'].includes(userRole);
      case 'roadtrip':
        return ['admin', 'tier3', 'tier4'].includes(userRole);
      default:
        return false;
    }
  };

  const getRequiredTier = (activityId: string) => {
    switch (activityId) {
      case 'plan-trip':
        return 'tier1';
      case 'friends':
        return 'tier2';
      case 'roadtrip':
        return 'tier3';
      default:
        return 'tier1';
    }
  };

  const handleActivitySelect = async (activityId: 'plan-trip' | 'tinder-date' | 'friends' | 'roadtrip') => {
    if (canAccessActivity(activityId)) {
      // Set homepage create trip cache when activity is selected from homepage
      if (embedded) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // User is authenticated - set cache with their user ID
            const activityData = {
              selectedActivity: activityId,
              source: 'homepage',
              activityLabel: customActivities.find(a => a.id === activityId)?.label,
              startedAt: new Date().toISOString(),
            };
            setHomepageCreateTripCache(user.id, activityData);
          } else {
            // User is not authenticated - set temporary cache with session identifier
            const tempUserId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            const activityData = {
              selectedActivity: activityId,
              source: 'homepage',
              activityLabel: customActivities.find(a => a.id === activityId)?.label,
              startedAt: new Date().toISOString(),
              isTemporary: true,
            };
            // Store in sessionStorage for non-authenticated users
            sessionStorage.setItem('homepage-create-trip-temp', JSON.stringify(activityData));
          }
        } catch (error) {
          console.error('Error setting homepage create trip cache:', error);
          // Don't block the flow if cache fails
        }
      }
      
      onSelectActivity(activityId);
      // Automatically proceed to next step after selecting an activity
      // Pass the activityId directly to avoid state timing issues
      onNext(activityId);
    } else {
      // Only show tier restrictions for connected users
      if (userRole) {
        if (userRole === 'nosubs') {
          toast({
            title: t('activity.freeTripsExhausted'),
            description: t('activity.upgradeForMore'),
            variant: "destructive"
          });
          navigate('/dashboard');
        } else {
          toast({
            title: t('activity.accessDenied'),
            description: activityId === 'plan-trip' 
              ? t('activity.tier1Required')
              : t('activity.tier2Required'),
            variant: "destructive"
          });
          navigate('/pricing');
        }
      }
    }
  };

  useEffect(() => {
    // Debug activity translations
    console.log('Activity translations:');
    console.log('Plan Trip:', 'ZapTrip');
    console.log('Friends Activity:', 'ZapOut');
    console.log('Road Trip:', 'ZapRoad');
    console.log('Activities from data:', customActivities.map(a => a.label));
  }, []);

  return (
    <motion.div
      ref={ref}
      key="activity-step"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="w-full max-w-6xl mx-auto"
    >
      {!embedded && (
        <div className="text-center mb-6 md:mb-12">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl sm:text-2xl md:text-5xl lg:text-6xl font-bold text-white mb-2 md:mb-3"
          >
            {t('activity.title')}
          </motion.h1>
        </div>
      )}



      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-2 md:gap-6 max-w-5xl mx-auto",
          embedded ? "grid-cols-2 md:grid-cols-4" : "md:grid-cols-3"
        )}
      >
        {customActivities.map((activity, index) => {
          const Icon = activity.icon;
          const isAccessible = activity.id === 'romantic-date'
            ? canAccessActivity('friends')
            : canAccessActivity(activity.id);
          const requiredTier = activity.id === 'romantic-date'
            ? getRequiredTier('friends')
            : getRequiredTier(activity.id);
          
          return (
            <TooltipProvider key={activity.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    onClick={() => {
                      if (activity.id === 'romantic-date') {
                        handleActivitySelect('friends');
                      } else {
                        handleActivitySelect(activity.id as ActivityType);
                      }
                    }}
                    className={cn(
                      "relative rounded-2xl border transition-all duration-300",
                      // Compact sizing when embedded (homepage)
                      embedded
                        ? "p-3 sm:p-4 md:p-4 min-h-[120px] sm:min-h-[140px] md:min-h-[160px] gap-2 md:gap-4 max-w-[140px] sm:max-w-[160px] md:max-w-[190px]"
                        : "p-4 sm:p-6 md:p-12 min-h-[140px] sm:min-h-[180px] md:min-h-[220px] gap-2 md:gap-8 max-w-xs",
                      "flex flex-col items-center justify-center overflow-hidden group min-w-0 w-full mx-auto",
                      isAccessible 
                        ? "hover:scale-[1.03]"
                        : userRole 
                          ? "cursor-not-allowed"
                          : "hover:scale-[1.03]",
                      (selectedActivity === activity.id || (activity.id === 'romantic-date' && selectedActivity === 'friends'))
                        ? activity.id === 'plan-trip'
                          ? "bg-gradient-to-br from-sky-500/20 to-blue-500/5 border-sky-500 shadow-lg shadow-sky-500/10"
                          : activity.id === 'friends'
                          ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/5 border-emerald-500 shadow-lg shadow-emerald-500/10"
                          : activity.id === 'romantic-date'
                          ? "bg-gradient-to-br from-rose-500/20 to-red-500/5 border-red-500 shadow-lg shadow-red-500/10"
                          : "bg-gradient-to-br from-amber-500/20 to-yellow-500/5 border-amber-500 shadow-lg shadow-amber-500/10"
                        : isAccessible
                          ? "bg-white/95 backdrop-blur-sm border-white/20 hover:border-[#61936f]/50 hover:shadow-lg hover:shadow-[#61936f]/5"
                          : userRole
                            ? "bg-white/80 backdrop-blur-sm border-white/10 grayscale-[30%]"
                            : "bg-white/95 backdrop-blur-sm border-white/20 hover:border-[#61936f]/50 hover:shadow-lg hover:shadow-[#61936f]/5"
                    )}
                  >
                    {/* Background gradient effect */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300",
                      activity.id === 'plan-trip'
                        ? "from-sky-500/10 to-blue-500/5"
                        : activity.id === 'friends'
                        ? "from-emerald-500/10 to-teal-500/5"
                        : activity.id === 'romantic-date'
                        ? "from-rose-500/10 to-red-500/5"
                        : "from-amber-500/10 to-yellow-500/5",
                      (isAccessible || !userRole) && "group-hover:opacity-100"
                    )} />

                    {/* Lock overlay for inaccessible activities - only show for connected users */}
                    {!isAccessible && userRole && (
                      <div className="absolute inset-0 bg-[#030303]/5 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="absolute top-2 right-2 bg-[#1d1d1e]/90 rounded-full p-1">
                          <Lock className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}

                    <div className={cn(
                      "relative rounded-2xl flex items-center justify-center",
                      embedded
                        ? "w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16"
                        : "w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28",
                      "transition-all duration-300 transform",
                      (isAccessible || !userRole) && "group-hover:scale-110",
                      (selectedActivity === activity.id || (activity.id === 'romantic-date' && selectedActivity === 'friends'))
                        ? activity.id === 'plan-trip'
                          ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                          : activity.id === 'friends'
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                          : activity.id === 'romantic-date'
                          ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                          : "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                        : isAccessible
                          ? activity.id === 'plan-trip'
                            ? "bg-sky-500/10 text-sky-500 group-hover:bg-sky-500/20"
                            : activity.id === 'friends'
                            ? "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20"
                            : activity.id === 'romantic-date'
                            ? "bg-red-500/10 text-red-500 group-hover:bg-red-500/20"
                            : "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20"
                          : userRole
                            ? "bg-gray-100/80 text-gray-400"
                            : activity.id === 'plan-trip'
                              ? "bg-sky-500/10 text-sky-500 group-hover:bg-sky-500/20"
                              : activity.id === 'friends'
                                ? "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20"
                                : activity.id === 'romantic-date'
                                  ? "bg-red-500/10 text-red-500 group-hover:bg-red-500/20"
                                  : "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20"
                    )}>
                      <Icon className="w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20" />
                    </div>

                    <div className="relative flex flex-col items-center gap-1 md:gap-3 w-full">
                      <span className={cn(
                        cn(
                          embedded ? "text-sm sm:text-base md:text-lg" : "text-base sm:text-lg md:text-2xl",
                          "font-semibold text-center transition-colors duration-300"
                        ),
                        (selectedActivity === activity.id || (activity.id === 'romantic-date' && selectedActivity === 'friends'))
                          ? activity.id === 'plan-trip'
                            ? "text-sky-500"
                            : activity.id === 'friends'
                            ? "text-emerald-500"
                            : activity.id === 'romantic-date'
                            ? "text-red-500"
                            : "text-amber-500"
                          : isAccessible
                            ? activity.id === 'plan-trip'
                              ? "text-sky-500"
                              : activity.id === 'friends'
                              ? "text-emerald-500"
                              : activity.id === 'romantic-date'
                              ? "text-red-500"
                              : "text-amber-500"
                            : userRole
                              ? "text-[#1d1d1e]/70"
                              : activity.id === 'plan-trip'
                                ? "text-sky-500"
                                : activity.id === 'friends'
                                  ? "text-emerald-500"
                                  : activity.id === 'romantic-date'
                                    ? "text-red-500"
                                    : "text-amber-500"
                      )}>
                        {activity.label}
                      </span>
                      {/* Always show description on mobile, only on desktop for md+ */}
                      <span className={cn(
                        embedded ? "text-[10px] sm:text-xs text-center block md:hidden" : "text-xs sm:text-sm text-center block md:hidden",
                        (selectedActivity === activity.id || (activity.id === 'romantic-date' && selectedActivity === 'friends')) ? "text-white" : "text-gray-500/80"
                      )}>
                        {activity.description}
                      </span>
                      <span className={cn(
                        embedded ? "text-sm text-center hidden md:block" : "text-base text-center hidden md:block",
                        (selectedActivity === activity.id || (activity.id === 'romantic-date' && selectedActivity === 'friends')) ? "text-white" : "text-gray-500/80"
                      )}>
                        {activity.description}
                      </span>
                      {!isAccessible && userRole && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-full bg-[#61936f]/10 text-xs font-medium text-[#61936f]">
                            {requiredTier === 'tier1' 
                              ? t('activity.tier1Required') 
                              : t('activity.tier2Required')}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.button>
                </TooltipTrigger>
                {!isAccessible && userRole && (
                  <TooltipContent>
                    <p>{t('activity.accessDenied')}</p>
                    <p className="text-xs text-[#61936f]">
                      {requiredTier === 'tier1' 
                        ? t('activity.tier1Required') 
                        : t('activity.tier2Required')}
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </motion.div>


    </motion.div>
  );
});

ActivitySelection.displayName = 'ActivitySelection';

export default ActivitySelection; 