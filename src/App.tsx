import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet, useParams } from "react-router-dom";
import { useState, useEffect, Suspense, lazy } from "react";
import { supabase } from "./integrations/supabase/client";

import { Navigation } from "./components/Navigation";
import { HelmetProvider } from 'react-helmet-async';
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';
import { InAppBrowserProvider } from "@/components/ui/InAppBrowserProvider";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import { HomePageAccessControl } from "./components/HomePageAccessControl";

import { UpdateNotification } from "./components/UpdateNotification";

import { ThemeProvider } from "./components/theme-provider";
import { analytics } from "./services/analytics";
import i18next from 'i18next';
import TripNoAccess from './pages/TripNoAccess';
import CommunityPost from '@/pages/CommunityPost';
import CommunityShare from '@/pages/CommunityShare';
import { FlightBooking } from './pages/booking/FlightBooking';
import { FlightBookingDetails } from './pages/booking/FlightBookingDetails';
import { HotelBooking } from './pages/booking/HotelBooking';
import { Bookings } from './pages/bookings/Bookings';
import { BookingDetail } from './pages/bookings/BookingDetail';
import { LanguageRouter } from './components/LanguageRouter';
import ZapPlaces from '@/pages/ZapPlaces';

// Lazy load non-critical routes
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MapDashboard = lazy(() => import("./pages/MapDashboard"));
const TripDetails = lazy(() => import("./pages/TripDetails"));
const CreateTrip = lazy(() => import("./pages/create-trip"));
const Profile = lazy(() => import("./pages/Profile"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Blog = lazy(() => import("./pages/EnhancedBlog"));
const BlogCategory = lazy(() => import("./pages/BlogCategory"));
const Admin = lazy(() => import("./pages/Admin"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const BlogEdit = lazy(() => import("./pages/BlogEdit"));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService'));
const CookiePolicy = lazy(() => import('./pages/legal/CookiePolicy'));
const GdprCompliance = lazy(() => import('./pages/legal/GdprCompliance'));
const LegalInformation = lazy(() => import('./pages/legal/LegalInformation'));
const Community = lazy(() => import('./pages/Community'));
const FAQ = lazy(() => import('./pages/FAQ'));
const DevSurvey = lazy(() => import('./pages/DevSurvey'));
const CurrencyConverter = lazy(() => import('./pages/CurrencyConverter'));
const TravelFlight = lazy(() => import('./pages/TravelFlight'));
const Unsubscribe = lazy(() => import('./pages/Unsubscribe'));



// Profile routes
const ProfileLayout = lazy(() => import('./pages/profile/ProfileLayout'));
const ProfilePersonalInfo = lazy(() => import('./pages/profile/PersonalInfo'));
const ProfilePassport = lazy(() => import('./pages/profile/Passport'));
const ProfileSecurity = lazy(() => import('./pages/profile/Security'));
const ProfileEmail = lazy(() => import('./pages/profile/Email'));
const ProfileSubscription = lazy(() => import('./pages/profile/Subscription'));
const ProfilePreferences = lazy(() => import('./pages/profile/Preferences'));
const ProfileAccount = lazy(() => import('./pages/profile/Account'));

// Constants for caching
const LANGUAGE_CACHE_KEY = 'user_language';
const LANGUAGE_TIMESTAMP_KEY = 'user_language_timestamp';
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes, same as role cache

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-pulse space-y-4">
      <div className="h-12 w-12 bg-blue-200 rounded-full mx-auto"></div>
      <div className="h-4 w-32 bg-blue-200 rounded mx-auto"></div>
    </div>
  </div>
);

// Broadcast channel for cross-tab communication
const authChannel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('auth_channel') 
  : null;

// Analytics route change tracker
function RouteChangeTracker() {
  const location = useLocation();
  
  useEffect(() => {
    // Track page view on route change
    analytics.pageView(location.pathname);
  }, [location]);
  
  return null;
}

// Layout component
interface LayoutProps {
  children: React.ReactNode;
  session: any;
}

function Layout({ children, session }: LayoutProps) {
  const location = useLocation();
  const shouldHideNav = location.pathname.includes('/unsubscribe');
  const isCreateTripPage = location.pathname.endsWith('/create-trip');
  
  return (
    <InAppBrowserProvider>
      <div className={cn(
        "min-h-screen flex flex-col pb-16 md:pb-0",
        !isCreateTripPage && "bg-background text-foreground"
      )}>
        {!shouldHideNav && <Navigation session={session} />}
        <div className="flex-grow">
          {children}
        </div>
      </div>
    </InAppBrowserProvider>
  );
}



// Custom Navigate component that handles language-aware redirects
function NavigateWithLang({ to, replace = true }: { to: string; replace?: boolean }) {
  const { lang } = useParams();
  const { i18n } = useTranslation();
  
  // Get the current language from URL params or i18n
  const currentLang = lang || i18n.language || 'en';
  
  // If the target path already includes a language prefix, use it as is
  if (to.startsWith('/:lang/')) {
    const targetPath = to.replace('/:lang/', `/${currentLang}/`);
    return <Navigate to={targetPath} replace={replace} />;
  }
  
  // If the target path doesn't have a language prefix, add it
  if (!to.startsWith('/')) {
    to = '/' + to;
  }
  
  const targetPath = `/${currentLang}${to}`;
  return <Navigate to={targetPath} replace={replace} />;
}

function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      // For initial load, we only need to clear cache if there's no session
      // or if the timestamp is old, not on every session
      if (session) {
        try {
          const cachedTimestamp = localStorage.getItem('userRoleTimestamp');
          const now = Date.now();
          
          if (!cachedTimestamp || (now - parseInt(cachedTimestamp)) > CACHE_EXPIRY) {
            localStorage.removeItem('userRole');
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('userRoleTimestamp');
            localStorage.removeItem(LANGUAGE_CACHE_KEY);
            localStorage.removeItem(LANGUAGE_TIMESTAMP_KEY);
          }

          // Fetch user's language preference with caching
          const fetchLanguage = async () => {
            try {
              // Check cache first
              const cachedLanguage = localStorage.getItem(LANGUAGE_CACHE_KEY);
              const languageTimestamp = localStorage.getItem(LANGUAGE_TIMESTAMP_KEY);
              const now = Date.now();

              // Use cached language if it's still valid
              if (cachedLanguage && languageTimestamp && 
                  (now - parseInt(languageTimestamp)) <= CACHE_EXPIRY) {
                await i18next.changeLanguage(cachedLanguage);
                return;
              }

              // Fetch from database if cache is invalid or missing
              const { data, error } = await supabase
                .from('profiles')
                .select('language')
                .eq('id', session.user.id)
                .single();
              
              if (!error && data?.language) {
                // Update cache
                localStorage.setItem(LANGUAGE_CACHE_KEY, data.language);
                localStorage.setItem(LANGUAGE_TIMESTAMP_KEY, now.toString());
                await i18next.changeLanguage(data.language);
              }
            } catch (err) {
              console.error("Error fetching user language:", err);
            }
          };
          
          void fetchLanguage();
        } catch (err) {
          console.error("Error clearing localStorage cache:", err);
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only update session when it changes
      setSession(prevSession => {
        if (!prevSession && !session) return prevSession;
        if (!prevSession && session) {
          // Fetch language preference when user logs in
          if (session.user) {
            const fetchLanguage = async () => {
              try {
                // Check cache first
                const cachedLanguage = localStorage.getItem(LANGUAGE_CACHE_KEY);
                const languageTimestamp = localStorage.getItem(LANGUAGE_TIMESTAMP_KEY);
                const now = Date.now();

                // Use cached language if it's still valid
                if (cachedLanguage && languageTimestamp && 
                    (now - parseInt(languageTimestamp)) <= CACHE_EXPIRY) {
                  await i18next.changeLanguage(cachedLanguage);
                  return;
                }

                // Fetch from database if cache is invalid or missing
                const { data, error } = await supabase
                  .from('profiles')
                  .select('language')
                  .eq('id', session.user.id)
                  .single();
                
                if (!error && data?.language) {
                  // Update cache
                  localStorage.setItem(LANGUAGE_CACHE_KEY, data.language);
                  localStorage.setItem(LANGUAGE_TIMESTAMP_KEY, now.toString());
                  await i18next.changeLanguage(data.language);
                }
              } catch (err) {
                console.error("Error fetching user language:", err);
              }
            };
            
            void fetchLanguage();
          }
          return session;
        }
        if (prevSession && !session) {
          // Clear language cache on logout
          localStorage.removeItem(LANGUAGE_CACHE_KEY);
          localStorage.removeItem(LANGUAGE_TIMESTAMP_KEY);
          return null;
        }
        if (prevSession?.access_token !== session?.access_token) return session;
        return prevSession;
      });
      
      // Only clear cache on SIGNED_IN, SIGNED_OUT, or TOKEN_REFRESHED events
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        try {
          localStorage.removeItem('userRole');
          localStorage.removeItem('isAdmin');
          localStorage.removeItem('userRoleTimestamp');
          if (event === 'SIGNED_OUT') {
            localStorage.removeItem(LANGUAGE_CACHE_KEY);
            localStorage.removeItem(LANGUAGE_TIMESTAMP_KEY);
          }
        } catch (err) {
          console.error("Error clearing localStorage cache:", err);
        }
      }
      
      // Broadcast auth change to other tabs if supported
      if (authChannel) {
        authChannel.postMessage({
          type: 'AUTH_STATE_CHANGE',
          event,
          session: session ? { 
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at
          } : null
        });
      }

      // Set user ID in analytics when user logs in/out
      if (session?.user?.id) {
        // Use a hashed version of the ID for privacy
        const hashedId = btoa(session.user.id).substring(0, 12);
        analytics.setUserId(hashedId);
      } else {
        analytics.setUserId(null);
      }
    });

    // Listen for auth changes from other tabs
    const handleAuthMessage = (event) => {
      if (event.data && event.data.type === 'AUTH_STATE_CHANGE') {
        // Only update if the session state is different
        const newSession = event.data.session;
        setSession(prevSession => {
          if (!prevSession && !newSession) return prevSession;
          if (!prevSession && newSession) return newSession;
          if (prevSession && !newSession) return null;
          if (prevSession.access_token !== newSession.access_token) return newSession;
          return prevSession;
        });
      }
    };

    if (authChannel) {
      authChannel.addEventListener('message', handleAuthMessage);
    }

    // Listen for app update notifications
    const handleAppUpdate = () => {
      // Show update notification instead of forcing reload
      console.log('New app version available');
      // You could show a toast notification here
    };
    
    window.addEventListener('appUpdateAvailable', handleAppUpdate);

    return () => {
      subscription.unsubscribe();
      if (authChannel) {
        authChannel.removeEventListener('message', handleAuthMessage);
      }
      window.removeEventListener('appUpdateAvailable', handleAppUpdate);
    };
  }, []);

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="zaparounds-theme">
      <HelmetProvider>
        <TooltipProvider>
            <Toaster />
            <UpdateNotification />
            <Router>
              <RouteChangeTracker />
              <LanguageRouter>
                <Layout session={session}>
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      {/* Root-level redirects for main pages */}
                      <Route path="/" element={<Navigate to="/en" replace />} />
                      
                      <Route path="/:lang" element={
                        <HomePageAccessControl session={session}>
                          <Index session={session} />
                        </HomePageAccessControl>
                      } />
                      <Route 
                        path="/:lang/auth" 
                        element={
                          session ? <NavigateWithLang to="/:lang/dashboard" /> : <Auth />
                        } 
                      />
                      <Route 
                        path="/:lang/create-trip" 
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <CreateTrip session={session} />
                          </Suspense>
                        }
                      />
                      <Route 
                        path="/:lang/dashboard" 
                        element={
                          !session ? <NavigateWithLang to="/auth" /> : <Dashboard />
                        } 
                      />
                      <Route 
                        path="/:lang/map-dashboard" 
                        element={
                          !session ? <NavigateWithLang to="/auth" /> : <MapDashboard />
                        } 
                      />
                      
                      {/* Profile Routes */}
                      <Route 
                        path="/:lang/profile" 
                        element={
                          !session ? <NavigateWithLang to="/auth" /> : <ProfileLayout />
                        }
                      >
                        <Route index element={<ProfilePersonalInfo />} />
                        <Route path="passport" element={<ProfilePassport />} />
                        <Route path="security" element={<ProfileSecurity />} />
                        <Route path="email" element={<ProfileEmail />} />
                        <Route path="subscription" element={<ProfileSubscription />} />
                        <Route path="preferences" element={<ProfilePreferences />} />
                        <Route path="account" element={<ProfileAccount />} />
                      </Route>
                      
                      <Route 
                        path="/:lang/trips/:tripId" 
                        element={
                          !session ? <NavigateWithLang to="/auth" /> : <TripDetails />
                        }
                      />
                      <Route 
                        path="/:lang/trips/:tripId/share" 
                        element={
                          !session ? <NavigateWithLang to="/auth" /> : <TripDetails />
                        }
                      />
                      <Route 
                        path="/:lang/zapout/:tripId" 
                        element={
                          !session ? <NavigateWithLang to="/auth" /> : <TripDetails />
                        }
                      />
                      <Route 
                        path="/:lang/zapout/:tripId/share" 
                        element={
                          !session ? <NavigateWithLang to="/auth" /> : <TripDetails />
                        }
                      />
                      <Route 
                        path="/:lang/zaproad/:tripId" 
                        element={
                          !session ? <NavigateWithLang to="/auth" /> : <TripDetails />
                        }
                      />
                      <Route 
                        path="/:lang/zaproad/:tripId/share" 
                        element={
                          !session ? <NavigateWithLang to="/auth" /> : <TripDetails />
                        }
                      />
                      <Route path="/:lang/about" element={<About />} />
                      <Route path="/:lang/admin" element={<Admin />} />
                      <Route path="/:lang/admin/blog/:id" element={<BlogEdit />} />
                      <Route path="/:lang/blog" element={<Blog />} />
                      <Route path="/:lang/blog/category/:categorySlug" element={<BlogCategory />} />
                      <Route path="/:lang/blog/:blogSlug" element={<BlogPost />} />
                      <Route path="/:lang/contact" element={<Contact />} />
                      <Route path="/:lang/pricing" element={<Pricing />} />
                      <Route path="/:lang/reset-password" element={<ResetPassword />} />
                      <Route path="/:lang/community" element={<Community />} />
                      <Route path="/:lang/community/post/:postId" element={<CommunityPost />} />
                      <Route path="/:lang/community/share/:postId/:locationSlug?" element={<CommunityShare />} />
                      <Route path="/:lang/zap-places/:placeSlug" element={<ZapPlaces />} />
                      
                      {/* Booking Routes */}
                      <Route path="/:lang/travel-flight" element={<TravelFlight />} />
                      <Route path="/:lang/booking/flights" element={<NavigateWithLang to="/:lang/travel-flight" />} />
                      <Route path="/:lang/booking/internal-flights" element={<FlightBooking />} />
                      <Route path="/:lang/booking/flight-details" element={<FlightBookingDetails />} />
                      <Route path="/:lang/booking/hotels" element={<HotelBooking />} />
                      <Route path="/:lang/bookings" element={<Bookings />} />
                      <Route path="/:lang/bookings/:bookingReference" element={<BookingDetail />} />
                      
                      {/* Legal Pages */}
                      <Route path="/:lang/legal" element={<LegalInformation />} />
                      <Route path="/:lang/privacy" element={<PrivacyPolicy />} />
                      <Route path="/:lang/terms" element={<TermsOfService />} />
                      <Route path="/:lang/cookie-policy" element={<CookiePolicy />} />
                      <Route path="/:lang/gdpr" element={<GdprCompliance />} />
                      <Route path="/:lang/faq" element={<FAQ />} />
                      <Route path="/:lang/devsurvey" element={<DevSurvey />} />
                      <Route path="/devsurvey" element={<NavigateWithLang to="/:lang/devsurvey" />} />
                      <Route path="/:lang/currency-converter" element={<CurrencyConverter />} />
                      <Route path="/:lang/unsubscribe" element={<Unsubscribe />} />
                      <Route path="/unsubscribe" element={<Unsubscribe />} />
                      

                      
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </Layout>
              </LanguageRouter>
            </Router>

          </TooltipProvider>
      </HelmetProvider>
    </ThemeProvider>
  );
}

export default App;
