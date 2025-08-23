import { useTranslation } from 'react-i18next';
import { format, isValid, parseISO } from "date-fns";
import { enUS, fr, es } from 'date-fns/locale';
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  Clock, 
  Users, 
  Utensils, 
  Activity, 
  DollarSign, 
  FileText, 
  Accessibility, 
  UserCheck, 
  List,
  Map
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ZapOutDetailsCardProps {
  zapOutData: {
    activity_times?: string[];
    min_budget?: string;
    max_budget?: string;
    currency?: string;
    activity_types?: string[];
    budget_per_person?: string;
    additional_needs?: string;
    requested_activities?: string[];
    group_composition?: string;
    special_requirements?: string;
    accessibility_needs?: string;
    adults?: number;
    kids?: number;
    date?: string;
  };
  onClick?: () => void;
}

export function ZapOutDetailsCard({ zapOutData, onClick }: ZapOutDetailsCardProps) {
  const { t, i18n } = useTranslation('trip');

  // Format date safely
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
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

  const formatActivityTimes = (times: string[] | undefined) => {
    if (!times || times.length === 0) {
      return t('types.zapOut.details.noTimeSelected');
    }
    //return times.map(time => t(`types.zapOut.details.${time}`)).join(', ');
  };

  const formatActivityTypes = (types: string[] | undefined) => {
    if (!types || types.length === 0) {
      return t('types.zapOut.details.noActivitiesSelected');
    }
    //return types.map(type => t(`types.zapOut.details.${type}`)).join(', ');
  };

  const formatRequestedActivities = (activities: string[] | undefined) => {
    if (!activities || activities.length === 0) {
      return t('types.zapOut.details.noRequestedActivities');
    }
    return activities.join(', ');
  };

  const getPeopleCount = () => {
    const adults = zapOutData.adults || 0;
    const kids = zapOutData.kids || 0;
    const totalPeople = adults + kids;
    
    if (totalPeople === 0) return '';
    
    let result = '';
    if (adults > 0) {
      result += `${adults} ${t('form.adults')}`;
    }
    
    if (kids > 0) {
      if (result) result += ', ';
      result += `${kids} ${t('form.kids')}`;
    }
    
    return result;
  };

  return (
    <Card 
      className={cn(
        "relative group transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-lg"
      )}
      onClick={onClick}
    >
      {onClick && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200 pointer-events-none" />
      )}
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{t('types.zapOut.details.title')}</h3>
          {onClick && (
            <Map className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          )}
        </div>
        
        <div className="space-y-4">
          {/* Date */}
          {zapOutData.date && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('types.zapOut.when')}</p>
                <p className="text-base">{formatDate(zapOutData.date)}</p>
              </div>
            </div>
          )}
          
          {/* People (Adults & Kids) */}
          {(zapOutData.adults || zapOutData.kids) && (
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('types.zapOut.personDateTitle')}</p>
                <p className="text-base">{getPeopleCount()}</p>
              </div>
            </div>
          )}
          
          {/* Activity Times */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('types.zapOut.details.timeOfActivities')}</p>
              <p className="text-base">
                {zapOutData.activity_times && zapOutData.activity_times.length > 0
                  ? zapOutData.activity_times
                      .map((time: string) => {
                        const translationKey = `types.zapOut.details.${time}`;
                        const translated = t(translationKey);
                        return translated === translationKey ? time : translated;
                      })
                      .join(', ')
                  : t('types.zapOut.details.noActivityTimes')}
              </p>
            </div>
          </div>
          
          {/* Activity Types */}
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('types.zapOut.details.activityTypes')}</p>
              <p className="text-base">
                {zapOutData.activity_types && zapOutData.activity_types.length > 0
                  ? zapOutData.activity_types
                      .map((type: string) => {
                        const translationKey = `types.zapOut.details.${type}`;
                        const translated = t(translationKey);
                        return translated === translationKey ? type : translated;
                      })
                      .join(', ')
                  : t('types.zapOut.details.noActivityTypes')}
              </p>
            </div>
          </div>
          
          
          {/* Requested Activities */}
          {zapOutData.requested_activities && zapOutData.requested_activities.length > 0 && (
            <div className="flex items-start gap-3">
              <List className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('types.zapOut.details.requestedActivities')}</p>
                <p className="text-base">{formatRequestedActivities(zapOutData.requested_activities)}</p>
              </div>
            </div>
          )}
          
          {/* Group Composition */}
          {zapOutData.group_composition && (
            <div className="flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('types.zapOut.details.groupComposition')}</p>
                <p className="text-base">{zapOutData.group_composition}</p>
              </div>
            </div>
          )}
          
          {/* Accessibility Needs */}
          {zapOutData.accessibility_needs && (
            <div className="flex items-start gap-3">
              <Accessibility className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('types.zapOut.details.accessibilityNeeds')}</p>
                <p className="text-base">{zapOutData.accessibility_needs}</p>
              </div>
            </div>
          )}
          
          {/* Budget Per Person */}
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('types.zapOut.details.budget')}</p>
              <p className="text-base">
                {zapOutData.min_budget && zapOutData.max_budget
                  ? `${zapOutData.min_budget} ${zapOutData.currency || 'USD'} - ${zapOutData.max_budget} ${zapOutData.currency || 'USD'}`
                  : t('types.zapOut.details.noBudgetSpecified')}
              </p>
            </div>
          </div>
          
          {/* Special Requirements */}
          {zapOutData.special_requirements && (
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('types.zapOut.details.specialRequirements')}</p>
                <p className="text-base">{zapOutData.special_requirements}</p>
              </div>
            </div>
          )}
          

        </div>
      </CardContent>
    </Card>
  );
}
