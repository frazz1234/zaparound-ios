import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageVariants } from '../subtrip-utils/animations';
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { VehicleType } from '../subtrip-types';
import { Car, Bike, Truck, Zap } from 'lucide-react';

interface RoadTripVehicleProps {
  vehicleType: VehicleType;
  isElectricCar: boolean;
  onVehicleTypeChange: (type: VehicleType) => void;
  onElectricCarChange: (isElectric: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
}

const RoadTripVehicle = forwardRef<HTMLDivElement, RoadTripVehicleProps>(({
  vehicleType,
  isElectricCar,
  onVehicleTypeChange,
  onElectricCarChange,
  onBack,
  onContinue
}, ref) => {
  const { t } = useTranslation('home');
  
  const vehicleOptions = [
    { id: 'car' as const, label: t('roadTrip.vehicle.car'), icon: Car },
    { id: 'bike' as const, label: t('roadTrip.vehicle.motorcycle'), icon: Bike },
    { id: 'bicycle' as const, label: t('roadTrip.vehicle.bicycle'), icon: Bike},
    { id: 'rv' as const, label: t('roadTrip.vehicle.rv'), icon: Truck },
  ];

  return (
    <motion.div
      ref={ref}
      key="road-trip-vehicle-step"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="w-full"
    >
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6">
        {t('roadTrip.vehicle.title')}
      </h1>
      
      <p className="text-lg text-white mb-8">
        {t('roadTrip.vehicle.description')}
      </p>

      <div className="max-w-4xl mx-auto">
        <Card className="bg-white shadow-lg w-full p-6">
          <div className="flex flex-col space-y-8">
            {/* Vehicle Type Selection */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#1d1d1e]">{t('roadTrip.vehicle.selectType')}</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {vehicleOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = vehicleType === option.id;
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => onVehicleTypeChange(option.id)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-200",
                        "flex flex-col items-center justify-center gap-3 min-h-[160px]",
                        "hover:border-[#61936f] group",
                        isSelected
                          ? "bg-[#61936f]/10 border-[#61936f]"
                          : "bg-white border-gray-200"
                      )}
                    >
                      <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center",
                        "transition-all duration-200",
                        isSelected
                          ? "bg-[#61936f] text-white"
                          : "bg-gray-100 text-gray-600 group-hover:bg-[#61936f]/10 group-hover:text-[#61936f]"
                      )}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <span className={cn(
                        "text-lg font-medium text-center",
                        isSelected
                          ? "text-[#61936f]"
                          : "text-gray-700 group-hover:text-[#61936f]"
                      )}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Electric Car Option - Only show when car is selected */}
            {vehicleType === 'car' && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="electric-car" 
                    checked={isElectricCar}
                    onCheckedChange={onElectricCarChange}
                  />
                  <Label htmlFor="electric-car" className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#61936f]" />
                    {t('roadTrip.vehicle.electricCar')}
                  </Label>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="mt-8 flex flex-col md:flex-row gap-4 justify-center">
          <Button
            variant="ghost"
            className="text-[#61936f] hover:text-[#4a7256]"
            onClick={onBack}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('Back')}
          </Button>

          {vehicleType && (
            <Button
              className="bg-[#61936f] hover:bg-[#4a7256] text-white"
              onClick={onContinue}
            >
              {t('Continue')}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

RoadTripVehicle.displayName = 'RoadTripVehicle';

export default RoadTripVehicle; 