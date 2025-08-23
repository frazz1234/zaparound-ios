import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { motion } from 'framer-motion';

interface LoadingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'trip' | 'date' | 'groupActivity' | 'roadTrip';
}

const LoadingDialog: React.FC<LoadingDialogProps> = ({ 
  isOpen, 
  onOpenChange,
  type
}) => {
  const { t } = useTranslation('home');
  
  const getTitle = () => {
    switch (type) {
      case 'trip':
        return t('creating.trip');
      case 'date':
        return t('creating.date');
      case 'groupActivity':
        return t('creating.groupActivity');
      case 'roadTrip':
        return t('creating.roadTrip');
      default:
        return t('creating.trip');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md !p-12 !rounded-3xl bg-white/80 backdrop-blur-sm border-none shadow-2xl">
        <DialogTitle className="sr-only">{getTitle()}</DialogTitle>
        <div className="flex flex-col items-center justify-center gap-6">
          <motion.div
            className="w-24 h-24 rounded-full border-4 border-[#61936f] border-t-transparent"
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 1,
              ease: "linear",
              repeat: Infinity
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-[#1d1d1e] mb-2">{getTitle()}</h2>
            <p className="text-gray-600">{t('creating.description')}</p>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoadingDialog; 