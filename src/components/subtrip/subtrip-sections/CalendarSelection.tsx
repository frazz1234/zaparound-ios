import React, { forwardRef } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTranslation } from 'react-i18next';
import { formatDateWithCapitalMonth } from '../subtrip-utils/helpers';
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { DateRange } from "react-day-picker";
import { ChevronLeft, CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageVariants } from '../subtrip-utils/animations';

// Define trip type colors
const TRIP_COLORS = {
  'plan-trip': '#61936f', // ZapTrip - Green
  'roadtrip': '#61936f', // ZapRoad - Blue
  'tinder-date': '#61936f', // ZapOut - Pink
  'friends': '#61936f', // ZapOut - Pink
} as const;

interface SingleDateCalendarProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedActivity: 'plan-trip' | 'tinder-date' | 'friends' | 'roadtrip' | null;
}

export const SingleDateCalendar: React.FC<SingleDateCalendarProps> = ({ 
  selectedDate, 
  setSelectedDate,
  selectedActivity 
}) => {
  const { t } = useTranslation('home');
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const handleTodayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const today = new Date();
    setSelectedDate(today);
    setIsCalendarOpen(false);
  };

  const tripColor = selectedActivity ? TRIP_COLORS[selectedActivity] : '#61936f';

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          className={cn(
            "text-white hover:opacity-90 min-w-[100px]",
            `bg-[${tripColor}]`
          )}
          onClick={handleTodayClick}
        >
          {t('calendar.today')}
        </Button>

        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "flex-1 justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? formatDateWithCapitalMonth(selectedDate) : t('calendar.selectDate.placeholder')}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-4" 
            align="start"
            sideOffset={4}
            onInteractOutside={(e) => {
              e.preventDefault();
            }}
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                if (date) {
                  setIsCalendarOpen(false);
                }
              }}
              numberOfMonths={1}
              disabled={(date) => date < new Date()}
              showOutsideDays={true}
              className="rounded-md border-none"
              classNames={{
                months: "w-full flex justify-center",
                month: "w-full space-y-4",
                caption: "flex justify-center pt-1 relative items-center text-base",
                caption_label: "text-base font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  buttonVariants({ variant: "outline" }),
                  "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex w-full justify-between px-1",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.875rem] text-center",
                row: "flex w-full justify-between mt-2 px-1",
                cell: cn(
                  "relative p-0 text-center",
                  "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                  "focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent"
                ),
                day: cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-9 w-9 p-0 font-normal text-[0.875rem] aria-selected:opacity-100",
                  "hover:bg-accent hover:text-accent-foreground [&[aria-selected=true]]:hover:bg-[#61936f] [&[aria-selected=true]]:hover:text-white",
                  "focus:bg-accent focus:text-accent-foreground focus:rounded-md"
                ),
                day_selected: cn(
                  "text-white hover:text-white focus:text-white rounded-md",
                  `bg-[${tripColor}] hover:bg-[${tripColor}] focus:bg-[${tripColor}]`,
                  "!bg-[#61936f] hover:!bg-[#61936f] focus:!bg-[#61936f] !text-white"
                ),
                day_today: "bg-accent text-accent-foreground rounded-md",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

interface RangeDateCalendarProps {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  selectedActivity: 'plan-trip' | 'tinder-date' | 'friends' | 'roadtrip' | null;
}

export const RangeDateCalendar: React.FC<RangeDateCalendarProps> = ({ 
  dateRange, 
  setDateRange,
  selectedActivity 
}) => {
  const tripColor = selectedActivity ? TRIP_COLORS[selectedActivity] : '#61936f';
  const { t } = useTranslation('home');
  const [showWarning, setShowWarning] = React.useState(false);

  // Custom handler to limit date range to 10 days for ZapTrip
  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (!range || !range.from || !range.to) {
      setDateRange(range);
      setShowWarning(false);
      return;
    }

    // Calculate the difference in days (inclusive range)
    const diffTime = Math.abs(range.to.getTime() - range.from.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // For ZapTrip (plan-trip), limit to 10 days
    if (selectedActivity === 'plan-trip' && diffDays > 10) {
      // Show warning message
      setShowWarning(true);
      
      // Don't update the date range if it exceeds 10 days
      return;
    }

    setShowWarning(false);
    setDateRange(range);
  };

  return (
    <div className="space-y-4">
      <Calendar
        mode="range"
        selected={dateRange}
        onSelect={handleDateRangeSelect}
        numberOfMonths={2}
        disabled={(date) => date < new Date()}
        showOutsideDays={true}
        className="w-full rounded-md border-none"
        classNames={{
          months: "w-full flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "w-full space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex w-full",
          head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 flex-1 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-full p-0 font-normal aria-selected:opacity-100",
            "hover:bg-accent hover:text-accent-foreground [&[aria-selected=true]]:hover:bg-[#61936f] [&[aria-selected=true]]:hover:text-white"
          ),
          day_selected: cn(
            "text-white hover:text-white focus:text-white",
            `bg-[${tripColor}] hover:bg-[${tripColor}] focus:bg-[${tripColor}]`
           
          ),
          day_today: "bg-accent text-accent-foreground",
          day_outside: "text-muted-foreground opacity-50",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
        }}
      />
      
      {/* Informational message for ZapTrip */}
      {selectedActivity === 'plan-trip' && (
        <div className="text-sm text-muted-foreground text-center">
          {t('calendar.maxDaysExceeded.zapTripLimit', 'ZapTrip is limited to a maximum of 10 days.')}
        </div>
      )}
      
      {/* Warning message when limit is exceeded */}
      {showWarning && (
        <div className="text-sm text-red-600 text-center bg-red-50 p-2 rounded-md border border-red-200">
          {t('calendar.maxDaysExceeded.title', 'Maximum days exceeded')}: {t('calendar.maxDaysExceeded.description', 'ZapTrip is limited to a maximum of 10 days.')}
        </div>
      )}
    </div>
  );
};

