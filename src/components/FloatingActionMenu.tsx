import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Users, MapPin, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { FullCreateTripDialog } from './FullCreateTripDialog';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface FloatingActionMenuProps {
  session: any;
  className?: string;
}

export function FloatingActionMenu({ session, className }: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const { t, i18n } = useTranslation('navigation');
  const { t: tTrip } = useTranslation('trip');
  const navigate = useNavigate();

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Trigger haptic feedback
  const triggerHaptics = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      // Haptics not available (web/desktop)
      console.log('Haptics not available');
    }
  };

  const handleToggle = async () => {
    await triggerHaptics();
    setIsOpen(!isOpen);
  };

  const handleClose = async () => {
    await triggerHaptics();
    setIsOpen(false);
  };

  const handleZapAction = async () => {
    await triggerHaptics();
    setIsOpen(false);
    setShowCreateTrip(true);
  };

  const handleCommunityAction = async () => {
    await triggerHaptics();
    setIsOpen(false);
    // Navigate to community page with post creation focus
    navigate(`/${i18n.language}/community`, { 
      state: { focusPostCreator: true }
    });
  };

  const overlayVariants = {
    hidden: { 
      opacity: 0,
      backdropFilter: 'blur(0px)'
    },
    visible: { 
      opacity: 1,
      backdropFilter: 'blur(8px)',
      transition: {
                duration: 0.3
      }
    },
    exit: {
      opacity: 0,
      backdropFilter: 'blur(0px)',
      transition: {
                duration: 0.2
      }
    }
  };

  const menuVariants = {
    hidden: {
      scale: 0,
      opacity: 0,
      originX: 0.5,
      originY: 1
    },
    visible: {
      scale: 1,
      opacity: 1,
      originX: 0.5,
      originY: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    },
    exit: {
      scale: 0,
      opacity: 0,
      originX: 0.5,
      originY: 1,
      transition: {
                duration: 0.2
      }
    }
  };

  const buttonVariants = {
    hidden: {
      scale: 0,
      opacity: 0,
      x: 0,
      y: 20
    },
    visible: {
      scale: 1,
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
                duration: 0.4
      }
    },
    hover: {
      scale: 1.1,
      transition: {
                duration: 0.2
      }
    },
    tap: {
      scale: 0.95,
      transition: {
                duration: 0.1
      }
    }
  };

  const leftButtonVariants = {
    ...buttonVariants,
    hidden: {
      ...buttonVariants.hidden,
      x: -50
    }
  };

  const rightButtonVariants = {
    ...buttonVariants,
    hidden: {
      ...buttonVariants.hidden,
      x: 50
    }
  };

  const mainButtonVariants = {
    closed: {
      rotate: 0,
      scale: 1,
      transition: {
                duration: 0.3
      }
    },
    open: {
      rotate: 45,
      scale: 1.1,
      transition: {
                duration: 0.3
      }
    }
  };

  return (
    <>
      {/* Main FAB Button */}
      <motion.button
        className={cn(
          "relative flex items-center justify-center w-14 h-14 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-full shadow-2xl border-4 border-white -mt-7 z-[60]",
          "active:scale-95 touch-action-manipulation",
          className
        )}
        onClick={handleToggle}
        variants={mainButtonVariants}
        animate={isOpen ? 'open' : 'closed'}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? t('close') : t('createNew')}
      >
        <motion.div
          animate={isOpen ? { rotate: 45 } : { rotate: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <PlusCircle className="w-7 h-7 text-white" />
        </motion.div>
      </motion.button>

      {/* Overlay and Action Menu - Rendered in document body */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Background Overlay - Covers entire screen */}
              <motion.div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999]"
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100vw',
                  height: '100vh',
                  margin: 0,
                  padding: 0,
                }}
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={handleClose}
              />

              {/* Floating Action Menu */}
              <motion.div
                className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[10000] flex flex-row items-end justify-center gap-8 pointer-events-none pb-32"
                style={{ transformOrigin: 'center bottom' }}
                variants={menuVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="flex flex-row items-center justify-center gap-2 pointer-events-auto" style={{ transform: 'translateX(-115px)' }}>
              {/* Community Post Button */}
              <motion.div
                className="flex flex-col items-center"
                variants={leftButtonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <motion.button
                  className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-xl border-4 border-white hover:from-blue-600 hover:to-blue-700"
                  onClick={handleCommunityAction}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={t('createPost')}
                >
                  <Users className="w-8 h-8" />
                </motion.button>
                <motion.span 
                  className="text-white text-sm font-medium mt-2 px-3 py-1 bg-black/40 rounded-full backdrop-blur-sm whitespace-nowrap"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {t('createPost')}
                </motion.span>
              </motion.div>

              {/* Create Zap Button */}
              <motion.div
                className="flex flex-col items-center"
                variants={rightButtonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <motion.button
                  className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-full shadow-xl border-4 border-white hover:from-[#059669] hover:to-[#047857]"
                  onClick={handleZapAction}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={tTrip('form.createZap')}
                >
                  <MapPin className="w-8 h-8" />
                </motion.button>
                <motion.span 
                  className="text-white text-sm font-medium mt-2 px-3 py-1 bg-black/40 rounded-full backdrop-blur-sm whitespace-nowrap"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {tTrip('form.createZap')}
                </motion.span>
              </motion.div>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )}

      {/* Create Trip Dialog */}
      <FullCreateTripDialog 
        session={session}
        buttonVariant="hidden"
        onClose={() => setShowCreateTrip(false)}
        isOpen={showCreateTrip}
      />
    </>
  );
}
