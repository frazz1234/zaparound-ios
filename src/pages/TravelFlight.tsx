import { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { Loader2, AlertCircle, RefreshCw, Plane, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const LOCALE_MAP: Record<string, string> = { en: "en_US", fr: "fr_FR", es: "es_ES" };

export default function TravelFlight() {
  const { t, i18n } = useTranslation("travelFlight");
  const locale = LOCALE_MAP[i18n.language] || "en_US";
  const language = i18n.language || "en";
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Ensure we start at the top on client-side navigation to this page
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, []);
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showFallback, setShowFallback] = useState(false);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const isClientNavigation = useRef(false);
  const previousLocation = useRef<string | null>(null);

  // Detect client-side navigation and force widget reinitialization (safe, non-deprecated)
  useEffect(() => {
    const currentPath = location.pathname + location.search;

    let navType: string | number | undefined;
    try {
      const navEntries = (performance && (performance as any).getEntriesByType)
        ? (performance.getEntriesByType('navigation') as any[])
        : [];
      navType = navEntries[0]?.type || (performance as any)?.navigation?.type;
    } catch {
      navType = undefined;
    }

    const isDirectAccess = !previousLocation.current ||
      navType === 'reload' ||
      navType === 'back_forward' ||
      (document.referrer && new URL(document.referrer).origin !== 'https://zaparound.com');

    if (previousLocation.current && previousLocation.current !== currentPath) {
      console.log('Client-side navigation detected, forcing widget reinitialization');
      isClientNavigation.current = true;
      setRetryCount(prev => prev + 1);
    } else if (isDirectAccess) {
      console.log('Direct URL access detected, normal widget loading');
      isClientNavigation.current = false;
    }

    previousLocation.current = currentPath;
  }, [location]);

  // Fallback search form state
  const [origin, setOrigin] = useState(searchParams.get('origin') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    searchParams.get('departureDate') ? new Date(searchParams.get('departureDate')!) : undefined
  );
  const [returnDate, setReturnDate] = useState<Date | undefined>(
    searchParams.get('returnDate') ? new Date(searchParams.get('returnDate')!) : undefined
  );
  const [tripType, setTripType] = useState<'roundtrip' | 'oneway'>(
    (searchParams.get('tripType') as 'roundtrip' | 'oneway') || 'roundtrip'
  );
  const [isDepartureDateOpen, setIsDepartureDateOpen] = useState(false);
  const [isReturnDateOpen, setIsReturnDateOpen] = useState(false);

  // Ensure the external script is added and properly loaded
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let scriptElement: HTMLScriptElement | null = null;

    const removeTpwlScriptsAndGlobals = () => {
      const existingWidgetScripts = Array.from(
        document.querySelectorAll('script[src^="https://tpwgts.com/wl_web/main.js"]')
      );
      existingWidgetScripts.forEach((s) => {
        try { s.parentElement?.removeChild(s); } catch {}
      });
      try { delete (window as any).tpwl; } catch {}
      try { delete (window as any).travelpayouts; } catch {}
      try { delete (window as any).TPWL_CONFIGURATION; } catch {}
      (window as any).__TPWL_SCRIPT_ADDED = false;
    };

    // Removed visibility enforcement as requested

    const loadWidget = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        setShowFallback(false);
        setWidgetLoaded(false);

        // Force widget reinitialization by clearing any existing widget content
        const searchContainer = document.getElementById('tpwl-search');
        const ticketsContainer = document.getElementById('tpwl-tickets');
        if (searchContainer) searchContainer.innerHTML = '';
        if (ticketsContainer) ticketsContainer.innerHTML = '';

        // Always ensure a clean slate; external library can cache state across navigations
        removeTpwlScriptsAndGlobals();
        // Small delay to ensure cleanup settles
        await new Promise(resolve => setTimeout(resolve, 50));
        isClientNavigation.current = false;

        // Build TPWL configuration from URL params
        const getTpwlConfigFromUrl = () => {
          const p = new URLSearchParams(window.location.search);

          const buildISODate = (ddmm: string): string | undefined => {
            if (!/^\d{4}$/.test(ddmm)) return undefined;
            const dd = parseInt(ddmm.slice(0, 2), 10);
            const mm = parseInt(ddmm.slice(2, 4), 10);
            if (dd < 1 || dd > 31 || mm < 1 || mm > 12) return undefined;
            const today = new Date();
            const year = today.getFullYear();
            const candidate = new Date(year, mm - 1, dd);
            // if already past, roll to next year
            const finalDate = candidate < today ? new Date(year + 1, mm - 1, dd) : candidate;
            return `${finalDate.getFullYear()}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
          };

          const parseFlightSearch = (value: string | null) => {
            if (!value) return null;
            const s = value.trim().toUpperCase();
            // Expected patterns:
            // ORG(3) + DEPART(4 ddmm) + DST(3) + RETURN(4 ddmm) + PAX(1)
            // OR oneway: ORG(3) + DEPART(4) + DST(3) + PAX(1)
            if (s.length < 11) return null;
            const origin_iata = s.slice(0, 3);
            const depart_ddmm = s.slice(3, 7);
            const destination_iata = s.slice(7, 10);
            let return_ddmm: string | undefined;
            let paxChar: string;
            if (s.length >= 15) {
              return_ddmm = s.slice(10, 14);
              paxChar = s.slice(14);
            } else {
              paxChar = s.slice(10);
            }
            const adults = Math.max(1, parseInt(paxChar, 10) || 1);
            const depart_date = buildISODate(depart_ddmm);
            const return_date = return_ddmm ? buildISODate(return_ddmm) : undefined;
            return { origin_iata, destination_iata, depart_date, return_date, adults };
          };

          // Prefer compact param if provided
          const compact = parseFlightSearch(p.get('flightSearch'));

          // Legacy/explicit params
          const originIata = (p.get('origin_iata') || p.get('origin') || '').toUpperCase();
          const destinationIata = (p.get('destination_iata') || p.get('destination') || '').toUpperCase();
          const departDate = p.get('depart_date') || p.get('departureDate') || '';
          const returnDate = p.get('return_date') || p.get('returnDate') || '';
          const adults = parseInt(p.get('adults') || '1', 10);
          const children = parseInt(p.get('children') || '0', 10);
          const infants = parseInt(
            p.get('infants') || String(parseInt(p.get('infantsInSeat') || '0', 10) + parseInt(p.get('infantsOnLap') || '0', 10)),
            10
          );
          const cabin = (p.get('cabinClass') || 'economy').toLowerCase();
          const tripClass = p.get('trip_class') || (cabin === 'economy' ? 'Y' : cabin === 'premium' ? 'W' : cabin === 'business' ? 'C' : cabin === 'first' ? 'F' : 'Y');

          const search: any = {};
          if (compact) {
            Object.assign(search, compact);
          } else {
            if (originIata) search.origin_iata = originIata;
            if (destinationIata) search.destination_iata = destinationIata;
            if (departDate) search.depart_date = departDate;
            if (returnDate) search.return_date = returnDate;
            if (adults) search.adults = adults;
            if (children) search.children = children;
            if (infants) search.infants = infants;
          }
          if (tripClass) search.trip_class = tripClass;

          return {
            ...(window as any).TPWL_CONFIGURATION,
            resultsURL: `https://zaparound.com/${i18n.language}/travel-flight`,
            ...(Object.keys(search).length > 0 ? { search } : {}),
          };
        };

        // If a script is already present (e.g., due to StrictMode double-invoke), avoid re-adding
        const alreadyHasScript = document.querySelector(
          'script[src="https://tpwgts.com/wl_web/main.js?wl_id=396"]'
        );

        // Set configuration BEFORE loading the script so it can pick it up
        (window as any).TPWL_CONFIGURATION = getTpwlConfigFromUrl();

        if (!(window as any).__TPWL_SCRIPT_ADDED && !alreadyHasScript) {
          // Create and load the script once
          (window as any).__TPWL_SCRIPT_ADDED = true; // set early to avoid race in StrictMode
          scriptElement = document.createElement("script");
          scriptElement.async = true;
          scriptElement.type = "module";
          scriptElement.src = "https://tpwgts.com/wl_web/main.js?wl_id=396";
          scriptElement.setAttribute("data-noptimize", "1");
          scriptElement.setAttribute("data-cfasync", "false");
          scriptElement.setAttribute("data-wpfc-render", "false");
          
          scriptElement.addEventListener('load', triggerWidgetInit);
          scriptElement.addEventListener('error', handleScriptError);
          
          document.head.appendChild(scriptElement);
          console.log('Widget script appended to DOM with TPWL_CONFIGURATION:', (window as any).TPWL_CONFIGURATION);
        } else {
          // Script already present; try initializing directly
          console.log('TPWL script already present; attempting direct initialization');
          setTimeout(triggerWidgetInit, 300);
        }

        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (isLoading) {
            handleScriptError(new Error('Widget loading timeout'));
          }
        }, 15000); // 15 second timeout

      } catch (error) {
        console.error('Error loading travel widget:', error);
        handleScriptError(error);
      }
    };

    const triggerWidgetInit = () => {
      // Clear timeout since script loaded successfully
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      console.log('Script loaded, starting widget initialization...');

      // More robust widget detection and initialization
      const checkWidgetInitialization = () => {
        const searchContainer = document.getElementById('tpwl-search');
        const ticketsContainer = document.getElementById('tpwl-tickets');
        
        console.log('Checking widget containers:', {
          searchContainer: !!searchContainer,
          ticketsContainer: !!ticketsContainer,
          searchChildren: searchContainer?.children?.length || 0,
          ticketsChildren: ticketsContainer?.children?.length || 0
        });

        // Check for various indicators that the widget is loaded
        const hasWidgetContent = 
          (searchContainer && searchContainer.children.length > 0) ||
          (ticketsContainer && ticketsContainer.children.length > 0) ||
          document.querySelector('[class*="tpwl"]') !== null ||
          document.querySelector('[id*="tpwl"]') !== null ||
          document.querySelector('[class*="travelpayouts"]') !== null ||
          document.querySelector('[class*="skyscanner"]') !== null;

        if (hasWidgetContent) {
          console.log('Widget content detected, hiding loading state');
          setIsLoading(false);
          setWidgetLoaded(true);
          passUrlParamsToWidget();
          // Nudge layout engines in case the widget needs a resize to become visible
          try { window.dispatchEvent(new Event('resize')); } catch {}
          setTimeout(() => { try { window.dispatchEvent(new Event('resize')); } catch {} }, 500);
          return true;
        }

        return false;
      };

      // Try multiple times with increasing delays
      let attempts = 0;
      const maxAttempts = 10;
      
      const attemptWidgetInit = () => {
        attempts++;
        console.log(`Widget initialization attempt ${attempts}/${maxAttempts}`);
        
        if (checkWidgetInitialization()) {
          return; // Widget found, stop trying
        }
        
        if (attempts >= maxAttempts) {
          console.log('Max attempts reached, showing widget anyway');
          setIsLoading(false);
          setWidgetLoaded(true);
          passUrlParamsToWidget();
          return;
        }
        
        // Try again with exponential backoff
        const delay = Math.min(1000 * Math.pow(1.5, attempts - 1), 5000);
        setTimeout(attemptWidgetInit, delay);
      };

      // Start the initialization process
      setTimeout(attemptWidgetInit, 500);

      // Also set up a continuous check for the widget
      const continuousCheck = setInterval(() => {
        if (!widgetLoaded && !isLoading && !hasError) {
          const searchContainer = document.getElementById('tpwl-search');
          const ticketsContainer = document.getElementById('tpwl-tickets');
          
          const hasWidgetContent = 
            (searchContainer && searchContainer.children.length > 0) ||
            (ticketsContainer && ticketsContainer.children.length > 0) ||
            document.querySelector('[class*="tpwl"]') !== null ||
            document.querySelector('[id*="tpwl"]') !== null ||
            document.querySelector('[class*="travelpayouts"]') !== null ||
            document.querySelector('[class*="skyscanner"]') !== null;

          if (hasWidgetContent) {
            console.log('Widget detected in continuous check');
            setWidgetLoaded(true);
            clearInterval(continuousCheck);
            try { window.dispatchEvent(new Event('resize')); } catch {}
          }
        }
      }, 2000); // Check every 2 seconds

      // Clean up the continuous check after 30 seconds
      setTimeout(() => {
        clearInterval(continuousCheck);
      }, 30000);
    };

    const passUrlParamsToWidget = () => {
      // Extract search parameters from URL
      const origin = searchParams.get('origin');
      const destination = searchParams.get('destination');
      const departureDate = searchParams.get('departureDate');
      const returnDate = searchParams.get('returnDate');
      const adults = searchParams.get('adults');
      const children = searchParams.get('children');
      const infantsInSeat = searchParams.get('infantsInSeat');
      const infantsOnLap = searchParams.get('infantsOnLap');
      const cabinClass = searchParams.get('cabinClass');
      const tripType = searchParams.get('tripType');

      // If we have search parameters, try to pass them to the widget
      if (origin && destination && departureDate) {
        console.log('Passing search parameters to widget:', {
          origin, destination, departureDate, returnDate, adults, children, cabinClass, tripType
        });

        // Try to trigger a search in the widget if it supports it
        // This is a fallback approach - the widget might handle URL parameters automatically
        setTimeout(() => {
          // Look for search form elements in the widget and populate them
          const originInput = document.querySelector('input[placeholder*="From"], input[placeholder*="Origin"], input[name*="origin"]') as HTMLInputElement;
          const destinationInput = document.querySelector('input[placeholder*="To"], input[placeholder*="Destination"], input[name*="destination"]') as HTMLInputElement;
          const dateInput = document.querySelector('input[type="date"], input[placeholder*="Date"]') as HTMLInputElement;

          if (originInput) {
            originInput.value = origin;
            originInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          if (destinationInput) {
            destinationInput.value = destination;
            destinationInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          if (dateInput && departureDate) {
            dateInput.value = departureDate;
            dateInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }, 2000);
      }
    };

    const handleScriptError = (error: any) => {
      console.error('Travel widget script error:', error);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsLoading(false);
      setHasError(true);
      setShowFallback(true);
    };

    loadWidget();

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (scriptElement) {
        scriptElement.removeEventListener('load', triggerWidgetInit);
        scriptElement.removeEventListener('error', handleScriptError);
        // Do not remove the script node on unmount to avoid double-add in StrictMode
      }
    };
  }, [retryCount, searchParams]); // Re-run when retry count or search params change

  const handleFallbackSearch = () => {
    if (!origin || !destination || !departureDate) {
      return;
    }

    const params = new URLSearchParams({
      origin,
      destination,
      departureDate: departureDate.toISOString().split('T')[0],
      tripType,
      adults: '1',
      children: '0',
      infantsInSeat: '0',
      infantsOnLap: '0',
      cabinClass: 'economy'
    });

    if (tripType === 'roundtrip' && returnDate) {
      params.append('returnDate', returnDate.toISOString().split('T')[0]);
    }

    // Navigate to the internal booking system as fallback
    navigate(`/${i18n.language}/booking/internal-flights?${params.toString()}`);
  };

  const handleManualWidgetTrigger = () => {
    console.log('Manual widget trigger activated');
    setRetryCount(prev => prev + 1);
    
    // Also try to force widget detection immediately
    const searchContainer = document.getElementById('tpwl-search');
    const ticketsContainer = document.getElementById('tpwl-tickets');
    
    const hasWidgetContent = 
      (searchContainer && searchContainer.children.length > 0) ||
      (ticketsContainer && ticketsContainer.children.length > 0) ||
      document.querySelector('[class*="tpwl"]') !== null ||
      document.querySelector('[id*="tpwl"]') !== null ||
      document.querySelector('[class*="travelpayouts"]') !== null ||
      document.querySelector('[class*="skyscanner"]') !== null;

    if (hasWidgetContent) {
      console.log('Widget found in manual trigger');
      setWidgetLoaded(true);
    }
  };

  return (
    <>
      <SEO
        title={t("title", "Cheap Flights That Make You Smile ✈️ | Compare Airfares & Travel Deals")}
        description={t(
          "description",
          "Find laughably good flight deals. Compare airfares from hundreds of airlines and travel sites with ZapAround to save big on your next trip."
        )}
        keywords="cheap flights, flight deals, compare airfares, airline tickets, budget travel, travel comparison, flight search, travelpayouts"
        url={`/${language}/travel-flight`}
        locale={locale}
        breadcrumbs={[
          { name: t("breadcrumbs.home", "Home"), url: `/${language}/` },
          { name: t("breadcrumbs.flights", "Flights"), url: `/${language}/travel-flight` }
        ]}
        preconnectDomains={[
          "https://tpwgts.com"
        ]}
        dnsPrefetch={[
          "https://tpwgts.com"
        ]}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "TravelAction",
          agent: {
            "@type": "Organization",
            name: "ZapAround",
          },
          provider: {
            "@type": "Organization",
            name: "Travelpayouts",
          },
        }}
      />

      {/* Remove duplicate inline loader to prevent double init and ensure config is respected */}
      {/* <Helmet>
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
          })();
        `}</script>
      </Helmet> */}

      <main className="container mx-auto max-w-6xl px-4 py-12 md:py-20">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4 bg-[#61936f]/15 text-[#61936f] border-[#61936f]/30 inline-flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            {t("badge", "Flight Finder")}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-[#030303] mb-3">
            {t("heading", "Deals so good, even your luggage smiles ✈️")}
          </h1>
          <p className="text-base md:text-lg text-[#62626a] max-w-2xl mx-auto">
            {t("subheading", "Compare fares from hundreds of airlines and score wallet-happy tickets in seconds.")}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#61936f]" />
            <p className="text-lg text-[#62626a]">Loading flight search widget...</p>
            <p className="text-sm text-[#62626a]">Please wait while we connect to our travel partners</p>
          </div>
        )}

        {/* Error State with Fallback */}
        {hasError && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h2 className="text-xl font-semibold text-[#1d1d1e]">Unable to load flight search</h2>
            <p className="text-[#62626a] text-center max-w-md">
              We're having trouble loading the flight search widget. You can try again or use our alternative search.
            </p>
            <div className="flex gap-4">
              <Button 
                onClick={() => setRetryCount(prev => prev + 1)}
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                onClick={() => setShowFallback(true)}
                className="bg-[#61936f] hover:bg-[#4a7c59] text-white"
              >
                <Search className="h-4 w-4 mr-2" />
                Use Alternative Search
              </Button>
            </div>
          </div>
        )}

        {/* Widget Not Loading State */}
        {!isLoading && !hasError && !showFallback && !widgetLoaded && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-[#1d1d1e] mb-2">Widget Not Loading?</h2>
              <p className="text-[#62626a] mb-4">
                If you don't see the flight search widget, try clicking the button below to manually load it.
              </p>
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={handleManualWidgetTrigger}
                  className="bg-[#61936f] hover:bg-[#4a7c59] text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Widget
                </Button>
                <Button 
                  onClick={() => setShowFallback(true)}
                  variant="outline"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Use Alternative Search
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Fallback Search Form */}
        {showFallback && (
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <Plane className="h-12 w-12 text-[#61936f] mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-[#1d1d1e] mb-2">Flight Search</h2>
              <p className="text-[#62626a]">Search for flights using our alternative booking system</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Trip Type */}
              <div className="lg:col-span-4 mb-4">
                <div className="flex gap-2">
                  <Button
                    variant={tripType === 'roundtrip' ? 'default' : 'outline'}
                    onClick={() => setTripType('roundtrip')}
                    className="flex-1"
                  >
                    Round Trip
                  </Button>
                  <Button
                    variant={tripType === 'oneway' ? 'default' : 'outline'}
                    onClick={() => setTripType('oneway')}
                    className="flex-1"
                  >
                    One Way
                  </Button>
                </div>
              </div>

              {/* Origin */}
              <div>
                <label className="block text-sm font-medium text-[#1d1d1e] mb-2">From</label>
                <Input
                  placeholder="Airport code (e.g., LAX)"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                  className="w-full"
                />
              </div>

              {/* Destination */}
              <div>
                <label className="block text-sm font-medium text-[#1d1d1e] mb-2">To</label>
                <Input
                  placeholder="Airport code (e.g., JFK)"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value.toUpperCase())}
                  className="w-full"
                />
              </div>

              {/* Departure Date */}
              <div>
                <label className="block text-sm font-medium text-[#1d1d1e] mb-2">Departure</label>
                <Popover open={isDepartureDateOpen} onOpenChange={setIsDepartureDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !departureDate && "text-muted-foreground"
                      )}
                    >
                      {departureDate ? format(departureDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={departureDate}
                      onSelect={(date) => {
                        setDepartureDate(date);
                        setIsDepartureDateOpen(false);
                        if (tripType === 'roundtrip') {
                          setIsReturnDateOpen(true);
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Return Date */}
              {tripType === 'roundtrip' && (
                <div>
                  <label className="block text-sm font-medium text-[#1d1d1e] mb-2">Return</label>
                  <Popover open={isReturnDateOpen} onOpenChange={setIsReturnDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !returnDate && "text-muted-foreground"
                        )}
                      >
                        {returnDate ? format(returnDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={returnDate}
                        onSelect={(date) => {
                          setReturnDate(date);
                          setIsReturnDateOpen(false);
                        }}
                        disabled={(date) => date < (departureDate || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            <div className="text-center">
              <Button 
                onClick={handleFallbackSearch}
                disabled={!origin || !destination || !departureDate}
                className="bg-[#61936f] hover:bg-[#4a7c59] text-white px-8 py-3"
              >
                <Search className="h-5 w-5 mr-2" />
                Search Flights
              </Button>
            </div>
          </div>
        )}

        {/* Travelpayouts White-Label Widgets - keep containers mounted so script can initialize */}
        <section className={"space-y-12"}>
          {/* Metasearch widget with Shadow Square */}
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

          {/* Search results widget with Shadow Square */}
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
                <div id="tpwl-tickets"></div>
              </div>
              
              {/* Decorative Corner Elements */}
              <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#61936f]/30 rounded-tl-2xl"></div>
              <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#61936f]/30 rounded-tr-2xl"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#61936f]/30 rounded-bl-2xl"></div>
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#61936f]/30 rounded-br-2xl"></div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
