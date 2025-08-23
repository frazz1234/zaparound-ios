import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/trips/DateRangePicker";
import { useTranslation } from 'react-i18next';
import { addDays } from "date-fns";
import { NumberInput } from "@/components/ui/number-input";

interface ZapRoadSetupPageProps {
  title: string;
  startDate?: Date;
  endDate?: Date;
  adults: number;
  kids: number;
  isLoading: boolean;
  onTitleChange: (value: string) => void;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onAdultsChange: (value: number) => void;
  onKidsChange: (value: number) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ZapRoadSetupPage({
  title,
  startDate,
  endDate,
  isLoading,
  onTitleChange,
  onStartDateChange,
  onEndDateChange,
  onBack,
  onSubmit
}: ZapRoadSetupPageProps) {
  const { t } = useTranslation('trip');
  const [useDuration, setUseDuration] = useState(true);
  const [duration, setDuration] = useState(1);
  
  // Handle duration changes and update end date based on start date + duration
  const handleDurationChange = (value: number) => {
    setDuration(value);
    if (startDate) {
      // Update end date based on the new duration
      onEndDateChange(addDays(startDate, value));
    }
  };
  
  // When start date changes and using duration mode, update end date
  const handleStartDateChange = (date: Date | undefined) => {
    onStartDateChange(date);
    if (date && useDuration) {
      onEndDateChange(addDays(date, duration));
    }
  };
  
  // Make sure the end date stays within 7 days of start date
  const handleEndDateChange = (date: Date | undefined) => {
    if (date && startDate) {
      const maxEndDate = addDays(startDate, 7);
      if (date > maxEndDate) {
        onEndDateChange(maxEndDate);
      } else {
        onEndDateChange(date);
      }
    } else {
      onEndDateChange(date);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">{t('types.zapRoad.setupTitle')}</h2>
        <p className="text-gray-600">{t('types.zapRoad.setupSubtitle')}</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">{t('form.tripName')}</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={t('types.zapRoad.titlePlaceholder')}
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2 mb-4">
            <Button 
              type="button"
              variant={useDuration ? "default" : "outline"}
              onClick={() => setUseDuration(true)}
              className="w-1/2"
            >
              {t('types.zapRoad.useDuration')}
            </Button>
            <Button 
              type="button"
              variant={!useDuration ? "default" : "outline"}
              onClick={() => setUseDuration(false)}
              className="w-1/2"
            >
              {t('types.zapRoad.useDates')}
            </Button>
          </div>
          
          {useDuration ? (
            <div className="space-y-2">
              <Label htmlFor="duration">{t('types.zapRoad.durationLabel')}</Label>
              <NumberInput
                id="duration"
                min={1}
                max={7}
                value={duration}
                onChange={handleDurationChange}
                aria-label={t('types.zapRoad.durationLabel')}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t('types.zapRoad.maxDuration')}
              </p>
              
              <div className="mt-4">
                <Label>{t('types.zapRoad.startDateLabel')}</Label>
                <DateRangePicker
                  startDate={startDate}
                  endDate={undefined}
                  onStartDateChange={handleStartDateChange}
                  onEndDateChange={() => {}}
                  singleDateMode={true}
                />
              </div>
            </div>
          ) : (
            <div>
              <Label>{t('form.date')}</Label>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
              />
              {startDate && endDate && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {t('types.zapRoad.dateDurationInfo')}:{" "}
                  {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} {t('types.zapRoad.days')}
                  {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) >= 7 && (
                    <p className="text-amber-600 mt-1">
                      {t('types.zapRoad.maxDurationWarning')}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          {t('form.back')}
        </Button>
        <Button 
          type="button" 
          onClick={(e) => {
            // Use the event parameter to prevent default form submission
            e.preventDefault();
            // Call the onSubmit function, which should actually be onNext in this context
            onSubmit(e);
          }} 
          disabled={isLoading || !title || !startDate || (useDuration ? false : !endDate)}
        >
          {t('form.next')}
        </Button>
      </div>
    </div>
  );
}
