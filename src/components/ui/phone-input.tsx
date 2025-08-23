import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Label } from "./label";

export interface Country {
  code: string;
  name: string;
  dial_code: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: "US", name: "United States", dial_code: "+1", flag: "🇺🇸" },
  { code: "FR", name: "France", dial_code: "+33", flag: "🇫🇷" },
  { code: "ES", name: "Spain", dial_code: "+34", flag: "🇪🇸" },
  { code: "GB", name: "United Kingdom", dial_code: "+44", flag: "🇬🇧" },
  { code: "CA", name: "Canada", dial_code: "+1", flag: "🇨🇦" },
  { code: "DE", name: "Germany", dial_code: "+49", flag: "🇩🇪" },
  { code: "IT", name: "Italy", dial_code: "+39", flag: "🇮🇹" },
  { code: "JP", name: "Japan", dial_code: "+81", flag: "🇯🇵" },
  { code: "AU", name: "Australia", dial_code: "+61", flag: "🇦🇺" },
  // Add more as needed
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  label?: string;
  disabled?: boolean;
}

export function PhoneInput({ value, onChange, countryCode, onCountryCodeChange, label, disabled }: PhoneInputProps) {
  return (
    <div className="space-y-1">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <Select value={countryCode} onValueChange={onCountryCodeChange} disabled={disabled}>
          <SelectTrigger className="w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.dial_code}>
                <span className="mr-2">{country.flag}</span>
                {country.dial_code} <span className="ml-1 text-xs text-muted-foreground">{country.code}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="tel"
          value={value}
          onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="Phone number"
          disabled={disabled}
          className="flex-1"
        />
      </div>
    </div>
  );
} 