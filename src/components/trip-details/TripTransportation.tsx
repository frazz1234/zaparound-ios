import { Car } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TransportationDetails {
  mode?: string;
  details?: string;
}

interface TripTransportationProps {
  details: TransportationDetails;
  isEditing: boolean;
  onChange: (details: TransportationDetails) => void;
}

const TRANSPORT_MODES = ['plane', 'train', 'bus', 'car'];

export function TripTransportation({ details, isEditing, onChange }: TripTransportationProps) {
  const { t } = useTranslation('trip');

  // Helper to translate known modes
  const getTranslatedMode = (mode?: string) => {
    if (!mode) return t('details.transportationMode', 'No mode specified');
    const key = mode.toLowerCase();
    if (TRANSPORT_MODES.includes(key)) {
      return t(`transport.${key}`);
    }
    return mode;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center text-gray-500">
        <Car className="mr-2 h-5 w-5" />
        <span>{t('details.transportationMode', 'Transportation')}</span>
      </div>
      {isEditing ? (
        <div className="space-y-2">
          <Select
            value={details.mode || ''}
            onValueChange={value => onChange({ ...details, mode: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('details.transportationMode', 'Mode of transport')} />
            </SelectTrigger>
            <SelectContent>
              {TRANSPORT_MODES.map(mode => (
                <SelectItem key={mode} value={mode}>
                  {t(`transport.${mode}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder={t('details.transportationDetails', 'Additional transportation details')}
            value={details.details || ''}
            onChange={(e) => onChange({
              ...details,
              details: e.target.value
            })}
          />
        </div>
      ) : (
        <div className="text-gray-600">
          <p className="font-medium">{getTranslatedMode(details.mode)}</p>
          <p className="text-sm">{details.details}</p>
        </div>
      )}
    </div>
  );
}