interface CalendarSelectionProps {
  selectedActivity: 'plan-trip' | 'tinder-date' | 'friends' | 'roadtrip' | null;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  onContinue: () => void;
  onBack: () => void;
  isFinalStep?: boolean;
}

const CalendarSelection = forwardRef<HTMLDivElement, CalendarSelectionProps>(({
  selectedActivity,
  selectedDate,
  setSelectedDate,
  dateRange,
  setDateRange,
  onContinue,
  onBack,
  isFinalStep = false
}, ref) => {
  const { t } = useTranslation('home');
  
  const showContinueButton = React.useMemo(() => {
    if (selectedActivity === 'tinder-date' || selectedActivity === 'friends') {
      return Boolean(selectedDate);
    }
    return Boolean(dateRange?.from && dateRange?.to);
  }, [selectedActivity, selectedDate, dateRange]);

  const isZapOut = selectedActivity === 'tinder-date' || selectedActivity === 'friends';
  const tripColor = selectedActivity ? TRIP_COLORS[selectedActivity] : '#61936f';

  return (
    <motion.div
      ref={ref}
      key="calendar-step"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className={cn(
        "w-full",
        isZapOut ? "max-w-2xl" : "w-full"
      )}
    >
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 md:mb-10">
        {selectedActivity === 'tinder-date' 
          ? t('calendar.title.tinderDate')
          : selectedActivity === 'friends'
          ? t('calendar.title.friends')
          : t('calendar.title.trip')}
      </h1>

      <div className={cn(
        "mx-auto",
        isZapOut ? "max-w-md" : "max-w-4xl",
        "w-full"
      )}>
        <Card className={cn(
          "bg-white shadow-lg w-full",
          isZapOut ? "p-3" : "p-6"
        )}>
          <div className="flex flex-col space-y-4 w-full">
            {(selectedActivity === 'tinder-date' || selectedActivity === 'friends') ? (
              selectedDate && (
                <div className="text-lg font-medium text-[#1d1d1e] text-center">
                  {formatDateWithCapitalMonth(selectedDate)}
                </div>
              )
            ) : (
              dateRange?.from && dateRange?.to && (
                <div className="text-lg font-medium text-[#1d1d1e] text-center">
                  {formatDateWithCapitalMonth(dateRange.from)} to{" "}
                  {formatDateWithCapitalMonth(dateRange.to)}
                </div>
              )
            )}

            {(selectedActivity === 'tinder-date' || selectedActivity === 'friends') ? (
              <SingleDateCalendar 
                selectedDate={selectedDate} 
                setSelectedDate={setSelectedDate}
                selectedActivity={selectedActivity}
              />
            ) : (
              <RangeDateCalendar 
                dateRange={dateRange} 
                setDateRange={setDateRange}
                selectedActivity={selectedActivity}
              />
            )}

            <div className="text-sm text-muted-foreground text-center">
              {selectedActivity === 'tinder-date' 
                ? t('calendar.selectDate.tinderDate')
                : selectedActivity === 'friends'
                ? t('calendar.selectDate.friends')
                : t('calendar.selectDate.trip')
              }
            </div>
          </div>
        </Card>

        <div className="mt-8 flex flex-col md:flex-row gap-4 justify-center">
          <Button
            variant="ghost"
            className={cn(
              "hover:opacity-90",
              `text-[${tripColor}]`
            )}
            onClick={onBack}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('Back')}
          </Button>

          {showContinueButton && (
            <Button
              className={cn(
                "text-white hover:opacity-90",
                `bg-[${tripColor}]`
              )}
              onClick={onContinue}
            >
              {isFinalStep && (selectedActivity === 'tinder-date' || selectedActivity === 'friends') 
                ? t('createZapOut') 
                : t('Continue')}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

CalendarSelection.displayName = 'CalendarSelection';

export default CalendarSelection; 