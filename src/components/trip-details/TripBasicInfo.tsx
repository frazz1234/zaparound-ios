import { useTranslation } from 'react-i18next';
import { format, isValid, parseISO } from "date-fns";
import { enUS, fr, es } from 'date-fns/locale';
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, MapPinIcon, TagIcon, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TripBasicInfoProps {
  startDate: string;
  endDate: string;
  location: string | null;
  category: string | null;
  activityTypes?: string[];
  budget: number | null;
  isEditing: boolean;
  isZapOutTrip?: boolean;
  isZapRoadTrip?: boolean;
  hideBudget?: boolean;
  onCategoryChange: (value: string) => void;
  onBudgetChange: (value: number | null) => void;
}

export function TripBasicInfo({
  startDate,
  endDate,
  location,
  category,
  activityTypes = [],
  budget,
  isEditing,
  isZapOutTrip = false,
  isZapRoadTrip = false,
  hideBudget = false,
  onCategoryChange,
  onBudgetChange
}: TripBasicInfoProps) {
  const { t } = useTranslation('trip');

  // Format dates safely, handling invalid dates
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      const { i18n } = useTranslation();
      // First try to parse as ISO string
      const date = parseISO(dateString);
      let locale = enUS;
      if (i18n.language === 'fr') locale = fr;
      else if (i18n.language === 'es') locale = es;
      if (isValid(date)) {
        return format(date, 'PPP', { locale });
      }
      // If not a valid ISO string, try as regular date
      const fallbackDate = new Date(dateString);
      return isValid(fallbackDate) ? format(fallbackDate, 'PPP', { locale }) : '';
    } catch (error) {
      console.error("Error formatting date:", error);
      return '';
    }
  };

  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  // For ZapOut trips, we only display one date
  const dateDisplay = isZapOutTrip 
    ? formattedStartDate
    : (formattedStartDate && formattedEndDate)
      ? `${formattedStartDate} - ${formattedEndDate}`
      : formattedStartDate || formattedEndDate;

  // Format activity types for display
  const formatActivityTypes = (types: string[]): string => {
    if (!types || types.length === 0) {
      return t('types.zapOut.details.noActivitiesSelected');
    }
    return types.map(type => t(`types.zapOut.details.${type}`)).join(', ');
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Date */}
          {dateDisplay && (
            <div className="flex items-start gap-3">
              <CalendarIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {isZapOutTrip ? t('types.zapOut.when') : t('form.date')}
                </p>
                <p className="text-base">{dateDisplay}</p>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="flex items-start gap-3">
            <MapPinIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('form.destination')}</p>
              <p className="text-base">{location || t('details.locationNotSpecified')}</p>
            </div>
          </div>

          {/* Category or Activity Types - Hide for ZapRoad trips */}
          {!isZapRoadTrip && (
            <div className="flex items-start gap-3">
              <TagIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {isZapOutTrip ? t('types.zapOut.details.activityTypes') : t('details.category')}
                </p>
                {isEditing && !isZapOutTrip ? (
                  <Select
                    value={category || ''}
                    onValueChange={onCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('details.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leisure" className="cursor-pointer hover:bg-accent transition-colors duration-200">{t('categories.leisure')}</SelectItem>
                      <SelectItem value="business" className="cursor-pointer hover:bg-accent transition-colors duration-200">{t('categories.business')}</SelectItem>
                      <SelectItem value="family" className="cursor-pointer hover:bg-accent transition-colors duration-200">{t('categories.family')}</SelectItem>
                      <SelectItem value="adventure" className="cursor-pointer hover:bg-accent transition-colors duration-200">{t('categories.adventure')}</SelectItem>
                      <SelectItem value="city" className="cursor-pointer hover:bg-accent transition-colors duration-200">{t('categories.city')}</SelectItem>
                      <SelectItem value="beach" className="cursor-pointer hover:bg-accent transition-colors duration-200">{t('categories.beach')}</SelectItem>
                      <SelectItem value="nature" className="cursor-pointer hover:bg-accent transition-colors duration-200">{t('categories.nature')}</SelectItem>
                      <SelectItem value="culture" className="cursor-pointer hover:bg-accent transition-colors duration-200">{t('categories.culture')}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-base">
                    {isZapOutTrip 
                      ? formatActivityTypes(activityTypes)
                      : (category ? t(`categories.${category}`) : t('details.selectCategory'))}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Budget */}
          {!hideBudget && (
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('details.budget')}</p>
                {isEditing ? (
                  <Input
                    type="number"
                    value={budget || ''}
                    onChange={(e) => onBudgetChange(e.target.value ? Number(e.target.value) : null)}
                    placeholder={t('details.enterBudget')}
                  />
                ) : (
                  <p className="text-base">{budget ? `$${budget}` : t('types.zapOut.details.noBudgetSpecified')}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
