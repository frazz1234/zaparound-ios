import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from 'react-i18next';

interface BirthDatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  disabled?: boolean;
}

export function BirthDatePicker({ date, setDate, disabled }: BirthDatePickerProps) {
  const { t, i18n } = useTranslation('profile');
  const [month, setMonth] = useState<number>(date ? date.getMonth() : new Date().getMonth());
  const [year, setYear] = useState<number>(date ? date.getFullYear() : new Date().getFullYear());

  // Generate years from 1900 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);

  // List of months using translations
  const months = [
    t('months.january'),
    t('months.february'),
    t('months.march'),
    t('months.april'),
    t('months.may'),
    t('months.june'),
    t('months.july'),
    t('months.august'),
    t('months.september'),
    t('months.october'),
    t('months.november'),
    t('months.december')
  ];

  const handleMonthChange = (value: string) => {
    const newMonth = months.indexOf(value);
    setMonth(newMonth);
    if (date) {
      const newDate = new Date(date);
      newDate.setMonth(newMonth);
      setDate(newDate);
    }
  };

  const handleYearChange = (value: string) => {
    const newYear = parseInt(value);
    setYear(newYear);
    if (date) {
      const newDate = new Date(date);
      newDate.setFullYear(newYear);
      setDate(newDate);
    }
  };

  // Function to format the date based on user's language
  const formatDateByLocale = (date: Date) => {
    try {
      let pattern;
      switch (i18n.language) {
        case 'fr':
          pattern = "dd MMMM yyyy";
          break;
        case 'es':
          pattern = "dd 'de' MMMM 'de' yyyy";
          break;
        default: // English
          pattern = "MMMM dd, yyyy";
      }
      return format(date, pattern);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{t('personal.birthdate')}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? formatDateByLocale(date) : <span>{t('validation.invalidDate')}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3 bg-white shadow-lg rounded-md border z-[999]" align="start">
          <div className="flex gap-2 mb-2">
            <Select value={months[month]} onValueChange={handleMonthChange} disabled={disabled}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t('personal.birthdate')} />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-white z-[1000]">
                {months.map((month, index) => (
                  <SelectItem key={index} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year.toString()} onValueChange={handleYearChange} disabled={disabled}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder={t('personal.birthdate')} />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-white z-[1000] max-h-[200px] overflow-y-auto">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={disabled ? undefined : setDate}
            month={new Date(year, month)}
            onMonthChange={disabled ? undefined : (date) => {
              setMonth(date.getMonth());
              setYear(date.getFullYear());
            }}
            className={cn("rounded-md border", disabled && "opacity-50 cursor-not-allowed")}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
