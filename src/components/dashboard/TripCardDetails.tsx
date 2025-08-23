import { format, isValid, parseISO } from 'date-fns';
import { enUS, fr, es } from 'date-fns/locale';
import { Calendar, MapPin } from 'lucide-react';
import { TripContentPreview } from './TripContentPreview';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { TravelAnimation } from './TravelAnimation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

interface TripCardDetailsProps {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string | null;
  aiContent: string | null;
  tripType?: string | null;
  isAiContentLoading?: boolean;
  zapOutDate?: string;
}

// Secure HTML parser for anchor tags only
const parseSecureLinks = (htmlString: string): React.ReactNode[] => {
  try {
    // Create a temporary DOM element to safely parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    
    const result: React.ReactNode[] = [];
    let currentIndex = 0;
    
    // Process child nodes
    for (let i = 0; i < tempDiv.childNodes.length; i++) {
      const node = tempDiv.childNodes[i];
      
      if (node.nodeType === Node.TEXT_NODE) {
        // Text node - add as is
        const text = node.textContent || '';
        if (text.trim()) {
          result.push(text);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        
        if (element.tagName.toLowerCase() === 'a') {
          // Anchor tag - extract attributes safely
          const href = element.getAttribute('href');
          const className = element.getAttribute('class') || '';
          const textContent = element.textContent || '';
          
          // Validate href is a safe internal route
          if (href && isValidInternalRoute(href)) {
            result.push(
              <Link
                key={`link-${currentIndex++}`}
                to={href}
                className={className}
                onClick={(e) => e.stopPropagation()}
              >
                {textContent}
              </Link>
            );
          } else {
            // If href is invalid, just render the text content
            result.push(textContent);
          }
        } else {
          // Non-anchor elements - just render text content
          result.push(element.textContent || '');
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing secure links:', error);
    // Fallback: return the original string as plain text
    return [htmlString];
  }
};

// Validate that the href is a safe internal route
const isValidInternalRoute = (href: string): boolean => {
  // Only allow internal routes that start with /
  // This prevents external URLs, javascript:, data:, etc.
  return href.startsWith('/') && !href.includes('javascript:') && !href.includes('data:');
};

export const TripCardDetails = ({ 
  title, 
  description, 
  startDate, 
  endDate, 
  location, 
  aiContent,
  tripType,
  isAiContentLoading = false,
  zapOutDate
}: TripCardDetailsProps) => {
  const { t, i18n } = useTranslation('trip');
  const isZapOut = tripType === 'ZapOut';
  const isZapRoad = tripType === 'ZapRoad';
  
  // State for random wait message
  const [waitMessage, setWaitMessage] = useState<string>('Loading travel information...');
  // Ref to store all available messages
  const messagesRef = useRef<string[]>([]);
  // Ref to track used message indices to avoid immediate repetition
  const usedIndicesRef = useRef<number[]>([]);
  // Ref for the interval timer
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to select a random message that hasn't been used recently
  const selectRandomMessage = useCallback(() => {
    const messages = messagesRef.current;
    if (!messages.length) return;
    
    // If we've used all messages, reset the used indices
    if (usedIndicesRef.current.length >= messages.length - 1) {
      usedIndicesRef.current = [];
    }
    
    // Get available indices (not recently used)
    const availableIndices = Array.from(
      { length: messages.length }, 
      (_, i) => i
    ).filter(i => !usedIndicesRef.current.includes(i));
    
    // Select a random index from available ones
    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    
    // Add to used indices
    usedIndicesRef.current.push(randomIndex);
    
    // Set the new message
    setWaitMessage(messages[randomIndex]);
  }, []);
  
  // Function to start the message rotation
  const startMessageRotation = useCallback(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Set new interval to change message every 4 seconds
    intervalRef.current = setInterval(() => {
      selectRandomMessage();
    }, 4000);
  }, [selectRandomMessage]);
  
  // Load all available messages
  useEffect(() => {
    try {
      // Get the array of wait messages
      let messages;
      try {
        messages = t('trip.aiContent.waitMessages', { returnObjects: true });
      } catch (e) {
        console.warn("Failed with trip.aiContent.waitMessages, trying alternative format");
      }
      
      if (!Array.isArray(messages) || messages.length === 0) {
        try {
          messages = t('trip:aiContent.waitMessages', { returnObjects: true });
        } catch (e) {
          console.warn("Failed with trip:aiContent.waitMessages");
        }
      }
      
      // Hardcoded fallback messages in case translations fail
      const fallbackMessages = [
        t('aiContent.waitMessages.0'),
        t('aiContent.waitMessages.1'),
        t('aiContent.waitMessages.2'),
        t('aiContent.waitMessages.3'),
        t('aiContent.waitMessages.4'),
        t('aiContent.waitMessages.5'),
        t('aiContent.waitMessages.6'),
        t('aiContent.waitMessages.7'),
        t('aiContent.waitMessages.8'),
        t('aiContent.waitMessages.9')
      ];
      
      // Use the messages if they're valid, otherwise use fallbacks
      const validMessages = Array.isArray(messages) && messages.length > 0 
        ? messages.filter(msg => typeof msg === 'string')
        : fallbackMessages;
      
      // Store all valid messages in the ref
      messagesRef.current = validMessages;
      
      // Set initial message
      selectRandomMessage();
    } catch (error) {
      console.error("Error loading wait messages:", error);
      // Set fallback messages
      messagesRef.current = [
        t('aiContent.waitMessages.0'),
        t('aiContent.waitMessages.1'),
        t('aiContent.waitMessages.2')
      ];
      selectRandomMessage();
    }
    
    // Start the interval to change messages
    startMessageRotation();
    
    // Clean up interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [t, i18n.language, selectRandomMessage, startMessageRotation]);
  
  // Effect to handle loading state changes
  useEffect(() => {
    if (isAiContentLoading) {
      // Start rotating messages when loading
      startMessageRotation();
    } else {
      // Stop rotating messages when not loading
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAiContentLoading, startMessageRotation]);
  
  // Safely format date
  const formatSafeDate = (dateString: string | null | undefined) => {
    try {
      if (!dateString) return '';
      const date = parseISO(dateString);
      if (isValid(date)) {
        let locale = enUS;
        if (i18n.language === 'fr') locale = fr;
        else if (i18n.language === 'es') locale = es;
        return format(date, 'PPP', { locale });
      }
      return dateString;
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return '';
    }
  };

  // Helper function to safely get translations with fallbacks
  const safeTranslate = (key: string, fallback: string): string => {
    try {
      const translation = t(key);
      // Check if the translation is the same as the key (indicating it wasn't found)
      return translation === key ? fallback : translation;
    } catch (e) {
      console.warn(`Translation failed for key: ${key}, using fallback`);
      return fallback;
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{title}</h3>
      </div>
      
      <div className="text-sm text-gray-500 line-clamp-2 mb-3">
        {description}
      </div>
      
      {isAiContentLoading && (
        <div className="mb-4">
          <div className="bg-gradient-to-r from-emerald-700/60 to-emerald-800/60 rounded-lg p-3 border border-emerald-600/50 shadow-lg shadow-emerald-700/25">
            <p className="text-sm text-emerald-50 font-medium flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
              {t('aiContent.emailNotification', 'We\'ll send you an email when your adventure is ready! ✨')}
            </p>
          </div>
        </div>
      )}

      {!isAiContentLoading && (
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <Calendar className="h-4 w-4 mr-1" />
          <span className="font-medium mr-2">
            {tripType === 'ZapOut'
              ? t('types.zapOut.when')
              : tripType === 'ZapRoad'
                ? t('types.zapRoad.dates')
                : t('form.date')}
          </span>
          <span>{
            tripType === 'ZapOut' && zapOutDate
              ? formatSafeDate(zapOutDate)
              : formatSafeDate(startDate)
          }</span>
          {tripType !== 'ZapOut' && endDate && endDate !== startDate && (
            <>
              <span className="mx-1">-</span>
              <span>{formatSafeDate(endDate)}</span>
            </>
          )}
        </div>
      )}
      
      {location && !isAiContentLoading && (
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="line-clamp-1">{location}</span>
        </div>
      )}
      
      {isAiContentLoading ? (
        <div className="mt-4 p-5 bg-gradient-to-br from-blue-900/60 to-indigo-900/60 rounded-xl border border-blue-700/20 relative shadow-lg shadow-blue-900/10 backdrop-blur-sm min-h-[16rem] h-[16rem]">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-blue-100 flex items-center">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></span>
              {t('aiContent.travelTips')}
            </h3>
          </div>
          
          {/* Travel animation */}
          <div className="my-3 h-12">
            <TravelAnimation />
          </div>
          
          {/* Waiting message with links */}
          <div className="mt-4 text-center h-[8rem] flex items-center justify-center mb-3 px-2">
            <div className="text-sm font-medium text-blue-50 whitespace-normal break-words px-5 py-2 rounded-lg bg-white/15 inline-block shadow-inner shadow-blue-500/10 transition-all duration-500 leading-relaxed border border-white/15 max-w-[90%]">
              <div className="mb-3">
                <p className="text-blue-50">{waitMessage}</p>
              </div>
              <div className="text-xs text-blue-200">
                {parseSecureLinks(
                  t('aiContent.waitingMessage', 'While you\'re waiting, visit the ZapMap, travel blogs or the Community!')
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-full bg-white/10 rounded-md" />
            <Skeleton className="h-4 w-3/4 bg-white/10 rounded-md" />
          </div>
        </div>
      ) : (
        aiContent && <TripContentPreview content={aiContent} />
      )}
    </div>
  );
};
