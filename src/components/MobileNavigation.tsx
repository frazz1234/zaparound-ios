import React, { useState, useEffect, lazy, Suspense } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
import { useUserRole } from '@/hooks/useUserRole';
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from './navigation/UserAvatar';
import { supabase } from '@/integrations/supabase/client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Plane, 
  LogIn, 
  Users, 
  Calendar, 
  FileText, 
  Home, 
  Globe, 
  DollarSign, 
  LogOut,
  Check,
  ChevronDown 
} from "lucide-react";

// Lazy loaded popups to keep initial bundle small
const LazyUpgradePopup = lazy(() => import('@/components/UpgradePopup').then(m => ({ default: m.UpgradePopup })));
const LazyZapBookingPopup = lazy(() => import('@/components/ZapBookingPopup').then(m => ({ default: m.ZapBookingPopup })));

// Lazy-load heavy Create Trip dialog only when user taps the button
const LazyFullCreateTripDialog = lazy(() => import('@/components/FullCreateTripDialog').then(module => ({ default: module.FullCreateTripDialog })));

interface MobileNavigationProps {
  session: any;
  onSignOut: () => void;
  isAdmin?: boolean;
}

export function MobileNavigation({ session, onSignOut }: MobileNavigationProps) {
  const { t, i18n } = useTranslation('navigation');
  const { t: tProfile } = useTranslation('profile');
  const { t: zapbookingT } = useTranslation('zapbooking');
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, isAdmin, refreshRole } = useUserRole();
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUpgradePopupOpen, setIsUpgradePopupOpen] = useState(false);
  const [isBusinessUser, setIsBusinessUser] = useState(false);
  const [isZapBookingPopupOpen, setIsZapBookingPopupOpen] = useState(false);
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false);
  const [isLanguageExpanded, setIsLanguageExpanded] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      getProfile(session.user.id);
      // Check if user has business access (for external redirect)
      checkBusinessStatus(session.user.id);
    }
  }, [session?.user?.id]);

  const getProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (data?.avatar_url) {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(data.avatar_url);
        setAvatarUrl(publicUrl);
      } else {
        setAvatarUrl(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const checkBusinessStatus = async (userId: string) => {
    try {
      // Check if user owns a business
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', userId)
        .single();

      if (!businessError && businessData) {
        setIsBusinessUser(true);
        return;
      }

      // Check if user is a team member
      const { data: memberData, error: memberError } = await supabase
        .from('business_members')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!memberError && memberData) {
        setIsBusinessUser(true);
      }
    } catch (error) {
      console.error('Error checking business status:', error);
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    if (i18n.language === newLanguage) {
      setIsDashboardOpen(false);
      return;
    }
    
    try {
      // Change the language
      await i18n.changeLanguage(newLanguage);

      // Persist to user profile if logged in
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          await supabase
            .from('profiles')
            .update({ language: newLanguage })
            .eq('id', user.id);
          // Update local cache to align with App.tsx behavior
          localStorage.setItem('user_language', newLanguage);
          localStorage.setItem('user_language_timestamp', Date.now().toString());
        }
      } catch (dbError) {
        console.error('Error updating language in profile:', dbError);
      }
      
      // Update URL with new language
      const pathSegments = location.pathname.split('/').filter(Boolean);
      const isLanguageInPath = SUPPORTED_LANGUAGES.includes(pathSegments[0]);
      
      if (isLanguageInPath) {
        // Replace the language segment in the URL
        pathSegments[0] = newLanguage;
        const newPath = '/' + pathSegments.join('/');
        navigate(newPath, { replace: true });
      } else {
        // Add language to the URL
        const newPath = `/${newLanguage}${location.pathname}`;
        navigate(newPath, { replace: true });
      }
      
      // Show success toast
      toast({
        title: t('languageChanged'),
        description: t('languageChangedDescription'),
        duration: 2000,
      });
      
      // Close the dropdown
      setIsDashboardOpen(false);
      
    } catch (error) {
      console.error('Error changing language:', error);
      toast({
        title: t('error'),
        description: t('errorDescription'),
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const isHomePage = location.pathname === '/' || location.pathname === `/${i18n.language}` || location.pathname === `/${i18n.language}/`;





  if (!session) {
    // Navigation for logged-out users
    return (
      <nav
        aria-label="Main navigation"
        className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 px-2 w-[95vw] max-w-md rounded-2xl shadow-xl bg-[#fcfcfc] border border-[#eaeaea] flex items-center justify-between md:hidden"
        style={{ boxShadow: '0 8px 32px rgba(29,29,30,0.10)' }}
      >
        {/* Only show home button when not on homepage */}
        {!isHomePage && (
          <Link to="/" reloadDocument className="flex flex-col items-center flex-1 py-2" aria-label={t('home')}>
            <img 
              src="/zaparound-uploads/smalllogo.webp"
              srcSet="/zaparound-uploads/smalllogo.webp 1x, /zaparound-uploads/smalllogo.webp 2x"
              width="28"
              height="28"
              alt="ZapAround Logo"
              loading="lazy"
              className="w-7 h-7 object-contain"
            />
            <span className="text-[11px] mt-0.5 text-[#62626a]">{t('home')}</span>
          </Link>
        )}
        {/* ZapBooking Button for non-connected users */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex flex-col items-center flex-1 py-2" aria-label={zapbookingT('menu.title')}>
              <Plane className="w-6 h-6 text-[#62626a]" />
              <span className="text-[11px] mt-0.5 text-[#62626a]">{zapbookingT('menu.title')}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-60" align="center">
            <div className="grid gap-2">
              <Link 
                to={`/${i18n.language}/travel-flight`}
                reloadDocument
                className="flex items-center gap-2 p-3 hover:bg-[#f3f3f3] rounded-md"
              >
                <Plane className="w-5 h-5 text-[#62626a]" />
                <span className="text-sm">{zapbookingT('menu.flights')}</span>
              </Link>
            
              
            </div>
          </PopoverContent>
        </Popover>
        
        <Link to={`/${i18n.language}/auth`} className="flex flex-col items-center flex-1 py-2" aria-label={t('signIn')}>
          <LogIn className={`w-6 h-6 ${isActive('/auth') ? 'text-[#61936f]' : 'text-[#62626a]'}`} />
          <span className="text-[11px] mt-0.5 text-[#62626a]">{t('signIn')}</span>
        </Link>
        <Link to={`/${i18n.language}/community`} className="flex flex-col items-center flex-1 py-2" aria-label={t('community')}>
          <Users className={`w-6 h-6 ${isActive('/community') ? 'text-[#61936f]' : 'text-[#62626a]'}`} />
          <span className="text-[11px] mt-0.5 text-[#62626a]">{t('community')}</span>
        </Link>
        <div className="flex flex-col items-center flex-1 py-2">
          <LanguageSelector variant="ghost" className="h-7 w-7" />
          <span className="text-[11px] mt-0.5 text-[#62626a]">{t('language')}</span>
        </div>
      </nav>
    );
  }

  // Navigation for logged-in users
  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 px-2 w-[95vw] max-w-md rounded-2xl shadow-xl bg-[#fcfcfc] border border-[#eaeaea] flex items-center justify-between md:hidden"
      style={{ boxShadow: '0 8px 32px rgba(29,29,30,0.10)' }}
    >
      {/* ZapBooking Button */}
      <Popover>
        <PopoverTrigger asChild>
          <button 
            className="flex flex-col items-center flex-1 py-2"
            aria-label={zapbookingT('menu.title')}
          >
            <Calendar className="w-6 h-6 text-[#61936f]" />
            <span className="text-[11px] mt-0.5 text-[#62626a]">{zapbookingT('menu.title')}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-60" align="center">
          <div className="grid gap-2">
            <Link 
              to={`/${i18n.language}/travel-flight`}
              reloadDocument
              className="flex items-center gap-2 p-3 hover:bg-[#f3f3f3] rounded-md"
            >
              <Plane className="w-5 h-5 text-[#62626a]" />
              <span className="text-sm">{zapbookingT('menu.flights')}</span>
            </Link>
            
          </div>
        </PopoverContent>
      </Popover>

      {/* Create Trip Dialog – deferred load to minimise initial JS */}
      <Suspense fallback={null}>
        <LazyFullCreateTripDialog 
          session={session}
          buttonVariant="mobile"
        />
      </Suspense>

              {/* Home or ZapMenu */}
        <Popover open={isDashboardOpen} onOpenChange={(open) => {
          setIsDashboardOpen(open);
          if (!open) {
            setIsLanguageExpanded(false);
          }
        }}>
          <PopoverTrigger asChild>
            <button className="flex flex-col items-center flex-1 py-2" aria-label="ZapMenu">
              <img 
                src="/zaparound-uploads/smalllogo.webp"
                srcSet="/zaparound-uploads/smalllogo.webp 1x, /zaparound-uploads/smalllogo.webp 2x"
                width="28"
                height="28"
                alt="ZapAround Logo"
                loading="lazy"
                className="w-7 h-7 object-contain"
              />
              <span className="text-[11px] mt-0.5 text-[#62626a]">ZapMenu</span>
            </button>
          </PopoverTrigger>
        <PopoverContent className="w-60 z-[100]" align="center">
          <div className="grid gap-2">
            <Link 
              to={`/${i18n.language}/profile`}
              className="flex items-center gap-2 p-3 hover:bg-[#f3f3f3] rounded-md"
              onClick={() => setIsDashboardOpen(false)}
            >
              <UserAvatar url={avatarUrl} size="sm" />
              <span className="text-sm">{t('profile')}</span>
            </Link>
            <Link 
              to={`/${i18n.language}/blog`}
              className="flex items-center gap-2 p-3 hover:bg-[#f3f3f3] rounded-md"
              onClick={() => setIsDashboardOpen(false)}
            >
              <FileText className="w-5 h-5 text-[#62626a]" />
              <span className="text-sm">{t('blog')}</span>
            </Link>
            <div className="h-px bg-gray-200 my-1" />
            <Link 
              to={`/${i18n.language}/dashboard`}
              className="flex items-center gap-2 p-3 hover:bg-[#f3f3f3] rounded-md w-full text-left"
              onClick={() => setIsDashboardOpen(false)}
            >
              <Home className="w-5 h-5 text-[#62626a]" />
              <span className="text-sm">{t('zapboard')}</span>
            </Link>

            <button 
              className="flex items-center gap-2 p-3 hover:bg-[#f3f3f3] rounded-md w-full text-left"
              onClick={(e) => {
                e.preventDefault();
                navigate('/map-dashboard');
                setIsDashboardOpen(false);
              }}
            >
              <Globe className="w-5 h-5 text-[#62626a]" />
              <span className="text-sm">{t('mapView') || 'Map View'}</span>
            </button>
            <Link 
              to={`/${i18n.language}/community`}
              className="flex items-center gap-2 p-3 hover:bg-[#f3f3f3] rounded-md"
              onClick={() => setIsDashboardOpen(false)}
            >
              <Users className="w-5 h-5 text-[#62626a]" />
              <span className="text-sm">{t('community')}</span>
            </Link>
            {/* Business Dashboard - Only show for business users */}
            {isBusinessUser && (
              <>
                <div className="h-px bg-gray-200 my-1" />
                <a 
                  href="https://business.zaparound.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 hover:bg-[#f3f3f3] rounded-md"
                  onClick={() => setIsDashboardOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{t('business')}</span>
                </a>
              </>
            )}
            {/* Tools Section */}
            <div className="h-px bg-gray-200 my-1" />
            <Link 
              to={`/${i18n.language}/currency-converter`}
              className="flex items-center gap-2 p-3 hover:bg-[#f3f3f3] rounded-md"
              onClick={() => setIsDashboardOpen(false)}
            >
              <DollarSign className="w-5 h-5 text-[#62626a]" />
              <span className="text-sm">{t('currencyConverter')}</span>
            </Link>
            
            {/* Language Picker Section - Collapsible */}
            <div className="h-px bg-gray-200 my-1" />
            <div className="p-2">
              <button
                onClick={() => setIsLanguageExpanded(!isLanguageExpanded)}
                className="w-full flex items-center justify-between p-2 hover:bg-[#f3f3f3] rounded-md transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#62626a]" />
                  <span className="text-sm font-medium text-[#62626a]">{t('language')}</span>
                </div>
                <ChevronDown 
                  className={`h-4 w-4 text-[#62626a] transition-transform duration-200 ${
                    isLanguageExpanded ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {isLanguageExpanded && (
                <div className="mt-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isCurrent = lang === i18n.language;
                    const languageData: Record<string, { name: string; flag: string }> = {
                      en: { name: 'English', flag: '🇺🇸' },
                      fr: { name: 'Français', flag: '🇫🇷' },
                      es: { name: 'Español', flag: '🇪🇸' }
                    };
                    const languageInfo = languageData[lang];
                    
                    return (
                      <button
                        key={lang}
                        onClick={() => {
                          handleLanguageChange(lang);
                          setIsLanguageExpanded(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-md transition-all duration-200 ml-2 ${
                          isCurrent 
                            ? 'bg-[#61936f]/10 text-[#61936f]' 
                            : 'hover:bg-[#f3f3f3] text-[#62626a]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{languageInfo.flag}</span>
                          <span className="text-sm font-medium">{languageInfo.name}</span>
                        </div>
                        {isCurrent && (
                          <Check className="h-4 w-4 text-[#61936f]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="h-px bg-gray-200 my-1" />
            <button
              onClick={() => {
                onSignOut();
                setIsDashboardOpen(false);
              }}
              className="flex items-center gap-2 p-3 hover:bg-[#f3f3f3] rounded-md text-left w-full"
            >
              <LogOut className="w-5 h-5 text-[#62626a]" />
              <span className="text-sm">{t('signOut')}</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* ZapBooking Popup */}
      <Suspense fallback={null}>
        <LazyZapBookingPopup 
          isOpen={isZapBookingPopupOpen}
          onClose={() => setIsZapBookingPopupOpen(false)}
        />
      </Suspense>

      {/* Upgrade Popup */}
      <Suspense fallback={null}>
        <LazyUpgradePopup 
          isOpen={isUpgradePopupOpen}
          onClose={() => setIsUpgradePopupOpen(false)}
        />
      </Suspense>
    </nav>
  );
}
