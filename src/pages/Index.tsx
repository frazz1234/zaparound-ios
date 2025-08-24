import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/components/SEO';
import { cn } from '@/lib/utils';
import { HomeCreateTripDialog } from '@/components/HomeCreateTripDialog';
import { LatestBlogsGrid } from '@/components/LatestBlogsGrid';
import { CommunitySneakPeek } from '@/components/home/CommunitySneakPeek';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import TravelPagination from '@/components/home/TravelPagination';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
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
  Zap
} from 'lucide-react';
import { airports, Airport, getAirportsByCity } from '@/utils/airportData';
import { fetchFeaturedDestinations, FeaturedDestinationDTO } from '@/services/featuredDestinationsService';
import { motion, useInView, useAnimation, animate } from 'framer-motion';
import { FeaturedDestinationsPuzzle } from '@/components/home/FeaturedDestinationsPuzzle';
import { useHomepageImagePreloader } from '@/hooks/useImagePreloader';

interface FeaturedDestination {
  id: number;
  name: string;
  image: string;
  fallbackImage: string;
  rating: number;
  reviews: number;
  price: string;
  badge: string;
}

interface IndexProps {
  session: any;
}

const Index: React.FC<IndexProps> = ({ session }) => {
  const { i18n, t } = useTranslation(['home', 'common']);
  const language = i18n.language || 'en';
  const navigate = useNavigate();
  
  // Featured Destinations carousel state
  const [destinationsApi, setDestinationsApi] = useState<CarouselApi>();
  const [destinationsCurrent, setDestinationsCurrent] = useState(0);
  const [destinationsCount, setDestinationsCount] = useState(0);
  
  // Travel Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Featured Destinations data state
  const [featured, setFeatured] = useState<FeaturedDestinationDTO[] | null>(null);
  const [loadingFeatured, setLoadingFeatured] = useState<boolean>(true);

  // Ref for scrolling to activity selection
  const activitySelectionRef = useRef<HTMLDivElement>(null);

  // State to track if we're in the activity-time step for darker background
  const [isActivityTimeStep, setIsActivityTimeStep] = useState(false);
  
  // Preload homepage images for better UX
  const { isPreloading: isPreloadingImages, progress: imagePreloadProgress } = useHomepageImagePreloader();

  // Function to scroll to activity selection
  const scrollToActivitySelection = () => {
    if (activitySelectionRef.current) {
      activitySelectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  };

  // Listen for step changes to update background
  useEffect(() => {
    const handleStepChange = (event: CustomEvent) => {
      const step = event.detail?.step;
      setIsActivityTimeStep(step === 'activity-time');
    };

    window.addEventListener('trip-step-changed', handleStepChange as EventListener);
    
    return () => {
      window.removeEventListener('trip-step-changed', handleStepChange as EventListener);
    };
  }, []);

  // Helper: Haversine distance
  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const findNearestAirportIATA = (lat: number, lon: number): string => {
    let best: { iata: string; km: number } | null = null;
    for (const ap of airports) {
      const km = haversineKm(lat, lon, ap.latitude, ap.longitude);
      if (!best || km < best.km) best = { iata: ap.iata_code, km };
    }
    return best?.iata || 'JFK';
  };

  const getDestinationIATA = (cityName: string): string => {
    const matches = getAirportsByCity(cityName);
    if (matches && matches.length > 0) return matches[0].iata_code;
    // Fallback: try simple known aliases
    const simple = airports.find(a => a.city.toLowerCase() === cityName.toLowerCase());
    return simple?.iata_code || cityName.toUpperCase();
  };

  const navigateToTravelFlight = (params: Record<string, string>, useCompact = true) => {
    const base = `/${language}/travel-flight`;
    if (useCompact && params.origin && params.destination && params.departureDate) {
      // Build compact format: ORG(3)+DDMM+DST(3)+[DDMM]+PAX(1)
      const org = params.origin.slice(0, 3).toUpperCase();
      const dst = params.destination.slice(0, 3).toUpperCase();
      const ddmm = params.departureDate.replace(/-/g, '').slice(6, 8) + params.departureDate.replace(/-/g, '').slice(4, 6);
      const pax = String(Math.min(9, Math.max(1, parseInt(params.adults || '1', 10))));
      let compact = `${org}${ddmm}${dst}${pax}`;
      if (params.returnDate) {
        const r = params.returnDate.replace(/-/g, '');
        const rddmm = r.slice(6, 8) + r.slice(4, 6);
        compact = `${org}${ddmm}${dst}${rddmm}${pax}`;
      }
      window.location.href = `${base}?flightSearch=${compact}`;
      return;
    }
    const search = new URLSearchParams(params).toString();
    window.location.href = `${base}?${search}`;
  };

  const handleExplore = (destinationCity: string) => {
    const destIata = getDestinationIATA(destinationCity);

    // Default params
    const baseParams: Record<string, string> = {
      destination: destIata,
      tripType: 'roundtrip',
      adults: '1',
      children: '0',
      infantsInSeat: '0',
      infantsOnLap: '0',
      cabinClass: 'economy'
    };

    // Add a near-future departure date (e.g., +30 days)
    const dt = new Date();
    dt.setDate(dt.getDate() + 30);
    baseParams.departureDate = dt.toISOString().split('T')[0];

    // Try geolocation for nearest origin
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const originIata = findNearestAirportIATA(pos.coords.latitude, pos.coords.longitude);
          navigateToTravelFlight({ ...baseParams, origin: originIata });
        },
        () => {
          // Fallback origin when denied/failed
          navigateToTravelFlight({ ...baseParams, origin: 'JFK' });
        },
        { enableHighAccuracy: false, timeout: 4000, maximumAge: 600000 }
      );
    } else {
      navigateToTravelFlight({ ...baseParams, origin: 'JFK' });
    }
  };

  // Toggle parallax on mobile for smoothness
  const [parallaxEnabled, setParallaxEnabled] = useState<boolean>(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const saveData = (navigator as any).connection?.saveData === true;
    const lowEndDevice = saveData || mediaQuery.matches;
    setParallaxEnabled(!lowEndDevice);

    const onChange = () => setParallaxEnabled(!(saveData || mediaQuery.matches));
    mediaQuery.addEventListener?.('change', onChange);
    window.addEventListener('orientationchange', onChange, { passive: true } as any);
    return () => {
      mediaQuery.removeEventListener?.('change', onChange);
      window.removeEventListener('orientationchange', onChange as EventListener);
    };
  }, []);

  // Parallax effect (GPU-friendly, passive + rAF)
  useEffect(() => {
    if (!parallaxEnabled) {
      document.documentElement.style.setProperty('--parallax-offset', '0px');
      return;
    }

    let ticking = false;
    const update = () => {
      const scrolled = window.pageYOffset || document.documentElement.scrollTop || 0;
      const parallaxOffset = scrolled * 0.35; // tuned for smoothness
      document.documentElement.style.setProperty('--parallax-offset', `${parallaxOffset}px`);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    // Initial position
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll as EventListener);
  }, [parallaxEnabled]);

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

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingFeatured(true);
        const rows = await fetchFeaturedDestinations(language);
        if (!active) return;
        setFeatured(rows);
      } catch (e) {
        console.error('Failed to load featured destinations', e);
        if (!active) return;
        setFeatured(null);
      } finally {
        if (active) setLoadingFeatured(false);
      }
    })();
    return () => { active = false; };
  }, [language]);

  const cityImagePath = (row: FeaturedDestinationDTO): string => {
    if (row.image_url) return row.image_url;
    // fallback to default image
    return '/zaparound-uploads/defaultimage.png';
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": []
  };

  // Travel categories
  const travelCategories = [
    { icon: PlaneTakeoff, label: t('home.travelCategoryLabels.flights', 'Flights'), count: '2M+ routes', color: 'bg-blue-500' },
    { icon: MapPin, label: t('home.travelCategoryLabels.hotels', 'Hotels'), count: '500K+ properties', color: 'bg-green-500' },
    { icon: CableCar, label: t('home.travelCategoryLabels.activities', 'Activities'), count: '50K+ experiences', color: 'bg-purple-500' },
    { icon: Calendar, label: t('home.travelCategoryLabels.localEvents', 'Local Events'), count: '2K+ events', color: 'bg-orange-500' },
    { icon: Heart, label: t('home.travelCategoryLabels.romanticGetaways', 'Romantic Getaways'), count: '10K+ packages', color: 'bg-pink-500' }
  ];

  // Stats data with better SEO content
  const stats = [
    {
      label: t('home.stats.activeTravelers', 'Active Travelers'),
      value: 1000,
      suffix: '+',
      icon: Users,
      description: t('home.stats.activeTravelersDesc', 'Travelers planning adventures worldwide')
    },
    {
      label: t('home.stats.globalDestinations', 'Global Destinations'),
      value: 195,
      suffix: '+',
      icon: Globe,
      description: t('home.stats.globalDestinationsDesc', 'Curated destinations across continents')
    },
    {
      label: t('home.stats.countriesCovered', 'Countries Covered'),
      value: 50,
      suffix: '+',
      icon: MapPin,
      description: t('home.stats.countriesCoveredDesc', 'International travel planning support')
    },
    {
      label: t('home.stats.industryAwards'),
      value: 1000,
      suffix: '+',
      icon: Award,
      description: t('home.stats.industryAwardsDesc')
    }
  ];

  const AnimatedCounter: React.FC<{ to: number; suffix?: string; className?: string }> = ({ to, suffix = '', className }) => {
    const ref = useRef<HTMLSpanElement | null>(null);
    const isInView = useInView(ref, { once: true, margin: '-20% 0px -20% 0px' });
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      if (!isInView) return;
      const controls = animate(0, to, {
        duration: 1.8,
        ease: 'easeOut',
        onUpdate: (v) => setDisplayValue(v)
      });
      return () => controls.stop();
    }, [isInView, to]);

    const formatted = new Intl.NumberFormat(language, {
      notation: 'compact',
      maximumFractionDigits: 0
    }).format(Math.round(displayValue));

    return (
      <span ref={ref} className={className} aria-live="polite">
        {formatted}
        {suffix}
      </span>
    );
  };

  // Add Travelpayouts script with results URL configuration
  useEffect(() => {
    const existing = document.querySelector(
      'script[src="https://tpwgts.com/wl_web/main.js?wl_id=396"]'
    );
    if (!existing) {
      const script = document.createElement("script");
      script.async = true;
      script.type = "module";
      script.src = "https://tpwgts.com/wl_web/main.js?wl_id=396";
      script.setAttribute("data-noptimize", "1");
      script.setAttribute("data-cfasync", "false");
      script.setAttribute("data-wpfc-render", "false");
      document.head.appendChild(script);

      // Configure results URL to redirect to travel-flight page
      (window as any).TPWL_CONFIGURATION = {
        ...(window as any).TPWL_CONFIGURATION,
        resultsURL: `/${language}/travel-flight`,
      };
    }
  }, [language]);

  return (
    <>
      <Helmet>
        <script
          data-noptimize="1"
          data-cfasync="false"
          data-wpfc-render="false"
          type="text/javascript"
        >{`
          (function () {
            var script = document.createElement('script');
            script.async = 1;
            script.type = 'module';
            script.src = 'https://tpwgts.com/wl_web/main.js?wl_id=396';
            document.head.appendChild(script);

            window.TPWL_CONFIGURATION = {
              ...window.TPWL_CONFIGURATION,
              resultsURL: '/${language}/travel-flight',
            };
          })();
        `}</script>
      </Helmet>
      <SEO
        title={t('home:title', 'ZapAround – Your smart travel companion')}
        description={t(
          'home:description',
          'Plan unique getaways, find hidden gems and organise memorable experiences all in one place.'
        )}
        keywords="ZapAround, travel planner, AI trip planning, holiday inspiration, road trip planner"
        url={`/${language}/`}
        locale={language === 'fr' ? 'fr_FR' : language === 'es' ? 'es_ES' : 'en_US'}
        structuredData={faqStructuredData}
      />

      {/* ——————————————————————————————————————————————————————————— */}
      {/* HERO SECTION - FlightHub Style */}
      {/* ——————————————————————————————————————————————————————————— */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Parallax Background (no background-attachment: fixed on mobile) */}
        <img
          src="/zaparound-uploads/background45.jpg"
          alt="ZapAround inspirational background"
          loading="eager"
          fetchpriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transform-gpu will-change-transform"
          style={parallaxEnabled ? { transform: 'translate3d(0, var(--parallax-offset, 0px), 0)' } : undefined}
        />
        
        {/* Dark Overlay */}
        <div className={`absolute inset-0 transition-all duration-500 ${
          isActivityTimeStep ? 'bg-black/70' : 'bg-black/40'
        }`}></div>
        
        {/* Background Pattern */}
        <div className={`absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] transition-all duration-500 ${
          isActivityTimeStep ? 'opacity-10' : 'opacity-20'
        }`}></div>
        
        {/* Floating Elements with Parallax */}
        <div 
          className={`hidden md:block absolute top-20 left-10 w-20 h-20 bg-[#61936f]/20 rounded-full blur-md md:blur-xl animate-none md:animate-pulse transform-gpu will-change-transform transition-all duration-500 ${
            isActivityTimeStep ? 'opacity-30' : 'opacity-100'
          }`}
          style={parallaxEnabled ? { transform: 'translate3d(0, calc(var(--parallax-offset, 0px) * 0.3), 0)' } : undefined}
        ></div>
        <div 
          className={`hidden md:block absolute top-40 right-20 w-32 h-32 bg-[#61936f]/15 rounded-full blur-md md:blur-2xl animate-none md:animate-pulse delay-1000 transform-gpu will-change-transform transition-all duration-500 ${
            isActivityTimeStep ? 'opacity-20' : 'opacity-100'
          }`}
          style={parallaxEnabled ? { transform: 'translate3d(0, calc(var(--parallax-offset, 0px) * 0.5), 0)' } : undefined}
        ></div>
        <div 
          className={`hidden md:block absolute bottom-20 left-1/4 w-16 h-16 bg-[#61936f]/25 rounded-full blur-sm md:blur-lg animate-none md:animate-pulse delay-500 transform-gpu will-change-transform transition-all duration-500 ${
            isActivityTimeStep ? 'opacity-40' : 'opacity-100'
          }`}
          style={parallaxEnabled ? { transform: 'translate3d(0, calc(var(--parallax-offset, 0px) * 0.2), 0)' } : undefined}
        ></div>

        <div className="container mx-auto px-4 pt-12 pb-16 relative z-10">
          <div className="max-w-6xl mx-auto text-center">
            {/* Main Heading */}
            <div className="mb-8">
              <Badge variant="secondary" className="mb-4 bg-[#61936f]/20 text-[#61936f] border-[#61936f]/30">
                <Zap className="w-4 h-4 mr-2" />
                {t('hero.badge', 'AI-Powered Travel Planning')}
              </Badge>
              
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {t('hero.heading', 'Discover Your Next')}
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#61936f] to-[#4a7c59] bg-clip-text text-transparent">
                  {t('hero.heading2', 'Adventure')}
                </span>
              </h1>
              
              <p className="text-base md:text-lg text-gray-300 max-w-xl mx-auto mb-6 leading-relaxed">
                {t(
                  'hero.subheading',
                  'Plan, book, and experience unforgettable journeys with AI-powered recommendations and seamless booking.'
                )}
              </p>
            </div>

            {/* Activity Selection - Embedded - Much Higher */}
            <div className="mb-8">
              <div ref={activitySelectionRef}>
                <HomeCreateTripDialog session={session} />
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#61936f]" />
                              <span className="text-xs">{t('hero.trustIndicators.secureBooking', 'Secure Booking')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#61936f]" />
              <span className="text-xs">{t('hero.trustIndicators.insaneTravelPlanning', 'Insane Travel Planning')}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#61936f]" />
              <span className="text-xs">{t('hero.trustIndicators.bestPrices', 'Best Prices')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——————————————————————————————————————————————————————————— */}
      {/* FLIGHT SEARCH SECTION */}
      {/* ——————————————————————————————————————————————————————————— */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1d1d1e] mb-4 flex items-center justify-center gap-3">
              <Plane className="w-10 h-10 text-[#61936f]" />
              {t('home.flightSearch.title', 'Find the Perfect Flight')}
            </h2>
            <p className="text-xl text-[#62626a] max-w-2xl mx-auto">
              {t('home.flightSearch.description', 'Search and compare flights from hundreds of airlines worldwide')}
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            {/* Travelpayouts White-Label Widget with Shadow Square */}
            <div className="relative">
              {/* Shadow Square Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#61936f]/20 to-[#4a7c59]/20 rounded-3xl blur-2xl transform rotate-3 scale-105"></div>
              <div className="absolute inset-0 bg-gradient-to-tl from-[#10B981]/15 to-[#059669]/15 rounded-3xl blur-xl transform -rotate-2 scale-105"></div>
              
              {/* Main Widget Container */}
              <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 transform hover:scale-[1.02] transition-all duration-500 hover:shadow-3xl">
                {/* Inner Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#61936f]/5 to-[#10B981]/5 rounded-3xl"></div>
                
                {/* Widget Content */}
                <div className="relative z-10">
                  <div id="tpwl-search"></div>
                </div>
                
                {/* Decorative Corner Elements */}
                <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#61936f]/30 rounded-tl-2xl"></div>
                <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#61936f]/30 rounded-tr-2xl"></div>
                <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#61936f]/30 rounded-bl-2xl"></div>
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#61936f]/30 rounded-br-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——————————————————————————————————————————————————————————— */}
      {/* FEATURED DESTINATIONS CAROUSEL WITH PUZZLE EFFECT */}
      {/* ——————————————————————————————————————————————————————————— */}
      <FeaturedDestinationsPuzzle
        featured={featured}
        loading={loadingFeatured}
        language={language}
        onExplore={handleExplore}
        cityImagePath={cityImagePath}
      />

      {/* ——————————————————————————————————————————————————————————— */}
      {/* COMMUNITY SNEAK PEEK SECTION */}
      {/* ——————————————————————————————————————————————————————————— */}
      <CommunitySneakPeek />

      {/* ——————————————————————————————————————————————————————————— */}
      {/* LATEST ADVENTURES (Latest Trips) - TEMPORARILY HIDDEN */}
      {/* ——————————————————————————————————————————————————————————— */}
      {/* <LatestTripsCarousel /> */}
      
      {/* ——————————————————————————————————————————————————————————— */}
      {/* TRAVEL CATEGORIES */}
      {/* ——————————————————————————————————————————————————————————— */}
      <motion.section 
        className="py-20 bg-[#fcfcfc] relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        viewport={{ once: true, amount: 0.1 }}
      >
        {/* Animated background elements */}
        <motion.div 
          className="absolute inset-0 opacity-5"
          animate={{
            background: [
              "radial-gradient(circle at 20% 80%, #61936f 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, #1d1d1e 0%, transparent 50%)",
              "radial-gradient(circle at 20% 80%, #61936f 0%, transparent 50%)"
            ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#1d1d1e] mb-4">
              {t('home.travelCategories', 'Everything You Need')}
            </h2>
            <p className="text-xl text-[#62626a] max-w-2xl mx-auto">
              {t('home.travelCategoriesDesc', 'From flights to activities, we\'ve got your entire journey covered')}
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-6xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, staggerChildren: 0.15 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            {travelCategories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 60, scale: 0.8, rotateY: -15 }}
                whileInView={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.15,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ 
                  y: -12,
                  scale: 1.05,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                className="transform-gpu"
              >
                <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-white group cursor-pointer">
                  <CardContent className="p-6">
                    <motion.div 
                      className={`w-16 h-16 ${category.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                      whileHover={{ 
                        scale: 1.1,
                        transition: { duration: 0.2 }
                      }}
                      animate={{
                        y: [0, -3, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                        delay: index * 0.3
                      }}
                    >
                      <category.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-[#1d1d1e] mb-2">{category.label}</h3>
                    <p className="text-sm text-[#62626a]">{category.count}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Start Planning Button */}
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <Button 
              onClick={scrollToActivitySelection}
              className="relative px-6 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-none hover:from-[#059669] hover:to-[#047857] hover:scale-105 transition-all duration-300 shadow-lg rounded-full font-medium tracking-wide"
            >
              <span className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                {t('travelCategories.startPlanning', 'Start Planning Now')}
              </span>
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* ——————————————————————————————————————————————————————————— */}
      {/* WHY CHOOSE ZAPAROUND */}
      {/* ——————————————————————————————————————————————————————————— */}
      <motion.section 
        className="py-20 bg-[#fcfcfc] relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.6, 0.01, 0.05, 0.95] }}
        viewport={{ once: true, amount: 0.1 }}
      >
        {/* Animated geometric background elements */}
        <motion.div 
          className="absolute top-0 left-0 w-64 h-64 border-2 border-[#61936f]/10 rounded-full"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="absolute bottom-0 right-0 w-48 h-48 border-2 border-[#1d1d1e]/10 rounded-full"
          animate={{
            rotate: [360, 0],
            scale: [1, 0.8, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 1, 
              ease: [0.6, 0.01, 0.05, 0.95],
              delay: 0.2
            }}
            viewport={{ once: true }}
          >
            <motion.h2 
              className="text-4xl md:text-5xl font-bold text-[#1d1d1e] mb-4"
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              {t('home.whyChooseUs', 'Why Choose ZapAround?')}
            </motion.h2>
            <motion.p 
              className="text-xl text-[#62626a] max-w-2xl mx-auto"
              initial={{ opacity: 0, x: 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
            >
              {t('home.whyChooseUsDesc', 'Experience the future of travel planning with our innovative features')}
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, staggerChildren: 0.3 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            {/* AI-Powered Planning Card */}
            <motion.div
              initial={{ opacity: 0, x: -80, rotateY: 45 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ 
                duration: 1.2, 
                ease: [0.6, 0.01, 0.05, 0.95]
              }}
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ 
                rotateY: 5,
                scale: 1.02,
                transition: { duration: 0.4, ease: "easeOut" }
              }}
              className="transform-gpu perspective-1000"
            >
              <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                <motion.div 
                  className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#61936f] to-[#4a7c59]"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  viewport={{ once: true }}
                />
                <CardContent className="p-8">
                  <motion.div 
                    className="w-14 h-14 bg-[#61936f]/10 rounded-2xl flex items-center justify-center mb-6"
                    whileHover={{ 
                      rotate: 360,
                      scale: 1.1,
                      transition: { duration: 0.6, ease: "easeInOut" }
                    }}
                  >
                    <Zap className="w-7 h-7 text-[#61936f]" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-[#1d1d1e] mb-4">
                    {t('home.features.aiPlanning', 'AI-Powered Planning')}
                  </h3>
                  <p className="text-[#62626a] leading-relaxed">
                    {t('home.features.aiPlanningDesc', 'Our intelligent AI creates personalized itineraries based on your preferences, budget, and travel style.')}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Local Insights Card */}
            <motion.div
              initial={{ opacity: 0, y: 80, rotateX: 45 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ 
                duration: 1.2, 
                ease: [0.6, 0.01, 0.05, 0.95],
                delay: 0.3
              }}
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ 
                rotateX: 5,
                scale: 1.02,
                transition: { duration: 0.4, ease: "easeOut" }
              }}
              className="transform-gpu perspective-1000"
            >
              <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                <motion.div 
                  className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1d1d1e] to-[#62626a]"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  viewport={{ once: true }}
                />
                <CardContent className="p-8">
                  <motion.div 
                    className="w-14 h-14 bg-[#61936f]/10 rounded-2xl flex items-center justify-center mb-6"
                    whileHover={{ 
                      rotate: -360,
                      scale: 1.1,
                      transition: { duration: 0.6, ease: "easeInOut" }
                    }}
                  >
                    <MapPin className="w-7 h-7 text-[#61936f]" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-[#1d1d1e] mb-4">
                    {t('home.features.localInsights', 'Local Insights')}
                  </h3>
                  <p className="text-[#62626a] leading-relaxed">
                    {t('home.features.localInsightsDesc', 'Discover hidden gems and authentic experiences curated by locals and travel experts.')}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Seamless Booking Card */}
            <motion.div
              initial={{ opacity: 0, x: 80, rotateY: -45 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ 
                duration: 1.2, 
                ease: [0.6, 0.01, 0.05, 0.95],
                delay: 0.6
              }}
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ 
                rotateY: -5,
                scale: 1.02,
                transition: { duration: 0.4, ease: "easeOut" }
              }}
              className="transform-gpu perspective-1000"
            >
              <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                <motion.div 
                  className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#4a7c59] to-[#61936f]"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 1.1 }}
                  viewport={{ once: true }}
                />
                <CardContent className="p-8">
                  <motion.div 
                    className="w-14 h-14 bg-[#61936f]/10 rounded-2xl flex items-center justify-center mb-6"
                    whileHover={{ 
                      rotate: 180,
                      scale: 1.1,
                      transition: { duration: 0.6, ease: "easeInOut" }
                    }}
                  >
                    <Calendar className="w-7 h-7 text-[#61936f]" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-[#1d1d1e] mb-4">
                    {t('home.features.flexibleBooking', 'Seamless Booking')}
                  </h3>
                  <p className="text-[#62626a] leading-relaxed">
                    {t('home.features.flexibleBookingDesc', 'Book flights, hotels, activities, and more with flexible cancellation and 24/7 support.')}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
          
          {/* Let's Get Started Button */}
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ 
              duration: 1, 
              delay: 1.2,
              ease: [0.6, 0.01, 0.05, 0.95]
            }}
            viewport={{ once: true }}
            whileHover={{ 
              scale: 1.05,
              rotate: 2,
              transition: { duration: 0.3 }
            }}
          >
            <Button 
              onClick={scrollToActivitySelection}
              className="relative px-6 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-none hover:from-[#059669] hover:to-[#047857] hover:scale-105 transition-all duration-300 shadow-lg rounded-full font-medium tracking-wide"
            >
              <span className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                {t('whyChooseUs.letsGetStarted', 'Let\'s Get This Adventure Started! 🚀')}
              </span>
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* ——————————————————————————————————————————————————————————— */}
      {/* STATS SECTION */}
      {/* ——————————————————————————————————————————————————————————— */}
      <motion.section
        className="py-20 bg-gradient-to-br from-[#61936f] via-[#4a7c59] to-[#3d6b4a] text-white relative overflow-hidden"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              {t('home.stats.title', 'Trusted by Travelers Worldwide')}
            </motion.h2>
            <motion.div
              className="mx-auto mb-4 h-[3px] w-24 rounded-full"
              style={{ background: '#ffffff' }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              viewport={{ once: true }}
            />
            <motion.p
              className="text-lg text-white/80 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              {t('home.stats.subtitle', 'Join millions of travelers who trust ZapAround for their adventures')}
            </motion.p>
          </div>
          
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center group"
                initial={{ opacity: 0, y: 30, rotateX: -10, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ y: -6 }}
              >
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20 transition-all duration-300 hover:bg-white/30 hover:scale-105">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:bg-white/30">
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <AnimatedCounter to={stat.value} suffix={stat.suffix} className="text-3xl md:text-4xl font-bold text-white mb-2" />
                  <div className="text-white/90 font-semibold mb-2">{stat.label}</div>
                  <div className="text-white/70 text-sm leading-relaxed">{stat.description}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Join the Adventure Button */}
          <div className="text-center mt-12">
            <Button 
              onClick={scrollToActivitySelection}
              className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/30 px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
            >
              <span className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                {t('stats.joinAdventure', 'Join the Adventure! 🌍✨')}
              </span>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* ——————————————————————————————————————————————————————————— */}
      {/* LATEST BLOGS SECTION */}
      {/* ——————————————————————————————————————————————————————————— */}
      <section className="bg-[#fcfcfc] text-[#030303] py-20" aria-labelledby="latest-blogs-heading">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 id="latest-blogs-heading" className="text-4xl md:text-5xl font-bold text-[#1d1d1e] mb-4">
              {t('home.latestBlogs', 'Travel Inspiration')}
            </h2>
            <p className="text-xl text-[#62626a] max-w-2xl mx-auto">
              {t('home.latestBlogsDesc', 'Discover amazing destinations, travel tips, and stories from around the world')}
            </p>
          </div>
          <LatestBlogsGrid />
          
          {/* Ready to Explore Button */}
          <div className="text-center mt-12">
            <Button 
              onClick={scrollToActivitySelection}
              className="relative px-6 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-none hover:from-[#059669] hover:to-[#047857] hover:scale-105 transition-all duration-300 shadow-lg rounded-full font-medium tracking-wide"
            >
              <span className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                {t('latestBlogs.readyToExplore', 'Ready to Explore? Let\'s Go! 🎯')}
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* ——————————————————————————————————————————————————————————— */}
      {/* TRAVEL PAGINATION SECTION */}
      {/* ——————————————————————————————————————————————————————————— */}
      <TravelPagination 
        currentPage={currentPage}
        totalPages={5}
        onPageChange={setCurrentPage}
      />
    </>
  );
};

export default Index;
