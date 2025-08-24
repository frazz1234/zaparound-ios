import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, useAnimation } from 'framer-motion';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Search, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeaturedDestinationDTO } from '@/services/featuredDestinationsService';
import { CachedImage } from '@/components/OptimizedImage';

interface FeaturedDestinationsPuzzleProps {
  featured: FeaturedDestinationDTO[] | null;
  loading: boolean;
  language: string;
  onExplore: (destinationCity: string) => void;
  cityImagePath: (row: FeaturedDestinationDTO) => string;
}

export const FeaturedDestinationsPuzzle: React.FC<FeaturedDestinationsPuzzleProps> = ({
  featured,
  loading,
  language,
  onExplore,
  cityImagePath
}) => {
  const { t } = useTranslation(['home', 'common']);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const isInView = useInView(ref, { 
    once: false, 
    amount: 0.2,
    margin: "-50px"
  });

  // Carousel state
  const [destinationsApi, setDestinationsApi] = useState<CarouselApi>();
  const [destinationsCurrent, setDestinationsCurrent] = useState(0);
  const [destinationsCount, setDestinationsCount] = useState(0);

  // Trigger animations when section comes into view
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    } else {
      controls.start("hidden");
    }
  }, [controls, isInView]);

  // Featured Destinations carousel effects
  useEffect(() => {
    if (!destinationsApi) return;

    setDestinationsCount(destinationsApi.scrollSnapList().length);
    setDestinationsCurrent(destinationsApi.selectedScrollSnap() + 1);

    destinationsApi.on("select", () => {
      setDestinationsCurrent(destinationsApi.selectedScrollSnap() + 1);
    });
  }, [destinationsApi]);

  useEffect(() => {
    if (!destinationsApi) return;

    const interval = setInterval(() => {
      destinationsApi.scrollNext();
    }, 4000); // Auto-rotate every 4 seconds

    return () => clearInterval(interval);
  }, [destinationsApi]);

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6
      }
    }
  };

  if (loading) {
    return (
      <motion.section 
        ref={ref}
        className="py-20 bg-[#fcfcfc]"
        variants={containerVariants}
        initial="hidden"
        animate={controls}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.div 
              className="h-12 bg-gradient-to-r from-[#61936f]/20 to-[#1d1d1e]/20 rounded-lg mb-4 mx-auto w-96"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div 
              className="h-6 bg-gradient-to-r from-[#62626a]/20 to-[#1d1d1e]/20 rounded-lg mx-auto w-64"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="h-80 bg-gradient-to-br from-white to-gray-50 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section 
      ref={ref}
      className="py-20 bg-[#fcfcfc] relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate={controls}
    >
      {/* Animated background travel paths */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Plane path sweeping diagonally across the section (bigger) */}
        <motion.div
          aria-hidden
          className="absolute"
          initial={{ left: '-10%', top: '10%', rotate: 30, opacity: 0.4 }}
          animate={{ left: ['-10%', '110%'], top: ['10%', '60%'], rotate: [30, 30], opacity: [0.35, 0.35] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <Plane className="text-[#61936f] drop-shadow" size={80} />
        </motion.div>

        {/* Second plane: flies right to left on a different diagonal */}
        <motion.div
          aria-hidden
          className="absolute"
          initial={{ left: '110%', top: '70%', rotate: -30, opacity: 0.35 }}
          animate={{ left: ['110%', '-10%'], top: ['70%', '20%'], rotate: [-30, -30], opacity: [0.35, 0.35] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear', delay: 2 }}
        >
          <Plane className="text-[#61936f] drop-shadow" size={80} />
        </motion.div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="text-center mb-16"
          variants={itemVariants}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#1d1d1e] mb-4">
            {t('home.featuredDestinations', 'Featured Destinations')}
          </h2>
          <p className="text-xl text-[#62626a] max-w-2xl mx-auto">
            {t('home.featuredDestinationsDesc', 'Explore our handpicked destinations that travelers love')}
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Carousel 
            className="w-full max-w-6xl mx-auto relative"
            setApi={setDestinationsApi}
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent>
              {(featured || []).map((row, index) => (
                <CarouselItem key={row.id} className="md:basis-1/2 lg:basis-1/3">
                  <motion.div
                    variants={itemVariants}
                    custom={index}
                    className="h-full"
                  >
                      <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-white h-full">
                        <div className="relative">
                          <CachedImage 
                            src={cityImagePath(row)} 
                            alt={row.translation_name}
                            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                            fallback={row.fallback_image_url || '/zaparound-uploads/background1.webp'}
                            enableCache={true}
                          />
                          {row.translation_badge && (
                            <Badge className="absolute top-4 left-4 bg-[#61936f] text-white">
                              {row.translation_badge}
                            </Badge>
                          )}
                          <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-white text-sm font-medium">{row.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <CardContent className="p-6">
                          <h3 className="text-xl font-semibold text-[#1d1d1e] mb-2">{row.translation_name}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-[#61936f]">
                              {row.translation_price_label || `From $${Math.max(0, Math.round(row.price_min_cents/100))}`}
                            </span>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-[#61936f] text-[#61936f] hover:bg-[#61936f] hover:text-white" 
                              onClick={() => onExplore(row.translation_name)}
                            >
                              {t('home.featuredDestinations.explore', 'Explore')}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="bg-white border-[#61936f] text-[#61936f] hover:bg-[#61936f] hover:text-white" />
            <CarouselNext className="bg-white border-[#61936f] text-[#61936f] hover:bg-[#61936f] hover:text-white" />
          </Carousel>
        </motion.div>
        
        {/* Shadow indicators for Featured Destinations */}
        <motion.div 
          className="flex justify-center mt-6 space-x-2"
          variants={itemVariants}
        >
          {Array.from({ length: Math.min(destinationsCount, 8) }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-300",
                destinationsCurrent === index + 1 
                  ? "bg-[#61936f] w-6" 
                  : "bg-gray-300 hover:bg-gray-400"
              )}
            />
          ))}
        </motion.div>
        
        {/* Flight Search Button */}
        <motion.div 
          className="text-center mt-12"
          variants={itemVariants}
        >
          <Button 
            onClick={() => navigate(`/${language}/booking/travel-flights`)}
            className="relative px-6 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-none hover:from-[#059669] hover:to-[#047857] hover:scale-105 transition-all duration-300 shadow-lg rounded-full font-medium tracking-wide"
          >
            <span className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              {t('featuredDestinations.searchFlights', 'Ready to Fly? Let\'s Go! ✈️')}
            </span>
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
};
