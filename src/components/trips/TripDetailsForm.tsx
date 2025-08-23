import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from 'react-i18next';

interface TripDetailsFormProps {
  category: string;
  budget: string;
  transportationMode: string;
  transportationDetails: string;
  accommodationType: string;
  accommodationDetails: string;
  onCategoryChange: (value: string) => void;
  onBudgetChange: (value: string) => void;
  onTransportationModeChange: (value: string) => void;
  onTransportationDetailsChange: (value: string) => void;
  onAccommodationTypeChange: (value: string) => void;
  onAccommodationDetailsChange: (value: string) => void;
}

export function TripDetailsForm({
  category,
  budget,
  transportationMode,
  transportationDetails,
  accommodationType,
  accommodationDetails,
  onCategoryChange,
  onBudgetChange,
  onTransportationModeChange,
  onTransportationDetailsChange,
  onAccommodationTypeChange,
  onAccommodationDetailsChange,
}: TripDetailsFormProps) {
  const { t } = useTranslation('trip');
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="category" className="text-sm font-medium">
          {t('details.category')} <span className="text-red-500">*</span>
        </label>
        <Select value={category} onValueChange={onCategoryChange} required>
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
      </div>

      <div className="space-y-2">
        <label htmlFor="budget" className="text-sm font-medium">
          {t('details.budget')} <span className="text-red-500">*</span>
        </label>
        <Input
          id="budget"
          type="number"
          value={budget}
          onChange={(e) => onBudgetChange(e.target.value)}
          placeholder={t('details.enterBudget')}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="transportationMode" className="text-sm font-medium">
          {t('details.transportationMode')} <span className="text-red-500">*</span>
        </label>
        <Input
          id="transportationMode"
          value={transportationMode}
          onChange={(e) => onTransportationModeChange(e.target.value)}
          placeholder={t('details.transportationPlaceholder')}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="transportationDetails" className="text-sm font-medium">
          {t('details.transportationDetails')}
        </label>
        <Textarea
          id="transportationDetails"
          value={transportationDetails}
          onChange={(e) => onTransportationDetailsChange(e.target.value)}
          placeholder={t('details.transportationDetails')}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="accommodationType" className="text-sm font-medium">
          {t('details.accommodationType')} <span className="text-red-500">*</span>
        </label>
        <Input
          id="accommodationType"
          value={accommodationType}
          onChange={(e) => onAccommodationTypeChange(e.target.value)}
          placeholder={t('details.accommodationPlaceholder')}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="accommodationDetails" className="text-sm font-medium">
          {t('details.accommodationDetails')}
        </label>
        <Textarea
          id="accommodationDetails"
          value={accommodationDetails}
          onChange={(e) => onAccommodationDetailsChange(e.target.value)}
          placeholder={t('details.accommodationDetails')}
        />
      </div>
    </div>
  );
}
