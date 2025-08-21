import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { MapPin, Navigation, Compass, Globe, Calendar, Users, Star, Zap, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';

const Features: React.FC = () => {
  const { t } = useTranslation('home');
  const ref = useRef(null);
  const controls = useAnimation();
  const isInView = useInView(ref, { 
    once: false, 
    amount: 0.2,
    margin: "-50px"
  });
  
  const isMobile = useIsMobile();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || isMobile) {
      setReduceMotion(true);
    }
  }, [isMobile]);
  
  // Trigger animations when section comes into view
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    } else {
      controls.start("hidden");
    }
  }, [controls, isInView]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reduceMotion ? 0 : (isMobile ? 0.1 : 0.15),
        delayChildren: reduceMotion ? 0 : 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0.1 : 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };
  
  // Enhanced card animation
  const cardVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0.1 : 0.6,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };
  
  // Stats counter animation
  const counterVariants = {
    hidden: { opacity: 0, scale: reduceMotion ? 1 : 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: reduceMotion ? 0.1 : 0.5,
        ease: [0, 0.71, 0.2, 1.01]
      }
    }
  };

  const features = [
    {
      icon: <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />,
      title: t('features.smartLocation.title'),
      description: t('features.smartLocation.description'),
      gradient: "from-blue-500/20 to-blue-600/20"
    },
    {
      icon: <Navigation className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />,
      title: t('features.interactiveMaps.title'),
      description: t('features.interactiveMaps.description'),
      gradient: "from-purple-500/20 to-purple-600/20"
    },
    {
      icon: <Compass className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />,
      title: t('features.realTimeUpdates.title'),
      description: t('features.realTimeUpdates.description'),
      gradient: "from-green-500/20 to-green-600/20"
    },
    {
      icon: <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-500" />,
      title: t('features.globalCoverage.title'),
      description: t('features.globalCoverage.description'),
      gradient: "from-cyan-500/20 to-cyan-600/20"
    },
    {
      icon: <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-pink-500" />,
      title: t('features.smartPlanning.title'),
      description: t('features.smartPlanning.description'),
      gradient: "from-pink-500/20 to-pink-600/20"
    },
    {
      icon: <Users className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />,
      title: t('features.collaboration.title'),
      description: t('features.collaboration.description'),
      gradient: "from-amber-500/20 to-amber-600/20"
    }
  ];

  return (
    <div className="min-h-[500px] md:min-h-[600px]">
      <section ref={ref} className="py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden">
        {/* Optimized background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white opacity-60" />
      
        {/* Enhanced animated background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-br from-blue-500/5 to-purple-500/5 blur-2xl md:blur-3xl will-change-transform"
            animate={reduceMotion ? false : {
              scale: [1, 1.1, 1],
              rotate: isMobile ? 0 : [0, 45],
              opacity: [0.3, 0.4, 0.3],
              x: [0, 20, 0],
              y: [0, -20, 0]
            }}
            transition={reduceMotion ? undefined : {
              duration: isMobile ? 8 : 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div 
            className="absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-tr from-green-500/5 to-blue-500/5 blur-2xl md:blur-3xl will-change-transform"
            animate={reduceMotion ? false : {
              scale: [1.1, 1, 1.1],
              rotate: isMobile ? 0 : [0, -45],
              opacity: [0.4, 0.5, 0.4],
              x: [0, -20, 0],
              y: [0, 20, 0]
            }}
            transition={reduceMotion ? undefined : {
              duration: isMobile ? 6 : 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div 
            className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full bg-gradient-to-tr from-amber-500/5 to-pink-500/5 blur-2xl md:blur-3xl will-change-transform"
            animate={reduceMotion ? false : {
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
              x: [0, 30, 0],
              y: [0, 30, 0]
            }}
            transition={reduceMotion ? undefined : {
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-16"
            variants={containerVariants}
            initial="hidden"
            animate={controls}
          >
            <motion.div 
              variants={itemVariants} 
              className="inline-flex items-center justify-center px-3 sm:px-4 py-1 sm:py-1.5 mb-3 sm:mb-4 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 text-sm font-medium"
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              {t('features.tagline')}
            </motion.div>
            <motion.h2 
              variants={itemVariants}
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 md:mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent"
            >
              {t('features.title')}
            </motion.h2>
            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto"
            >
              {t('features.subtitle')}
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
            variants={containerVariants}
            initial="hidden"
            animate={controls}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                custom={index}
                variants={cardVariants}
                whileHover={{ 
                  scale: isMobile ? 1 : 1.03,
                  y: isMobile ? 0 : -5,
                  transition: { duration: 0.2 }
                }}
                className="group relative will-change-transform"
              >
                {/* Card background with optimized gradient */}
                <div className={`absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                {/* Card content with improved mobile layout */}
                <div className="relative p-4 sm:p-6 md:p-8 bg-white rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                  <div className="flex flex-col items-start">
                    {/* Icon with enhanced animation */}
                    <motion.div 
                      className="relative"
                      whileHover={{ 
                        rotate: [0, -10, 10, -5, 0],
                        transition: { duration: 0.5 }
                      }}
                    >
                      <div className="absolute inset-0 bg-current opacity-10 rounded-xl blur-sm transform group-hover:scale-110 transition-transform duration-300" />
                      <div className="relative p-2 sm:p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white ring-1 ring-gray-100">
                        {feature.icon}
                      </div>
                    </motion.div>
                    
                    {/* Title and description with responsive typography */}
                    <h3 className="text-lg sm:text-xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3 text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                    
                    {/* Enhanced hover indicator */}
                    <motion.div 
                      className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      whileHover={{
                        scale: 1.1,
                        transition: { duration: 0.2, ease: "easeOut" }
                      }}
                    >
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Enhanced stats section */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={controls}
            className="mt-12 sm:mt-16 md:mt-20"
          >
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 text-center"
            >
              <motion.div 
                variants={counterVariants}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 hover:from-blue-500/10 hover:to-purple-500/10 transition-colors duration-300"
              >
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="font-bold text-2xl sm:text-3xl md:text-4xl text-gray-900 mb-1 sm:mb-2"
                >
                  100+
                </motion.div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600">{t('features.countriesCovered')}</div>
              </motion.div>
              <motion.div 
                variants={counterVariants}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-green-500/5 to-blue-500/5 hover:from-green-500/10 hover:to-blue-500/10 transition-colors duration-300"
              >
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="font-bold text-2xl sm:text-3xl md:text-4xl text-gray-900 mb-1 sm:mb-2"
                >
                  9M+
                </motion.div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600">{t('features.milliontrips')}</div>
              </motion.div>
              <motion.div 
                variants={counterVariants}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 hover:from-purple-500/10 hover:to-pink-500/10 transition-colors duration-300"
              >
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="font-bold text-2xl sm:text-3xl md:text-4xl text-gray-900 mb-1 sm:mb-2"
                >
                  100H+
                </motion.div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600">{t('features.hoursSaved')}</div>
              </motion.div>
              <motion.div 
                variants={counterVariants}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 hover:from-amber-500/10 hover:to-orange-500/10 transition-colors duration-300"
              >
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="font-bold text-2xl sm:text-3xl md:text-4xl text-gray-900 mb-1 sm:mb-2"
                >
                  4.9
                </motion.div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600">{t('features.userRating')}</div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Features;
