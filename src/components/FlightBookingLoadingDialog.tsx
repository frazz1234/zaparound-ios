import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Plane, Mountain, Sun, Cloud, Waves, MapPin, Compass } from 'lucide-react';

// VisuallyHidden utility for accessibility
const VisuallyHidden: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
    {children}
  </span>
);

interface FlightBookingLoadingDialogProps {
  isOpen: boolean;
  message?: string;
}

const FlightBookingLoadingDialog: React.FC<FlightBookingLoadingDialogProps> = ({ isOpen, message }) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg !p-10 !rounded-3xl bg-white/90 backdrop-blur-md border-none shadow-2xl flex flex-col items-center gap-6">
        {/* Accessible title and description for screen readers */}
        <VisuallyHidden>
          <DialogTitle>Searching for Flights</DialogTitle>
          <DialogDescription>
            {message || 'We are finding the best flights and routes for you. Please wait a moment.'}
          </DialogDescription>
        </VisuallyHidden>
        <div className="w-full flex flex-col items-center">
          {/* Adventure Sky Animation */}
          <div className="relative w-full h-40 md:h-48 overflow-hidden rounded-xl mb-4">
            {/* Sky background */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-200 via-blue-100 to-[#fcfcfc]" />
            {/* Sun */}
            <motion.div 
              className="absolute top-4 right-10"
              initial={{ opacity: 0.7, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1.1 }}
              transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
            >
              <Sun className="h-8 w-8 text-yellow-400" />
              <motion.div 
                className="absolute inset-0 rounded-full bg-yellow-200 opacity-30"
                initial={{ scale: 1 }}
                animate={{ scale: 1.5 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
              />
            </motion.div>
            {/* Clouds */}
            <motion.div 
              className="absolute top-8 left-10"
              initial={{ x: -30 }}
              animate={{ x: 120 }}
              transition={{ duration: 18, repeat: Infinity, repeatType: 'loop' }}
            >
              <Cloud className="h-6 w-6 text-white" />
            </motion.div>
            <motion.div 
              className="absolute top-12 left-32"
              initial={{ x: -20 }}
              animate={{ x: 80 }}
              transition={{ duration: 14, repeat: Infinity, repeatType: 'loop', delay: 2 }}
            >
              <Cloud className="h-4 w-4 text-white" />
            </motion.div>
            {/* Ocean waves */}
            <motion.div 
              className="absolute bottom-0 w-full h-6 flex items-end"
              initial={{ y: 0 }}
              animate={{ y: -2 }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
            >
              <Waves className="w-full h-full text-blue-300" />
            </motion.div>
            {/* Mountains */}
            <div className="absolute bottom-4 w-full flex justify-between">
              <Mountain className="h-8 w-8 text-[#61936f]" />
              <Mountain className="h-10 w-10 text-[#1d1d1e]" />
              <Mountain className="h-6 w-6 text-[#62626a]" />
            </div>
            {/* Map pin */}
            <motion.div 
              className="absolute bottom-8 right-16"
              initial={{ y: -2 }}
              animate={{ y: 0 }}
              transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
            >
              <MapPin className="h-6 w-6 text-red-500" />
            </motion.div>
            {/* Compass */}
            <motion.div 
              className="absolute top-4 left-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            >
              <Compass className="h-5 w-5 text-gray-700" />
            </motion.div>
            {/* Animated plane */}
            <motion.div 
              className="absolute"
              initial={{ x: -40, y: 60 }}
              animate={{ x: 220, y: 30 }}
              transition={{ duration: 3.5, repeat: Infinity, repeatType: 'loop' }}
            >
              <div className="relative">
                <Plane className="h-10 w-10 text-[#61936f] drop-shadow-lg transform rotate-12" />
                <motion.div 
                  className="absolute top-1/2 right-full w-16 h-1 bg-gradient-to-r from-transparent to-white opacity-50"
                  initial={{ width: 0 }}
                  animate={{ width: 64 }}
                  transition={{ duration: 0.3, repeat: Infinity, repeatType: 'loop' }}
                />
              </div>
            </motion.div>
          </div>
          <div className="text-center mt-2">
            <h2 className="text-2xl font-bold text-[#1d1d1e] mb-2">Searching for your next adventure...</h2>
            <p className="text-[#62626a]">{message || 'We are finding the best flights and routes for you. Please wait a moment.'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FlightBookingLoadingDialog; 