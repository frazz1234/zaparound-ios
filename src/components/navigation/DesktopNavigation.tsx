import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Button } from '@/components/ui/button';
import { ChevronDown, LogIn, FileText, Users, Building2, DollarSign, Globe, LogOut } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserAvatar } from './UserAvatar';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { useTheme } from "@/components/theme-provider"
// Remove eager popup imports to avoid pulling them into the main bundle
const LazyUpgradePopup = lazy(() => import('@/components/UpgradePopup').then(m => ({ default: m.UpgradePopup })));
const LazyZapBookingPopup = lazy(() => import('@/components/ZapBookingPopup').then(m => ({ default: m.ZapBookingPopup })));

// Lazy-load the heavy FullCreateTripDialog (mapbox-gl, create-trip wizard …)
const LazyFullCreateTripDialog = lazy(() => import('@/components/FullCreateTripDialog').then(module => ({ default: module.FullCreateTripDialog })));

interface DesktopNavigationProps {
  session: any;
  onSignOut: () => void;
  isAdmin?: boolean;
}

export function DesktopNavigation({ session, onSignOut }: DesktopNavigationProps) {
  const { t, i18n } = useTranslation('navigation');
  const { t: zapbookingT } = useTranslation('zapbooking');
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, isAdmin, refreshRole } = useUserRole();
  const { theme } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUpgradePopupOpen, setIsUpgradePopupOpen] = useState(false);
  const [isBusinessUser, setIsBusinessUser] = useState(false);
  const [isZapBookingPopupOpen, setIsZapBookingPopupOpen] = useState(false);
  
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
  
  const isActive = (path: string) => location.pathname === path;
  const isDashboardPage = location.pathname.endsWith('/dashboard');
  const isMapDashboardPage = location.pathname.endsWith('/map-dashboard');
  const isHomePage = location.pathname === '/' || location.pathname === `/${i18n.language}` || location.pathname === `/${i18n.language}/`;
  
  // Add debug logs
  console.log('Current path:', location.pathname);
  console.log('Is Dashboard Page:', isDashboardPage);
  console.log('Is Map Dashboard Page:', isMapDashboardPage);
  
  const handleTripCreated = () => {
    // This is a no-op function to satisfy the required prop
  };
  

  

  
  const handleZapBookingClick = (e: React.MouseEvent) => {
    if (!isAdmin) {
      e.preventDefault();
      setIsZapBookingPopupOpen(true);
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    try {
      if (i18n.language === newLanguage) return;
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

      const pathSegments = location.pathname.split('/').filter(Boolean);
      const isLanguageInPath = SUPPORTED_LANGUAGES.includes(pathSegments[0]);

      if (isLanguageInPath) {
        pathSegments[0] = newLanguage;
        const newPath = '/' + pathSegments.join('/');
        navigate(newPath, { replace: true });
      } else {
        const newPath = `/${newLanguage}${location.pathname}`;
        navigate(newPath, { replace: true });
      }

      // Show success toast
      toast({
        title: t('languageChanged'),
        description: t('languageChangedDescription'),
        duration: 2000,
      });
      
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

  const languageDisplayNames: Record<string, string> = {
    en: 'English',
    fr: 'Français',
    es: 'Español',
  };
  
  return (
    <header className="sticky top-0 z-50 w-full hidden md:block bg-background/90 backdrop-blur-md border-b shadow-sm">
      <div className="container flex h-16 items-center">
        <div className="flex items-center justify-between w-full">
          <Link 
            to={session && (userRole === 'nosubs' || userRole === 'tier1' || userRole === 'tier2' || userRole === 'tier3' || userRole === 'tier4') 
              ? `/${i18n.language}/dashboard` 
              : `/${i18n.language}`} 
            reloadDocument
            className="flex items-center"
          >
            <img
              src={theme === "dark" ? "/zaparound-uploads/transparentwhite.png" : "/zaparound-uploads/transparentnoliner.webp"}
              alt="ZapAround"
              className="h-8 mr-4"
            />
          </Link>
          
          {/* Desktop navigation links for non-connected users */}
          {!session && (
            <div className="flex-1 flex justify-center">
              <div className="flex items-center space-x-6">
                {/* Only show home link for non-authenticated users and when not on homepage */}
                {!isHomePage && (
                  <Link
                    to={`/${i18n.language}`}
                    reloadDocument
                  >
                    <Button 
                      variant="outline" 
                      className={`px-6 py-3 h-auto transition-all duration-200 rounded-lg shadow-sm hover:shadow-md ${
                        isActive('/') 
                          ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-md' 
                          : 'bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700'
                      }`}
                    >
                      <span className="text-lg mr-2">🏠</span>
                      <span className="font-medium text-sm">{t('home')}</span>
                    </Button>
                  </Link>
                )}
                


                <Link to={`/${i18n.language}/community`}>
                  <Button 
                    variant="outline" 
                    className={`px-6 py-3 h-auto transition-all duration-200 rounded-lg shadow-sm hover:shadow-md ${
                      isActive('/community') 
                        ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-md' 
                        : 'bg-white hover:bg-orange-50 border-gray-200 hover:border-orange-300 text-gray-700 hover:text-orange-700'
                    }`}
                  >
                    <span className="text-lg mr-2">👥</span>
                    <span className="font-medium text-sm">{t('community')}</span>
                  </Button>
                </Link>

                {/* ZapBooking Dropdown for non-connected users */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="px-6 py-3 h-auto bg-white hover:bg-green-50 border border-gray-200 hover:border-green-300 text-gray-700 hover:text-green-700 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                    >
                      <span className="text-lg mr-2">✈️</span>
                      <span className="font-medium text-sm">{zapbookingT('menu.title', { ns: 'zapbooking' })}</span>
                      <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-white border border-gray-200 shadow-lg rounded-lg" align="center">
                    <div className="p-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                      <h3 className="font-medium text-gray-800 text-sm">{t('bookYourTrip')}</h3>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link 
                        to={`/${i18n.language}/travel-flight`} 
                        reloadDocument
                        className="cursor-pointer w-full flex items-center p-3 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <span className="mr-3 text-xl">✈️</span>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{zapbookingT('menu.flights', { ns: 'zapbooking' })}</div>
                          <div className="text-xs text-gray-500">{t('findFlightsBookHotels')}</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          {/* Desktop navigation for connected users - center buttons */}
          {session && (
            <div className="flex-1 flex justify-center">
                             <div className="flex items-center space-x-6">
                 {/* ZapBoard Button - Minimalist & Clean */}
                 {!isDashboardPage && (
                   <Link to={`/${i18n.language}/dashboard`}>
                     <Button 
                       variant="outline" 
                       className="px-6 py-3 h-auto bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                     >
                       <span className="text-lg mr-2">🏠</span>
                       <span className="font-medium text-sm">{t('zapboard')}</span>
                     </Button>
                   </Link>
                 )}
                 
                 {/* ZapBooking Dropdown - Modern Card Style */}
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button 
                       variant="outline" 
                       onClick={handleZapBookingClick}
                       className="px-6 py-3 h-auto bg-white hover:bg-green-50 border border-gray-200 hover:border-green-300 text-gray-700 hover:text-green-700 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                     >
                       <span className="text-lg mr-2">✈️</span>
                       <span className="font-medium text-sm">{zapbookingT('menu.title', { ns: 'zapbooking' })}</span>
                       <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent className="w-64 bg-white border border-gray-200 shadow-lg rounded-lg" align="center">
                     <div className="p-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                       <h3 className="font-medium text-gray-800 text-sm">{t('bookYourTrip')}</h3>
                     </div>
                     <DropdownMenuItem asChild>
                       <Link 
                         to={`/${i18n.language}/travel-flight`} 
                         reloadDocument
                         className="cursor-pointer w-full flex items-center p-3 hover:bg-gray-50 transition-colors duration-150"
                         
                       >
                         <span className="mr-3 text-xl">✈️</span>
                         <div>
                           <div className="font-medium text-gray-900 text-sm">{zapbookingT('menu.flights', { ns: 'zapbooking' })}</div>
                           <div className="text-xs text-gray-500">{t('findFlightsBookHotels')}</div>
                         </div>
                       </Link>
                     </DropdownMenuItem>
                   </DropdownMenuContent>
                 </DropdownMenu>

                 {/* ZapMap Button - Subtle & Elegant */}
                 {!isMapDashboardPage && (
                   <Button 
                     variant="outline"
                     onClick={(e) => {
                       e.preventDefault();
                       navigate(`/${i18n.language}/map-dashboard`);
                     }}
                     className="px-6 py-3 h-auto bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-300 text-gray-700 hover:text-purple-700 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                   >
                     <span className="text-lg mr-2">🌍</span>
                     <span className="font-medium text-sm">{t('mapView')}</span>
                   </Button>
                 )}

                 {/* Community Button - Clean & Modern */}
                 <Link to={`/${i18n.language}/community`}>
                   <Button 
                     variant="outline"
                     className={`px-6 py-3 h-auto transition-all duration-200 rounded-lg shadow-sm hover:shadow-md ${
                       isActive('/community') 
                         ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-md' 
                         : 'bg-white hover:bg-orange-50 border-gray-200 hover:border-orange-300 text-gray-700 hover:text-orange-700'
                     }`}
                   >
                     <span className="text-lg mr-2">👥</span>
                     <span className="font-medium text-sm">{t('community')}</span>
                   </Button>
                 </Link>
               </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {!session ? (
            <>
              <ThemeToggle />
              <LanguageSelector variant="outline" />
              
              {/* Blog Button for non-connected users */}
              <Link to={`/${i18n.language}/blog`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <span className="text-lg">📚</span>
                  {t('blog')}
                </Button>
              </Link>
              
              <Link to={`/${i18n.language}/auth`}>
                <Button
                  className="relative px-6 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-none hover:from-[#059669] hover:to-[#047857] hover:scale-105 transition-all duration-300 shadow-lg rounded-full font-medium tracking-wide"
                >
                  <span className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    {t('signIn')}
                  </span>
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <ThemeToggle />




              
              {/* Create Trip Button – loaded on-demand to cut initial JS ↘ */}
              <Suspense fallback={null}>
                <LazyFullCreateTripDialog session={session} />
              </Suspense>
              
              {/* Upgrade Popup – lazy */}
              <Suspense fallback={null}>
                <LazyUpgradePopup 
                  isOpen={isUpgradePopupOpen}
                  onClose={() => setIsUpgradePopupOpen(false)}
                />
              </Suspense>
              
              {/* ZapBooking Popup – lazy */}
              <Suspense fallback={null}>
                <LazyZapBookingPopup 
                  isOpen={isZapBookingPopupOpen}
                  onClose={() => setIsZapBookingPopupOpen(false)}
                />
              </Suspense>
              
              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1 p-0">
                    <UserAvatar url={avatarUrl} size="sm" />
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white" align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/${i18n.language}/profile`} className="cursor-pointer w-full flex items-center">
                      <UserAvatar url={avatarUrl} size="sm" className="mr-2" />
                      {t('profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/${i18n.language}/blog`} className="cursor-pointer w-full flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      {t('blog')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/${i18n.language}/community`} className="cursor-pointer w-full flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      {t('community')}
                    </Link>
                  </DropdownMenuItem>
                  
                  {/* Business Dashboard - Only show for business users */}
                  {isBusinessUser && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <a href="https://business.zaparound.com" target="_blank" rel="noopener noreferrer" className="cursor-pointer w-full flex items-center">
                          <Building2 className="mr-2 h-4 w-4" />
                          {t('business')}
                        </a>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {/* Tools Section */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/${i18n.language}/currency-converter`} className="cursor-pointer w-full flex items-center">
                      <DollarSign className="mr-2 h-4 w-4" />
                      {t('currencyConverter')}
                    </Link>
                  </DropdownMenuItem>
                  
                  {/* Language submenu for all connected users */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <div className="flex items-center">
                        <Globe className="mr-2 h-4 w-4" />
                        {t('language')}
                      </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-white">
                      <DropdownMenuRadioGroup value={i18n.language} onValueChange={handleLanguageChange}>
                        {SUPPORTED_LANGUAGES.map((lng) => {
                          const languageData: Record<string, { name: string; flag: string }> = {
                            en: { name: 'English', flag: '🇺🇸' },
                            fr: { name: 'Français', flag: '🇫🇷' },
                            es: { name: 'Español', flag: '🇪🇸' }
                          };
                          const languageInfo = languageData[lng];
                          
                          return (
                            <DropdownMenuRadioItem key={lng} value={lng} className="cursor-pointer">
                              <div className="flex items-center gap-2">
                                <span>{languageInfo.flag}</span>
                                <span>{languageInfo.name}</span>
                              </div>
                            </DropdownMenuRadioItem>
                          );
                        })}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
