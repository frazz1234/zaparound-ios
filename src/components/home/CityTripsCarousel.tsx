import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';

// Define the city trip type
export interface CityTrip {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
  totalTrips?: number;
  popularity?: number;
}

interface CityTripsCarouselProps {
  title?: string;
  subtitle?: string;
  cities: CityTrip[];
  onCityClick?: (city: CityTrip) => void;
  className?: string;
}

const CityTripsCarousel: React.FC<CityTripsCarouselProps> = ({
  title,
  subtitle,
  cities,
  onCityClick,
  className = '',
}) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const itemsPerPage = window.innerWidth >= 1024 ? 4 : window.innerWidth >= 768 ? 3 : 1;
  const totalPages = Math.ceil(cities.length / itemsPerPage);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalPages);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalPages) % totalPages);
  };

  const getCityImageUrl = (city: CityTrip): string => {
    // If the city has a custom imageUrl, use it
    if (city.imageUrl) return city.imageUrl;
    
    // Otherwise, use the default image
    return '/zaparound-uploads/defaultimage.png';
  };

  return (
    <section className={`py-10 ${className}`} ref={ref}>
      {(title || subtitle) && (
        <div className="container mb-8">
          {title && <h2 className="text-3xl font-bold mb-2">{title}</h2>}
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      <div className="container relative">
        <div className="overflow-hidden">
          <motion.div
            className="flex"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: inView ? 1 : 0,
              x: `-${currentIndex * 100}%` 
            }}
            transition={{ duration: 0.5 }}
          >
            {cities.map((city) => (
              <div 
                key={city.id} 
                className="min-w-[100%] sm:min-w-[50%] md:min-w-[33.333%] lg:min-w-[25%] p-2"
              >
                <Card 
                  className="overflow-hidden h-full cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => onCityClick && onCityClick(city)}
                >
                  <Link to={`/search?city=${encodeURIComponent(city.name)}`} className="block h-full">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={getCityImageUrl(city)}
                        alt={t('home.cityImage', { city: city.name })}
                        className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                        width="800"
                        height="600"
                        onError={(e) => {
                          // If the image fails to load, fall back to default image
                          const target = e.target as HTMLImageElement;
                          target.onerror = null; // Prevent infinite loop
                          target.src = '/zaparound-uploads/defaultimage.png';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-4 text-white">
                        <h3 className="text-xl font-bold">{city.name}</h3>
                        {city.totalTrips !== undefined && (
                          <p className="text-sm opacity-90">
                            {t('home.totalTrips', { count: city.totalTrips })}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </Card>
              </div>
            ))}
          </motion.div>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-end mt-4 gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={prevSlide}
              aria-label={t('common.previous')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={nextSlide}
              aria-label={t('common.next')}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CityTripsCarousel;