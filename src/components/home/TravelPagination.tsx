import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plane, 
  MapPin, 
  Calendar, 
  Star, 
  TrendingUp, 
  Shield, 
  Clock, 
  Users,
  Search,
  Heart,
  Car,
  CableCar,
  PlaneTakeoff,
  Globe,
  Award,
  Zap,
  Compass,
  Navigation
} from 'lucide-react';

interface TravelPaginationProps {
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const TravelPagination: React.FC<TravelPaginationProps> = ({ 
  currentPage = 1, 
  totalPages = 3, 
  onPageChange 
}) => {
  const { t, i18n } = useTranslation('home');

  // Travel destinations data for SEO and content
  const travelDestinations = [
    {
      id: 1,
      name: 'Paris, France',
      category: 'Europe',
      rating: 4.8,
      testimonialKey: 'paris'
    },
    {
      id: 2,
      name: 'Tokyo, Japan',
      category: 'Asia',
      rating: 4.9,
      testimonialKey: 'tokyo', 
    },
    {
      id: 3,
      name: 'New York, USA',
      category: 'North America',
      rating: 4.7,
      testimonialKey: 'newyork',
    },
    {
      id: 4,
      name: 'Sydney, Australia',
      category: 'Oceania',
      rating: 4.6,
      testimonialKey: 'sydney',
    },
    {
      id: 5,
      name: 'Cape Town, South Africa',
      category: 'Africa',
      rating: 4.5,
      testimonialKey: 'capetown',
    },
    {
      id: 6,
      name: 'Barcelona, Spain',
      category: 'Europe',
      rating: 4.8,
      testimonialKey: 'barcelona',
    },
    {
      id: 7,
      name: 'Bangkok, Thailand',
      category: 'Asia',
      rating: 4.7,
      testimonialKey: 'bangkok',
    },
    {
      id: 8,
      name: 'Rio de Janeiro, Brazil',
      category: 'South America',
      rating: 4.6,
      testimonialKey: 'rio',
    },
    {
      id: 9,
      name: 'Vancouver, Canada',
      category: 'North America',
      rating: 4.8,
      testimonialKey: 'vancouver',
    }
  ];

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  // Function to scroll to the top of the page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Generate pagination items - simplified for exactly 3 pages
  const generatePaginationItems = () => {
    const items = [];
    
    // Always show exactly 3 pages: 1, 2, 3
    for (let i = 1; i <= 3; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            href="#" 
            isActive={i === currentPage}
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(i);
            }}
            className={i === currentPage ? 'bg-white text-[#61936f] hover:bg-white/90' : 'hover:bg-white/10'}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <section className="py-20 bg-gradient-to-r from-[#1d1d1e] to-[#2a2a2b] text-white" aria-labelledby="travel-pagination-heading">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-6xl mx-auto">
          {/* SEO-optimized heading and description */}
          <div className="mb-12">
            <Badge variant="secondary" className="mb-4 bg-[#61936f]/20 text-[#61936f] border-[#61936f]/30">
              <Compass className="w-4 h-4 mr-2" />
              {t('home:cta.badge', 'Explore Destinations')}
            </Badge>
            
            <h2 id="travel-pagination-heading" className="text-4xl md:text-5xl font-bold mb-6">
              {t('home:cta.title', 'Ready to Start Your Journey?')}
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              {t('home:cta.description', 'Join millions of travelers who trust ZapAround for their adventures. Discover amazing destinations and plan your next trip with our AI-powered recommendations.')}
            </p>
          </div>

          {/* Travel destination cards for SEO content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {travelDestinations.slice((currentPage - 1) * 3, currentPage * 3).map((destination) => (
              <Card key={destination.id} className="border-0 bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-[#61936f] border-[#61936f]">
                      {destination.category}
                    </Badge>
                    <div className="flex items-center text-yellow-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="ml-1 text-sm">{destination.rating}</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl text-white">
                    {destination.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                                  <CardDescription className="text-gray-300 leading-relaxed">
                  {t(`home.testimonials.${destination.testimonialKey}`, 'Testimonial not found')}
                </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination component */}
          <div className="mb-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) {
                        handlePageChange(currentPage - 1);
                      }
                    }}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                
                {generatePaginationItems()}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) {
                        handlePageChange(currentPage + 1);
                      }
                    }}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-[#61936f] hover:bg-[#4a7c59] text-white px-8 py-4 text-lg transition-all duration-300"
              onClick={scrollToTop}
            >
              {t('home:cta.primaryButton', 'Start Planning Now')}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-[#4a7c59] hover:bg-white hover:text-[#1d1d1e] px-8 py-4 text-lg transition-all duration-300"
              onClick={() => {
                // Navigate to about or features page
                const lang = i18n.language || 'en';
                window.location.href = `/${lang}/about`;
              }}
            >
              {t('home:cta.secondaryButton', 'Learn More')}
            </Button>
          </div>

          {/* SEO-optimized footer content */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-300">
              <div className="text-center">
                <Navigation className="w-6 h-6 mx-auto mb-2 text-[#61936f]" />
                <h3 className="font-semibold text-white mb-2">{t('home.features.smartPlanning.title', 'Smart Planning')}</h3>
                <p>{t('home.features.smartPlanning.description', 'AI-powered recommendations for personalized travel experiences')}</p>
              </div>
              <div className="text-center">
                <Globe className="w-6 h-6 mx-auto mb-2 text-[#61936f]" />
                <h3 className="font-semibold text-white mb-2">{t('home.features.globalDestinations.title', 'Global Destinations')}</h3>
                <p>{t('home.features.globalDestinations.description', 'Explore thousands of destinations worldwide with local insights')}</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-[#61936f]" />
                <h3 className="font-semibold text-white mb-2">{t('home.features.secureBooking.title', 'Secure Booking')}</h3>
                <p>{t('home.features.secureBooking.description', 'Safe and secure booking with 24/7 customer support')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TravelPagination; 