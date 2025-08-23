import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, addDays, isBefore, isAfter, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  singleDateMode?: boolean;
  minDays?: number;
  maxDays?: number;
  label?: string;
  disabled?: boolean;
  fromDate?: Date;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  singleDateMode = false,
  minDays = 2,
  maxDays = 7,
  label,
  disabled = false,
  fromDate = new Date(),
}: DateRangePickerProps) {
  const { t } = useTranslation('trip');
  const { i18n } = useTranslation();
  const language = i18n.language;
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Keep track of render count for debugging
  const renderCount = useRef(0);
  renderCount.current++;
  
  // Check if inside a dialog
  const [isInDialog, setIsInDialog] = useState<boolean>(false);
  
  // Check component ancestry to determine if we're in a dialog
  useEffect(() => {
    const checkForDialog = () => {
      if (typeof document !== 'undefined') {
        // Find the component's container
        try {
          const startButton = document.getElementById('start-date');
          if (startButton) {
            // Walk up the DOM tree to find a dialog
            let parent: HTMLElement | null = startButton;
            while (parent) {
              if (
                parent.getAttribute('role') === 'dialog' || 
                parent.tagName.toLowerCase() === 'dialog' ||
                parent.classList.contains('dialog') ||
                parent.classList.contains('modal')
              ) {
                console.log('[DateRangePicker] Detected inside a dialog/modal!');
                setIsInDialog(true);
                return;
              }
              parent = parent.parentElement;
            }
          }
        } catch (error) {
          console.error('[DateRangePicker] Error checking for dialog:', error);
        }
      }
    };
    
    // Run after component mounts and DOM is available
    setTimeout(checkForDialog, 100);
  }, []);
  
  console.log(`[DateRangePicker] Render #${renderCount.current} - isStartOpen: ${isStartOpen}, isEndOpen: ${isEndOpen}, isInDialog: ${isInDialog}`);
  console.log(`[DateRangePicker] Dates - startDate: ${startDate?.toISOString() || 'undefined'}, endDate: ${endDate?.toISOString() || 'undefined'}`);

  // Get today's date at the start of the day for consistent comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Reset error when dates change
  useEffect(() => {
    setError(null);
  }, [startDate, endDate]);

  // Track state changes
  useEffect(() => {
    console.log(`[DateRangePicker] Start picker state changed to: ${isStartOpen ? 'OPEN' : 'CLOSED'}`);
  }, [isStartOpen]);
  
  useEffect(() => {
    console.log(`[DateRangePicker] End picker state changed to: ${isEndOpen ? 'OPEN' : 'CLOSED'}`);
  }, [isEndOpen]);

  const handleStartPopoverChange = useCallback((open: boolean) => {
    console.log(`[DateRangePicker] handleStartPopoverChange called with open: ${open}`);
    setIsStartOpen(open);
    
    // Only auto-open end date if we're closing start date and have a start date but no end date
    if (!open && !singleDateMode && startDate && !endDate) {
      console.log(`[DateRangePicker] Conditions met to auto-open end date picker`);
      // Use RAF to ensure DOM updates have completed
      requestAnimationFrame(() => {
        console.log(`[DateRangePicker] RAF executing, setting isEndOpen to true`);
        setIsEndOpen(true);
      });
    }
  }, [singleDateMode, startDate, endDate]);

  const handleEndPopoverChange = useCallback((open: boolean) => {
    console.log(`[DateRangePicker] handleEndPopoverChange called with open: ${open}`);
    setIsEndOpen(open);
  }, []);

  const validateDateRange = useCallback((start: Date, end: Date): boolean => {
    console.log(`[DateRangePicker] Validating date range - start: ${start.toISOString()}, end: ${end.toISOString()}`);
    const daysDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`[DateRangePicker] Days difference: ${daysDiff}`);
    
    if (daysDiff < minDays) {
      const errorMsg = t('form.minDaysError', { days: minDays });
      console.log(`[DateRangePicker] Validation error: ${errorMsg}`);
      setError(errorMsg);
      return false;
    }
    
    if (daysDiff > maxDays) {
      const errorMsg = t('form.maxDaysError', { days: maxDays });
      console.log(`[DateRangePicker] Validation error: ${errorMsg}`);
      setError(errorMsg);
      return false;
    }
    
    console.log(`[DateRangePicker] Date range is valid`);
    return true;
  }, [minDays, maxDays, t]);
  
  const handleStartDateSelect = useCallback((date: Date | undefined) => {
    console.log(`[DateRangePicker] handleStartDateSelect called with date: ${date?.toISOString() || 'undefined'}`);
    setError(null);
    if (date) {
      console.log(`[DateRangePicker] Calling onStartDateChange with date: ${date.toISOString()}`);
      onStartDateChange(date);
      
      if (!singleDateMode && endDate) {
        console.log(`[DateRangePicker] Checking if current end date is still valid`);
        if (!validateDateRange(date, endDate)) {
          // If the current end date is invalid with the new start date,
          // automatically set a valid end date
          const newEndDate = addDays(date, minDays);
          console.log(`[DateRangePicker] End date invalid, setting new end date: ${newEndDate.toISOString()}`);
          onEndDateChange(newEndDate);
        }
      }
      
      // Close start date picker
      console.log(`[DateRangePicker] Closing start date picker`);
      setIsStartOpen(false);
    }
  }, [singleDateMode, endDate, minDays, onStartDateChange, onEndDateChange, validateDateRange]);
  
  const handleEndDateSelect = useCallback((date: Date | undefined) => {
    console.log(`[DateRangePicker] handleEndDateSelect called with date: ${date?.toISOString() || 'undefined'}`);
    setError(null);
    if (date && startDate) {
      if (validateDateRange(startDate, date)) {
        console.log(`[DateRangePicker] Calling onEndDateChange with date: ${date.toISOString()}`);
        onEndDateChange(date);
        console.log(`[DateRangePicker] Closing end date picker`);
        setIsEndOpen(false);
      } else {
        console.log(`[DateRangePicker] End date validation failed, not closing picker`);
      }
    }
  }, [startDate, onEndDateChange, validateDateRange]);
  
  const formatDate = useCallback((date: Date | undefined) => {
    if (!date) return "";
    try {
      let pattern;
      switch (language) {
        case 'fr':
          pattern = "dd MMM yyyy";
          break;
        case 'es':
          pattern = "dd 'de' MMM 'de' yyyy";
          break;
        default: // English
          pattern = "MMM dd, yyyy";
      }
      return format(date, pattern);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  }, [language]);

  // Calculate minimum and maximum end dates
  const minEndDate = startDate ? addDays(startDate, minDays) : undefined;
  const maxEndDate = startDate ? addDays(startDate, maxDays) : undefined;
  
  // Custom calendar styling
  const calendarClassNames = {
    root: "border-0",
    month: "space-y-2",
    caption: "flex justify-center pt-1 relative items-center",
    caption_label: "text-sm font-medium",
    nav: "space-x-1 flex items-center",
    nav_button: "h-6 w-6 bg-transparent hover:bg-accent rounded-md",
    table: "w-full border-collapse space-y-1",
    head_row: "flex justify-center",
    head_cell: "text-xs w-9 font-medium text-muted-foreground text-center",
    row: "flex w-full justify-center",
    cell: "text-center text-xs relative h-9 w-9 p-0 focus-within:relative focus-within:z-20 flex items-center justify-center",
    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent rounded-md transition-colors flex items-center justify-center",
    day_selected: "bg-primary text-primary-foreground rounded-md hover:bg-primary hover:text-primary-foreground",
    day_today: "border border-primary/50",
    day_range_middle: "bg-accent rounded-none",
    day_range_end: "bg-primary text-primary-foreground rounded-r-md",
    day_range_start: "bg-primary text-primary-foreground rounded-l-md",
    day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
    day_hidden: "invisible",
    day_outside: "text-muted-foreground opacity-50"
  };

  return (
    <div className={singleDateMode ? "w-full" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
      <div className="space-y-2">
        <Popover open={isStartOpen} onOpenChange={handleStartPopoverChange}>
          <PopoverTrigger asChild>
            <Button 
              id="start-date"
              variant="outline"
              disabled={disabled}
              className={cn(
                "w-full justify-start text-left font-normal",
                !startDate && "text-muted-foreground",
                disabled && "opacity-50 cursor-not-allowed",
                error && "border-red-500"
              )}
              aria-label={t('form.selectStartDate')}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? formatDate(startDate) : singleDateMode ? t('types.zapOut.when') : t('form.pickDate')}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0 bg-background shadow-lg rounded-md border"
            style={{ zIndex: isInDialog ? 9999 : 100 }}
            align="start"
            side="bottom"
            forceMount
            onInteractOutside={(e) => {
              console.log(`[DateRangePicker] Start picker outside interaction:`, e);
              if (isInDialog) {
                console.log('[DateRangePicker] Preventing outside interaction in dialog');
                e.preventDefault();
              }
            }}
          >
            <div onClick={(e) => {
              console.log(`[DateRangePicker] Calendar container clicked`, e);
              e.stopPropagation();
            }}>
              <Calendar 
                mode="single"
                selected={startDate}
                onSelect={handleStartDateSelect}
                disabled={(date) => isBefore(date, fromDate) || disabled}
                initialFocus
                fromDate={fromDate}
                defaultMonth={startDate || fromDate}
                className="border-none p-0"
                classNames={calendarClassNames}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {!singleDateMode && (
        <div className="space-y-2">
          <Popover open={isEndOpen} onOpenChange={handleEndPopoverChange}>
            <PopoverTrigger asChild>
              <Button 
                id="end-date"
                variant="outline"
                disabled={!startDate || disabled}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground",
                  (!startDate || disabled) && "opacity-50 cursor-not-allowed",
                  error && "border-red-500"
                )}
                aria-label={t('form.selectEndDate')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? formatDate(endDate) : t('form.pickDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-auto p-0 bg-background shadow-lg rounded-md border"
              style={{ zIndex: isInDialog ? 9999 : 100 }}
              align="start"
              side="bottom"
              forceMount
              onInteractOutside={(e) => {
                console.log(`[DateRangePicker] End picker outside interaction:`, e);
                if (isInDialog) {
                  console.log('[DateRangePicker] Preventing outside interaction in dialog');
                  e.preventDefault();
                }
              }}
            >
              <div onClick={(e) => {
                console.log(`[DateRangePicker] End calendar container clicked`, e);
                e.stopPropagation();
              }}>
                <Calendar 
                  mode="single"
                  selected={endDate}
                  onSelect={handleEndDateSelect}
                  disabled={(date) => {
                    if (disabled) return true;
                    if (!startDate) return true;
                    if (isBefore(date, minEndDate || today)) return true;
                    if (maxEndDate && isAfter(date, maxEndDate)) return true;
                    return false;
                  }}
                  initialFocus
                  fromDate={minEndDate}
                  toDate={maxEndDate}
                  defaultMonth={startDate || today}
                  className="border-none p-0"
                  classNames={calendarClassNames}
                />
              </div>
            </PopoverContent>
          </Popover>
          {error && (
            <p className="text-xs text-destructive mt-1">
              {error}
            </p>
          )}
          {startDate && !endDate && !error && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('form.minimumStay', { days: minDays })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Add this at the bottom of the file to help debug event flow
if (typeof window !== 'undefined') {
  // Debug global event listeners for popover issues
  document.addEventListener('click', (e) => {
    console.log(`[DateRangePicker Debug] Document click at ${new Date().toISOString().substr(11, 8)}`);
  }, { capture: true });
  
  document.addEventListener('pointerdown', (e) => {
    console.log(`[DateRangePicker Debug] Pointer down at ${new Date().toISOString().substr(11, 8)}`);
    console.log(`[DateRangePicker Debug] Target:`, e.target);
  }, { capture: true });
}
