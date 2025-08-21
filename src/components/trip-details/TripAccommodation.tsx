import { Building } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AccommodationDetails {
  type?: string;
  details?: string;
}

interface TripAccommodationProps {
  details: AccommodationDetails;
  isEditing: boolean;
  onChange: (details: AccommodationDetails) => void;
}

const ACCOMMODATION_TYPES = ['hotel', 'airbnb', 'hostel', 'camping', 'resort', 'bnb'];

export function TripAccommodation({ details, isEditing, onChange }: TripAccommodationProps) {
  const { t } = useTranslation('trip');

  // Helper to translate known types
  const getTranslatedType = (type?: string) => {
    if (!type) return t('details.accommodationType', 'No type specified');
    const key = type.toLowerCase();
    if (ACCOMMODATION_TYPES.includes(key)) {
      return t(`accommodation.${key}`);
    }
    return type;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center text-gray-500">
        <Building className="mr-2 h-5 w-5" />
        <span>{t('details.accommodationType', 'Accommodation')}</span>
      </div>
      {isEditing ? (
        <div className="space-y-2">
          <Select
            value={details.type || ''}
            onValueChange={value => onChange({ ...details, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('details.accommodationType', 'Accommodation type')} />
            </SelectTrigger>
            <SelectContent>
              {ACCOMMODATION_TYPES.map(type => (
                <SelectItem key={type} value={type}>
                  {t(`accommodation.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder={t('details.accommodationDetails', 'Additional accommodation details')}
            value={details.details || ''}
            onChange={(e) => onChange({
              ...details,
              details: e.target.value
            })}
          />
        </div>
      ) : (
        <div className="text-gray-600">
          <p className="font-medium">{getTranslatedType(details.type)}</p>
          <p className="text-sm">{details.details}</p>
        </div>
      )}
    </div>
  );
}
