import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LocationSearch } from "@/components/trips/LocationSearch";
import { useTranslation } from 'react-i18next';
import { PlusCircle, X, Loader2 } from "lucide-react";

interface ZapRoadCitySelectionPageProps {
  startingCity: string;
  stopoverCities: { name: string; coordinates: [number, number] }[];
  endCity: string;
  startingCityCoordinates: [number, number];
  endCityCoordinates: [number, number];
  isLoading: boolean;
  onStartingCityChange: (city: string, coordinates: [number, number]) => void;
  onAddStopoverCity: (city: string, coordinates: [number, number]) => void;
  onRemoveStopoverCity: (index: number) => void;
  onEndCityChange: (city: string, coordinates: [number, number]) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ZapRoadCitySelectionPage({
  startingCity,
  stopoverCities,
  endCity,
  startingCityCoordinates,
  endCityCoordinates,
  isLoading,
  onStartingCityChange,
  onAddStopoverCity,
  onRemoveStopoverCity,
  onEndCityChange,
  onBack,
  onSubmit
}: ZapRoadCitySelectionPageProps) {
  const { t } = useTranslation('trip');
  const [newStopoverCity, setNewStopoverCity] = React.useState("");
  const [newStopoverCoordinates, setNewStopoverCoordinates] = React.useState<[number, number]>([0, 0]);

  const handleAddStopover = () => {
    if (newStopoverCity) {
      onAddStopoverCity(newStopoverCity, newStopoverCoordinates);
      setNewStopoverCity("");
      setNewStopoverCoordinates([0, 0]);
    }
  };

  const handleNewStopoverChange = (city: string, coordinates: [number, number]) => {
    setNewStopoverCity(city);
    setNewStopoverCoordinates(coordinates);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">{t('types.zapRoad.citySelectionTitle')}</h2>
        <p className="text-gray-600">{t('types.zapRoad.citySelectionSubtitle')}</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="startingCity" className="flex items-center">
            {t('types.zapRoad.startingCity')}
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <LocationSearch
            value={startingCity}
            onChange={onStartingCityChange}
          />
        </div>
        
        <div className="space-y-3">
          <Label>{t('types.zapRoad.stopoverCities')}</Label>
          
          {stopoverCities.length > 0 && (
            <div className="space-y-2">
              {stopoverCities.map((city, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex-1 p-2 border rounded-md bg-gray-50">
                    {city.name}
                  </div>
                  <Button 
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveStopoverCity(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <LocationSearch
                value={newStopoverCity}
                onChange={handleNewStopoverChange}
              />
            </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleAddStopover}
              disabled={!newStopoverCity}
              className="flex-shrink-0"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              {t('types.zapRoad.addStopover')}
            </Button>
          </div>
        </div>
        
        <div>
          <Label htmlFor="endCity" className="flex items-center">
            {t('types.zapRoad.endCity')}
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <LocationSearch
            value={endCity}
            onChange={onEndCityChange}
          />
        </div>
      </div>
      
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          {t('form.back')}
        </Button>
        <Button 
          type="button"  
          onClick={(e) => onSubmit(e)}
          disabled={isLoading || !startingCity || !endCity}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('form.creating')}
            </>
          ) : (
            t('form.next')
          )}
        </Button>
      </div>
    </div>
  );
}
