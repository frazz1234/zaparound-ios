import React from 'react';
import { motion } from 'framer-motion';
import { useAnimationText } from '../subtrip-utils/animations';

interface ZapAnimationProps {
  show: boolean;
  type: 'ZAPTRIP' | 'ZAPOUT' | 'ZAPROAD';
}

const ZapAnimation: React.FC<ZapAnimationProps> = ({ show, type }) => {
  const getAnimationText = useAnimationText();
  
  if (!show) return null;
  
  const animationText = getAnimationText(type);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#61936f]/90 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.3,
          type: "spring",
          stiffness: 200
        }}
        className="text-center"
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="text-2xl md:text-3xl font-light text-white mb-2"
        >
          {animationText.prefix}
        </motion.p>
        <motion.h1 
          className="text-7xl md:text-9xl font-black text-white"
          initial={{ letterSpacing: "0px" }}
          animate={{ letterSpacing: "10px" }}
          transition={{ duration: 0.5 }}
        >
          {animationText.main}
        </motion.h1>
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1, delay: 0.3 }}
          className="h-1 bg-white mx-auto mt-4 rounded-full"
        />
      </motion.div>
    </motion.div>
  );
};

export default ZapAnimation; 