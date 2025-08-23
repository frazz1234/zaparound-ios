import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Lock, UserPlus, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PostBlurOverlayProps {
  onConnectClick: () => void;
  onSignupClick: () => void;
  className?: string;
}

export function PostBlurOverlay({ onConnectClick, onSignupClick, className }: PostBlurOverlayProps) {
  const { t } = useTranslation('community');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "absolute inset-0 bg-white/80 backdrop-blur-md rounded-xl z-10",
        "flex flex-col items-center justify-center p-2 sm:p-6",
        "border border-gray-200/50",
        className
      )}
    >
      {/* Blur effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/40 rounded-xl" />
      
      {/* Content */}
      <div className="relative z-20 text-center space-y-2 sm:space-y-4">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mx-auto w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br from-[#61936f] to-[#4a7c59] rounded-full flex items-center justify-center shadow-lg"
        >
          <Lock className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
        </motion.div>

        {/* Title */}
        <motion.h3
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-xl font-bold text-gray-800"
        >
          {t('postBlur.title', 'Connect to Create Posts')}
        </motion.h3>

        {/* Description */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs sm:text-base text-gray-600 max-w-[200px] sm:max-w-sm mx-auto px-1 sm:px-2"
        >
          {t('postBlur.description', 'Join our community to share your travel stories, connect with fellow travelers, and create amazing posts.')}
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-1.5 sm:gap-3 w-full max-w-[180px] sm:max-w-xs mx-auto"
        >
          <Button
            onClick={onConnectClick}
            size="sm"
            className="flex-1 bg-gradient-to-r from-[#61936f] to-[#4a7c59] hover:from-[#4a7c59] hover:to-[#3d6b4a] text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-base py-1.5 sm:py-2"
          >
            <LogIn className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            {t('postBlur.connect', 'Connect')}
          </Button>
          
          <Button
            onClick={onSignupClick}
            variant="outline"
            size="sm"
            className="flex-1 border-[#61936f] text-[#61936f] hover:bg-[#61936f] hover:text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-base py-1.5 sm:py-2"
          >
            <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            {t('postBlur.signup', 'Sign Up')}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
