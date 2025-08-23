import { AnimationText } from '../subtrip-types';
import { useTranslation } from 'react-i18next';

export const pageVariants = {
  initial: {
    x: 20,
    opacity: 0
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.15,
      ease: "easeOut"
    }
  },
  exit: {
    x: -20,
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: "easeIn"
    }
  }
};

export const checkmarkVariants = {
  initial: { scale: 0 },
  animate: {
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
};

export const useAnimationText = (): ((type: 'ZAPTRIP' | 'ZAPOUT' | 'ZAPROAD') => AnimationText) => {
  const { t } = useTranslation('home');
  
  return (zapAnimationType: 'ZAPTRIP' | 'ZAPOUT' | 'ZAPROAD') => {
    switch (zapAnimationType) {
      case 'ZAPTRIP':
        return {
          prefix: t('letsgofora'),
          main: "ZAPTRIP"
        };
      case 'ZAPOUT':
        return {
          prefix: t('letsgofora'),
          main: "ZAPOUT"
        };
      case 'ZAPROAD':
        return {
          prefix: t('letsgofora'),
          main: "ZAPROAD"
        };
    }
  };
}; 