import React from 'react';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTranslation } from 'react-i18next';
import { cn } from "@/lib/utils";

interface LgbtqSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function LgbtqSelect({ value, onChange, disabled }: LgbtqSelectProps) {
  const { t } = useTranslation('profile');
  const currentValue = value[0] || 'indifferent';

  return (
    <div className="space-y-2">
      <Label>{t('personal.lgbtqStatus')}</Label>
      <RadioGroup
        value={currentValue}
        onValueChange={(newValue) => onChange([newValue])}
        className="flex flex-col space-y-2"
        disabled={disabled}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="indifferent" id="indifferent" disabled={disabled} />
          <Label htmlFor="indifferent" className={cn("cursor-pointer", disabled && "opacity-50 cursor-not-allowed")}>
            {t('lgbtq.indifferent')}
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="yes" id="yes" disabled={disabled} />
          <Label htmlFor="yes" className={cn("cursor-pointer", disabled && "opacity-50 cursor-not-allowed")}>
            {t('lgbtq.yes')}
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="no" id="no" disabled={disabled} />
          <Label htmlFor="no" className={cn("cursor-pointer", disabled && "opacity-50 cursor-not-allowed")}>
            {t('lgbtq.no')}
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
