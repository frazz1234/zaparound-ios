import { motion } from 'framer-motion';
import { Plane, Mountain, Sun, Cloud, Waves, MapPin, Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const TravelAnimation = () => {
  const { t } = useTranslation('common');
  
  return (
    <div className="relative h-12 w-full overflow-hidden rounded-md">
      {/* Sky background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-100"></div>
      
      {/* Sun with rays */}
      <motion.div 
        className="absolute top-2 right-6"
        initial={{ opacity: 0.7, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1.1 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
      >
        <div className="relative">
          <Sun className="h-5 w-5 text-yellow-400" />
          <motion.div 
            className="absolute inset-0 rounded-full bg-yellow-200 opacity-30"
            initial={{ scale: 1 }}
            animate={{ scale: 1.5 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          />
        </div>
      </motion.div>
      
      {/* Multiple clouds at different positions and speeds */}
      <motion.div 
        className="absolute top-2 left-10"
        initial={{ x: -30 }}
        animate={{ x: 100 }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "loop" }}
      >
        <Cloud className="h-3 w-3 text-white" />
      </motion.div>
      
      <motion.div 
        className="absolute top-3 left-24"
        initial={{ x: -20 }}
        animate={{ x: 80 }}
        transition={{ duration: 15, repeat: Infinity, repeatType: "loop", delay: 2 }}
      >
        <Cloud className="h-2 w-2 text-white" />
      </motion.div>
      
      <motion.div 
        className="absolute top-1 left-5"
        initial={{ x: -10 }}
        animate={{ x: 60 }}
        transition={{ duration: 18, repeat: Infinity, repeatType: "loop", delay: 1 }}
      >
        <Cloud className="h-2 w-2 text-white" />
      </motion.div>
      
      {/* Ocean waves */}
      <motion.div 
        className="absolute bottom-0 w-full h-3 flex items-end"
        initial={{ y: 0 }}
        animate={{ y: -1 }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
      >
        <Waves className="w-full h-full text-blue-500" />
      </motion.div>
      
      {/* Mountains in the background with different heights */}
      <div className="absolute bottom-2 w-full flex justify-between">
        <Mountain className="h-4 w-4 text-emerald-700" />
        <Mountain className="h-6 w-6 text-emerald-800" />
        <Mountain className="h-3 w-3 text-emerald-600" />
        <Mountain className="h-5 w-5 text-emerald-700" />
        <Mountain className="h-4 w-4 text-emerald-800" />
      </div>
      
      {/* Map pin for destination */}
      <motion.div 
        className="absolute bottom-3 right-8"
        initial={{ y: -2 }}
        animate={{ y: 0 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
      >
        <MapPin className="h-4 w-4 text-red-500" />
      </motion.div>
      
      {/* Compass for navigation */}
      <motion.div 
        className="absolute top-2 left-2"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <Compass className="h-3 w-3 text-gray-700" />
      </motion.div>
      
      {/* Animated plane with trail effect */}
      <motion.div 
        className="absolute"
        initial={{ x: -30, y: 15 }}
        animate={{ x: 150, y: 10 }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "loop" }}
      >
        <div className="relative">
          <Plane className="h-5 w-5 text-gray-700 transform rotate-12" />
          <motion.div 
            className="absolute top-1/2 right-full w-10 h-0.5 bg-gradient-to-r from-transparent to-white opacity-50"
            initial={{ width: 0 }}
            animate={{ width: 10 }}
            transition={{ duration: 0.3, repeat: Infinity, repeatType: "loop" }}
          />
        </div>
      </motion.div>
    </div>
  );
}; 