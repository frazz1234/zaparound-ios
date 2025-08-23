import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from 'react-i18next';
import { Car, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ZapRoadDetailsPageProps } from "@/types/trip";
import { NumberInput } from "@/components/ui/number-input";

export function ZapRoadDetailsPage({
  numberOfPeople,
  hasElectricCar,
  specialRequirements,
  isLoading,
  onNumberOfPeopleChange,
  onHasElectricCarChange,
  onSpecialRequirementsChange,
  onBack,
  onSubmit
}: ZapRoadDetailsPageProps) {
  const { t } = useTranslation('trip');

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">{t('types.zapRoad.detailsTitle')}</h2>
        <p className="text-gray-600">{t('types.zapRoad.detailsSubtitle')}</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="numberOfPeople" className="flex items-center">
            {t('types.zapRoad.numberOfPeople')}
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <NumberInput
            id="numberOfPeople"
            min={1}
            value={numberOfPeople}
            onChange={onNumberOfPeopleChange}
            className="mt-1"
            aria-label={t('types.zapRoad.numberOfPeople')}
          />
        </div>
        
        <div className="flex items-start space-x-2 pt-2">
          <Checkbox 
            id="hasElectricCar" 
            checked={hasElectricCar} 
            onCheckedChange={onHasElectricCarChange}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="hasElectricCar"
              className="flex items-center cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              <Car className="w-4 h-4 mr-2" />
              {t('types.zapRoad.hasElectricCar')}
            </Label>
          </div>
        </div>

        <div className="pt-4">
          <Label htmlFor="specialRequirements">
            {t('types.zapRoad.specialRequirements')}
          </Label>
          <Textarea
            id="specialRequirements"
            value={specialRequirements}
            onChange={(e) => onSpecialRequirementsChange(e.target.value)}
            placeholder={t('types.zapRoad.specialRequirementsPlaceholder')}
            className="mt-1 min-h-[100px]"
          />
        </div>
      </div>
      
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          {t('form.back')}
        </Button>
        <Button 
          type="submit" 
          onClick={(e) => onSubmit(e)}
          disabled={isLoading || numberOfPeople < 1}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('form.create')}
        </Button>
      </div>
    </div>
  );
}
