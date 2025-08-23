import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star, Users, Clock, Gift, AlertCircle, Zap, Award, Crown, CreditCard, PlaneTakeoff, Car, CableCar, Plus} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { useStripePayment } from "@/hooks/useStripePayment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { SEO } from '@/components/SEO';
import useStructuredData from '@/hooks/useStructuredData';


export default function Pricing() {
  const { t: tPricing, i18n } = useTranslation('pricing');
  const { t: tNav } = useTranslation('navigation');
  const language = i18n.language;
  const locale = language === 'en' ? 'en_US' : language === 'fr' ? 'fr_FR' : 'es_ES';
  
  const [isYearly, setIsYearly] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { initiateCheckout, checkPaymentStatus, isLoading } = useStripePayment();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  
  // Update initial slide to 1 (middle slide)
  const [currentSlide, setCurrentSlide] = useState(1);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentSlide < 2) {
      setCurrentSlide(prev => prev + 1);
    }
    if (isRightSwipe && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  // Scroll to middle slide on mount for mobile
  useEffect(() => {
    if (carouselRef.current && window.innerWidth < 768) {
      const slideWidth = 280 + 16; // card width + gap
      carouselRef.current.scrollTo({
        left: slideWidth, // Scroll to middle slide (index 1)
        behavior: 'smooth'
      });
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      
      if (data.session) {
        // Fetch user role
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.session.user.id)
          .maybeSingle();
          
        if (!error && roleData) {
          setUserRole(roleData.role);
        }
      }
    };
    
    checkAuth();
    
    const urlParams = new URLSearchParams(location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId && !paymentProcessed) {
      handlePaymentSuccess(sessionId);
    }
    
    // Check if redirected from auth with a selected plan
    if (location.state?.selectedPlan && isAuthenticated) {
      const plan = location.state.selectedPlan;
      // Clear the state to prevent multiple subscription attempts
      window.history.replaceState({}, document.title, location.pathname);
      // Initiate checkout for the selected plan
      handleSubscribe(plan);
    }
  }, [location, isAuthenticated]);
  
  const handlePaymentSuccess = async (sessionId: string) => {
    setPaymentProcessed(true);
    
    try {
      const result = await checkPaymentStatus(sessionId);
      
      if (result.success && result.status === 'paid') {
        toast({
          title: tPricing('common.success'),
          description: tPricing('common.paymentSuccess'),
        });
        
        window.history.replaceState({}, document.title, '/pricing');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else if (!result.success) {
        toast({
          title: tPricing('common.error'),
          description: result.error || tPricing('common.paymentError'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing payment success:', error);
      toast({
        title: tPricing('common.error'),
        description: tPricing('common.paymentError'),
        variant: "destructive",
      });
    }
  };
  
  const handleSubscribe = async (plan: string) => {
    if (!isAuthenticated) {
      // Pass the current billing cycle preference to the auth page
      navigate('/auth', { state: { returnTo: '/pricing', plan, isYearly } });
      return;
    }
    
    const result = await initiateCheckout(plan, isYearly);
    
    if (result.success && result.url) {
      window.location.href = result.url;
    }
  };

  // Helper to get plan name from role
  const getPlanFromRole = (role: string | null): string | null => {
    switch (role) {
      case 'nosubs': return 'nosubs';
      case 'tier1': return 'zaptrip';
      case 'tier2': return 'zapout';
      case 'tier3': return 'zaproad';
      case 'tier4': return 'zappro';
      case 'admin': return 'admin';
      default: return null;
    }
  };

  // Get the user's current plan
  const currentPlan = getPlanFromRole(userRole);
  
  // Handle opening the Stripe customer portal
  const handleManageSubscription = () => {
    navigate("/profile/subscription");
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "ZapAround Travel Plans",
    "description": tPricing('subtitle'),
    "url": `https://zaparound.com/${language}/pricing`,
    "offers": [
      {
        "@type": "Offer",
        "name": "ZapTrip",
        "description": tPricing('zaptrip.description'),
        "price": "9.99",
        "priceCurrency": "USD",
        "billingIncrement": "P1M"
      },
      {
        "@type": "Offer",
        "name": "ZapOut",
        "description": tPricing('zapout.description'),
        "price": "19.99",
        "priceCurrency": "USD",
        "billingIncrement": "P1M"
      },
      {
        "@type": "Offer",
        "name": "ZapRoad",
        "description": tPricing('zaproad.description'),
        "price": "29.99",
        "priceCurrency": "USD",
        "billingIncrement": "P1M"
      }
    ]
  };

  // Helper to render the appropriate button or badge for each plan
  const renderPlanAction = (planId: string) => {
    if (userRole === 'admin') {
      return (
        <div className="flex items-center justify-center">
          <Badge className="bg-purple-500 hover:bg-purple-600">
            <Car className="w-4 h-4 mr-1" />
            {tPricing('common.adminAccess')}
          </Badge>
        </div>
      );
    }

    if (currentPlan === planId) {
      return (
        <div className="flex items-center justify-center">
          <Badge className="bg-green-500 hover:bg-green-600">
            {tPricing('currentPlan')}
          </Badge>
        </div>
      );
    }
    
    // Show "Update your subscription" button for users viewing a different plan
    if (userRole && currentPlan !== planId && userRole !== 'nosubs') {
      return (
        <Button 
          className={`w-full ${
            planId === 'zaptrip' ? 'bg-sky-500 hover:bg-blue-500' : 
            planId === 'zapout' ? 'bg-green-500 hover:bg-teal-500' : 
            planId === 'zaproad' ? 'bg-amber-500 hover:bg-yellow-500' :
            'bg-purple-500 hover:bg-purple-600'
          } flex items-center justify-center gap-2 font-sans font-semibold text-base`}
          onClick={handleManageSubscription}
        >
          <CreditCard className="h-4 w-4" />
          {tPricing('updateSubscription')}
        </Button>
      );
    }

    return (
      <Button 
        className={`w-full ${
          planId === 'zaptrip' ? 'bg-sky-500 hover:bg-blue-500' : 
          planId === 'zapout' ? 'bg-green-500 hover:bg-teal-500' : 
          planId === 'zaproad' ? 'bg-amber-500 hover:bg-yellow-500' :
          planId === 'zappro' ? 'bg-purple-500 hover:bg-purple-600' :
          'bg-gold-500 hover:bg-gold-600'
        } font-sans font-semibold text-base`}
        onClick={() => handleSubscribe(planId)}
        disabled={isLoading}
      >
        {isLoading ? tPricing('common.processing') : tPricing(`${planId}.action`)}
      </Button>
    );
  };
  
  return (
    <>
      <SEO
        title={tPricing('title')}
        description={tPricing('subtitle')}
        keywords="ZapAround pricing, travel plans, ZapTrip, ZapOut, ZapRoad, travel subscription, travel pricing, affordable travel planning"
        url={`/${language}/pricing`}
        locale={locale}
        structuredData={structuredData}
      />
      
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-[#030303] bg-clip-text text-transparent bg-gradient-to-r from-[#619370] to-[#72ba87]">
            {tPricing('title')}
          </h1>
          <p className="mt-4 max-w-3xl mx-auto text-xl text-[#000000]">
            {tPricing('subtitle')}
          </p>
        </div>

        <div className="relative">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none bg-gradient-to-br from-transparent via-transparent to-white/50 rounded-[100%]">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#72ba87] hover:bg-[#5da576] rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#72ba87] hover:bg-[#5da576] rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#72ba87] hover:bg-[#5da576] rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
          </div>

          {/* Pricing Toggle */}
          <div className="flex justify-center mb-8 relative">
            <div className="bg-white/80 backdrop-blur-sm p-1 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${!isYearly ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' : 'text-gray-600'}`}>
                  {tPricing('billingToggle.monthly')}
                </span>
                <Switch 
                  checked={isYearly}
                  onCheckedChange={setIsYearly}
                  className="mx-1 sm:mx-2"
                />
                <span className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${isYearly ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' : 'text-gray-600'}`}>
                  {tPricing('billingToggle.yearly')}
                  <span className="ml-1 sm:ml-2 bg-green-100 text-green-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full">
                    {tPricing('billingToggle.savings')}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* ZapPro Special Offer Banner */}
          <div className="max-w-7xl mx-auto px-4 mb-16 relative">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center space-x-2 mb-4">
                      <Award className="h-8 w-8 text-yellow-500" />
                      <span className="text-sm font-semibold text-yellow-500">{tPricing('zappro.title')}</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                      {tPricing('zappro.specialOffer')}
                    </h2>
                    <p className="text-gray-600 mb-4">{tPricing('zappro.description')}</p>
                    <div className="flex items-center justify-center md:justify-start space-x-2">
                      <span className="text-4xl font-bold text-gray-900">{tPricing('zappro.price')}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{tPricing('zappro.freeNote')}</p>
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <PlaneTakeoff className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                        <span className="text-sm font-medium text-blue-600">{tPricing('zaptrip.title')}</span>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4 text-center">
                        <CableCar className="h-6 w-6 text-green-500 mx-auto mb-2" />
                        <span className="text-sm font-medium text-green-600">{tPricing('zapout.title')}</span>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4 text-center">
                        <Car className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                        <span className="text-sm font-medium text-amber-600">{tPricing('zaproad.title')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-auto">
                    {renderPlanAction('zappro')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Individual Plans */}
          <div className="relative max-w-7xl mx-auto px-4">
            {/* Mobile Carousel Container */}
            <div className="md:hidden relative -mx-4 pt-8">
              {/* Background decorative elements for mobile */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#72ba87]/10 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#72ba87]/10 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#72ba87]/10 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
              </div>
              
              <div 
                ref={carouselRef}
                className="relative overflow-x-auto pb-6 px-4 snap-x snap-mandatory scrollbar-hide"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <div className="flex space-x-4 w-max">
                  {/* ZapTrip Card */}
                  <div className="w-[280px] flex-shrink-0 snap-center">
                    <div className="group relative pt-6">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 via-blue-500 to-sky-500 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                      <Card className="relative flex flex-col h-full bg-white/90 backdrop-blur-sm border-0 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-visible">
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                          <div className="bg-sky-500 text-white text-xs font-medium px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                            {tPricing('zaptrip.badge')}
                          </div>
                        </div>
                        <div className="p-8 pt-12">
                          <div className="flex items-center space-x-2 mb-6">
                            <PlaneTakeoff className="h-8 w-8 text-sky-500" />
                            <span className="text-sm font-semibold text-sky-500">{tPricing('zaptrip.title')}</span>
                          </div>
                          <h3 className="text-2xl font-bold mb-2 text-sky-500">{tPricing('zaptrip.title')}</h3>
                          <p className="text-gray-600 mb-6">{tPricing('zaptrip.description')}</p>
                          <ul className="space-y-3 mb-8">
                            {tPricing('zaptrip.features').split('|').map((feature, index) => (
                              <li key={index} className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="text-center mb-4">
                            <span className="text-3xl font-bold text-sky-500">{tPricing('zaptrip.price')}</span>
                            <span className="text-gray-500 ml-2">{tPricing('zaptrip.billing')}</span>
                          </div>
                          {renderPlanAction('zaptrip')}
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* ZapOut Card */}
                  <div className="w-[280px] flex-shrink-0 snap-center">
                    <div className="group relative pt-6">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 via-teal-500 to-emerald-500 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                      <Card className="relative flex flex-col h-full bg-white/90 backdrop-blur-sm border-0 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-visible">
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                          <div className="bg-green-500 text-white text-xs font-medium px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                            {tPricing('zapout.badge')}
                          </div>
                        </div>
                        <div className="p-8 pt-12">
                          <div className="flex items-center space-x-2 mb-6">
                            <CableCar className="h-8 w-8 text-green-500" />
                            <span className="text-sm font-semibold text-green-500">{tPricing('zapout.title')}</span>
                          </div>
                          <h3 className="text-2xl font-bold mb-2 text-green-500">{tPricing('zapout.title')}</h3>
                          <p className="text-gray-600 mb-6">{tPricing('zapout.description')}</p>
                          <ul className="space-y-3 mb-8">
                            {tPricing('zapout.features').split('|').map((feature, index) => (
                              <li key={index} className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="text-center mb-4">
                            <span className="text-3xl font-bold text-green-500">{tPricing('zapout.price')}</span>
                            <span className="text-gray-500 ml-2">{tPricing('zapout.billing')}</span>
                          </div>
                          {renderPlanAction('zapout')}
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* ZapRoad Card */}
                  <div className="w-[280px] flex-shrink-0 snap-center">
                    <div className="group relative pt-6">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                      <Card className="relative flex flex-col h-full bg-white/90 backdrop-blur-sm border-0 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-visible">
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                          <div className="bg-amber-500 text-white text-xs font-medium px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                            {tPricing('zaproad.badge')}
                          </div>
                        </div>
                        <div className="p-8 pt-12">
                          <div className="flex items-center space-x-2 mb-6">
                            <Car className="h-8 w-8 text-amber-500" />
                            <span className="text-sm font-semibold text-amber-500">{tPricing('zaproad.title')}</span>
                          </div>
                          <h3 className="text-2xl font-bold mb-2 text-amber-500">{tPricing('zaproad.title')}</h3>
                          <p className="text-gray-600 mb-6">{tPricing('zaproad.description')}</p>
                          <ul className="space-y-3 mb-8">
                            {tPricing('zaproad.features').split('|').map((feature, index) => (
                              <li key={index} className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="text-center mb-4">
                            <span className="text-3xl font-bold text-amber-500">{tPricing('zaproad.price')}</span>
                            <span className="text-gray-500 ml-2">{tPricing('zaproad.billing')}</span>
                          </div>
                          {renderPlanAction('zaproad')}
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
              {/* Updated Scroll Indicators */}
              <div className="flex justify-center space-x-2 mt-8">
                {[0, 1, 2].map((index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      currentSlide === index ? 'bg-[#619370] w-4' : 'bg-gray-300'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-8">
              {/* ZapTrip Card */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 via-blue-500 to-sky-500 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <Card className="relative flex flex-col h-full bg-[#fcfcfc]/80 backdrop-blur-sm border-0 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2">
                        <PlaneTakeoff className="h-8 w-8 text-sky-500" />
                        <span className="text-sm font-semibold text-sky-500">{tPricing('zaptrip.title')}</span>
                      </div>
                      <div className="bg-sky-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                        {tPricing('zaptrip.badge')}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-sky-500">{tPricing('zaptrip.title')}</h3>
                    <p className="text-gray-600 mb-6">{tPricing('zaptrip.description')}</p>
                    <ul className="space-y-3 mb-8">
                      {tPricing('zaptrip.features').split('|').map((feature, index) => (
                        <li key={index} className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="text-center mb-4">
                      <span className="text-3xl font-bold text-sky-500">{tPricing('zaptrip.price')}</span>
                      <span className="text-gray-500 ml-2">{tPricing('zaptrip.billing')}</span>
                    </div>
                    {renderPlanAction('zaptrip')}
                  </div>
                </Card>
              </div>

              {/* ZapOut Card */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <Card className="relative flex flex-col h-full bg-[#fcfcfc]/80 backdrop-blur-sm border-0 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2">
                        <CableCar className="h-8 w-8 text-emerald-500" />
                        <span className="text-sm font-semibold text-emerald-500">{tPricing('zapout.title')}</span>
                      </div>
                      <div className="bg-emerald-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                        {tPricing('zapout.badge')}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-emerald-500">{tPricing('zapout.title')}</h3>
                    <p className="text-gray-600 mb-6">{tPricing('zapout.description')}</p>
                    <ul className="space-y-3 mb-8">
                      {tPricing('zapout.features').split('|').map((feature, index) => (
                        <li key={index} className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="text-center mb-4">
                      <span className="text-3xl font-bold text-emerald-500">{tPricing('zapout.price')}</span>
                      <span className="text-gray-500 ml-2">{tPricing('zapout.billing')}</span>
                    </div>
                    {renderPlanAction('zapout')}
                  </div>
                </Card>
              </div>

              {/* ZapRoad Card */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <Card className="relative flex flex-col h-full bg-[#fcfcfc]/80 backdrop-blur-sm border-0 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2">
                        <Car className="h-8 w-8 text-amber-500" />
                        <span className="text-sm font-semibold text-amber-500">{tPricing('zaproad.title')}</span>
                      </div>
                      <div className="bg-amber-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                        {tPricing('zaproad.badge')}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-amber-500">{tPricing('zaproad.title')}</h3>
                    <p className="text-gray-600 mb-6">{tPricing('zaproad.description')}</p>
                    <ul className="space-y-3 mb-8">
                      {tPricing('zaproad.features').split('|').map((feature, index) => (
                        <li key={index} className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="text-center mb-4">
                      <span className="text-3xl font-bold text-amber-500">{tPricing('zaproad.price')}</span>
                      <span className="text-gray-500 ml-2">{tPricing('zaproad.billing')}</span>
                    </div>
                    {renderPlanAction('zaproad')}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Business Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {tPricing('business.title', 'For Businesses')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {tPricing('business.description', 'Custom solutions for travel agencies, tour operators, and businesses of all sizes')}
            </p>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center space-x-2 mb-4">
                    <Crown className="h-8 w-8 text-indigo-500" />
                    <span className="text-sm font-semibold text-indigo-500">{tPricing('business.enterprise', 'Enterprise')}</span>
                  </div>
                  <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                    {tPricing('business.customSolution', 'Custom Business Solution')}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {tPricing('business.features', 'Custom pricing|Dedicated support|API access|White-label options|Advanced analytics')}
                  </p>
                </div>
                <div className="w-full md:w-auto">
                  <Button
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => window.open('https://business.zaparound.com/business/create', '_blank')}
                  >
                    {tPricing('business.getStarted', 'Get Started')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">
            {tPricing('testimonials.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((num) => (
              <div key={num} className="bg-[#fcfcfc] p-6 rounded-lg shadow-md border border-gray-100 relative">
                <div className="absolute top-0 left-0 transform -translate-x-3 -translate-y-3">
                  <Star className="h-6 w-6 text-yellow-400 fill-current" />
                </div>
                <p className="text-gray-600 italic mb-4">"{tPricing(`testimonials.t${num}.quote`)}"</p>
                <p className="text-right font-medium text-gray-900">{tPricing(`testimonials.t${num}.author`)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="p-4">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-[#619370]/10 mb-4">
                <Zap className="h-6 w-6 text-[#619370]" />
              </div>
              <h3 className="font-semibold mb-2">{tPricing('features.fastPlanning.title')}</h3>
              <p className="text-gray-500 text-sm">{tPricing('features.fastPlanning.description')}</p>
            </div>
            <div className="p-4">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-[#72ba87]/10 mb-4">
                <Users className="h-6 w-6 text-[#72ba87]" />
              </div>
              <h3 className="font-semibold mb-2">{tPricing('features.groupTravel.title')}</h3>
              <p className="text-gray-500 text-sm">{tPricing('features.groupTravel.description')}</p>
            </div>
            <div className="p-4">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-[#619370]/10 mb-4">
                <Clock className="h-6 w-6 text-[#619370]" />
              </div>
              <h3 className="font-semibold mb-2">{tPricing('features.realTime.title')}</h3>
              <p className="text-gray-500 text-sm">{tPricing('features.realTime.description')}</p>
            </div>
            <div className="p-4">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-[#72ba87]/10 mb-4">
                <Award className="h-6 w-6 text-[#72ba87]" />
              </div>
              <h3 className="font-semibold mb-2">{tPricing('features.support.title')}</h3>
              <p className="text-gray-500 text-sm">{tPricing('features.support.description')}</p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{tPricing('faq.title')}</h2>
          <div className="grid gap-6 mt-8">
            {[1, 2, 3].map((num) => (
              <div key={num} className="text-left bg-[#fcfcfc] p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                  <AlertCircle className="h-5 w-5 text-[#619370] mr-2" />
                  {tPricing(`faq.q${num}`)}
                </h3>
                <p className="text-gray-500">
                  {tPricing(`faq.a${num}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        @media (max-width: 768px) {
          .scrollbar-hide {
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
            width: 100vw;
            margin-left: calc(-50vw + 50%);
            margin-right: calc(-50vw + 50%);
          }
          
          .scrollbar-hide > div {
            scroll-snap-align: center;
            scroll-snap-stop: always;
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
          }
        }
      `}</style>
    </>
  );
}
