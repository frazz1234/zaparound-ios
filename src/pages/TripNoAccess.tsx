import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';


const TripNoAccess: React.FC = () => {
  const { t, i18n } = useTranslation('trip');
  const navigate = useNavigate();
  const language = i18n.language;
  const locale = language === 'fr' ? 'fr_FR' : 'en_US';
  


  const handleLogin = () => {
    navigate('/auth');
  };

  return (
    <div>
      <div className="fixed inset-0 z-50 backdrop-blur-md bg-[#fcfcfc]/80 flex items-center justify-center">
        <div className="bg-[#fcfcfc] rounded-xl p-8 max-w-md mx-4 text-center shadow-2xl border border-[#e6e6e6]">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <Lock className="h-16 w-16 text-[#61936f]" />
              <Sparkles className="h-6 w-6 text-[#61936f] absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-[#1d1d1e]">
            {t('share.noAccessTitle')}
          </h2>
          <p className="text-[#62626a] mb-6">
            {t('share.noAccessDescription')}
          </p>
          <Button 
            onClick={handleLogin}
            className="w-full bg-[#61936f] hover:bg-[#1d1d1e] text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            {t('share.cta')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TripNoAccess; 