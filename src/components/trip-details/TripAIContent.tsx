import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';
import type { Components } from 'react-markdown';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

interface TripAIContentProps {
  content: string | null;
  isLoading?: boolean;
  tripType?: string;
}

type MarkdownComponentProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;

// Helper to parse custom trip content tags
function parseCustomTripContent(content: string) {
  const startTripMatch = content.match(/\[START_TRIP\]([\s\S]*?)\[\/START_TRIP\]/i);
  const endTripMatch = content.match(/\[END_TRIP\]([\s\S]*?)\[\/END_TRIP\]/i);
  const dayMatches = [...content.matchAll(/\[DAY (\d+)\]([\s\S]*?)\[\/DAY\]/gi)];

  const startTrip = startTripMatch ? startTripMatch[1].trim() : null;
  const endTrip = endTripMatch ? endTripMatch[1].trim() : null;
  const days = dayMatches.map(match => ({
    title: `Day ${match[1]}`,
    body: match[2].trim(),
  }));

  return { startTrip, days, endTrip };
}

export function TripAIContent({ content, isLoading = false, tripType }: TripAIContentProps) {
  const { t, i18n } = useTranslation('trip');

  // Parse custom tag content
  const { startTrip, days, endTrip } = parseCustomTripContent(content || '');

  // Build section keys
  const sectionKeys: string[] = [];
  if (startTrip) sectionKeys.push('startTrip');
  days.forEach((_, idx) => sectionKeys.push(`day-${idx}`));
  if (endTrip) sectionKeys.push('endTrip');

  // State for collapsible sections
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});

  // Initialize openSections on first render/content change
  useEffect(() => {
    const initial: { [key: string]: boolean } = {};
    sectionKeys.forEach(key => { initial[key] = false; });
    if (startTrip) initial['startTrip'] = true;
    setOpenSections(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  if (isLoading) {
    return (
      <div className="mt-8 p-6 bg-[#fcfcfc] rounded-xl">
        <h2 className="text-xl font-semibold text-[#030303] mb-4"></h2>
        <div className="space-y-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      </div>
    );
  }

  if (!content) return null;

  // Helper to toggle a section
  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper to check if a section is open (default: open)
  const isOpen = (key: string) => openSections[key] !== false;

  const components: Components = {
    p: ({ children }) => (
      <p className="mb-4 leading-relaxed text-[#030303] break-words">{children}</p>
    ),
    strong: ({ children }) => (
      <strong className="font-bold text-[#1d1d1e] break-words">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic text-[#62626a] break-words">{children}</em>
    ),
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold text-[#1d1d1e] mt-6 mb-4 break-words">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-bold text-[#1d1d1e] mt-5 mb-3 break-words">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-bold text-[#1d1d1e] mt-4 mb-2 break-words">{children}</h3>
    ),
    ul: ({ children }) => (
      <ul className="list-disc pl-6 mb-4 space-y-2 text-[#030303] break-words">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-2 text-[#030303] break-words">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="text-[#62626a] break-words">{children}</li>
    ),
    code: ({ children, className }) => {
      const isInline = !className;
      return isInline ? (
        <code className="px-1.5 py-0.5 bg-[#f3f3f3] rounded text-sm font-mono text-[#1d1d1e] break-words">
          {children}
        </code>
      ) : (
        <code className="block bg-[#f3f3f3] p-4 rounded-lg overflow-x-auto font-mono text-sm text-[#1d1d1e] break-words">
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="mb-4 overflow-x-auto break-words">{children}</pre>
    ),
    a: ({ children, href }) => (
      <a
        href={href}
        className="text-[#61936f] hover:text-[#1d1d1e] underline transition-colors break-words"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-[#61936f] pl-4 italic text-[#62626a] mb-4 bg-[#f3f3f3] rounded break-words">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-8 border-t border-[#e5e5e5]" />,
  };

  // If any sections are found, render StartTrip, days, EndTrip in order
  if (startTrip || days.length > 0 || endTrip) {
    let timelineIdx = 0;
    return (
      <div className="mt-8 flex flex-col items-center relative w-full max-w-full overflow-hidden px-0" style={{ minWidth: 0 }}>
        {/* StartTrip section */}
        {startTrip && (
          <div className="w-full flex items-stretch relative mb-8" style={{ minWidth: 0 }}>
            <div className="flex flex-col items-center mr-2 sm:mr-4 flex-shrink-0">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#61936f] border-4 border-[#fcfcfc] shadow-lg z-10 mt-2" />
            </div>
            <Card className="flex-1 bg-[#fcfcfc] border-[#e5e5e5] shadow-lg min-w-0 overflow-hidden" style={{ minWidth: 0 }}>
              <button
                className="w-full flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 focus:outline-none focus:ring-2 focus:ring-[#61936f] group"
                onClick={() => toggleSection('startTrip')}
                aria-expanded={isOpen('startTrip')}
                aria-controls="startTrip-content"
                type="button"
              >
                <span className="text-base sm:text-lg md:text-xl font-bold text-[#1d1d1e] truncate pr-2">
                  {(tripType === 'ZapTrip' || tripType === 'ZapRoad')
                    ? t('aiContent.zapTripStart', 'The beginning Of your Adventure')
                    : t('aiContent.zapTripStart', 'The beginning Of your Adventure')}
                </span>
                <ChevronDown
                  className={`ml-2 h-4 w-4 sm:h-5 sm:w-5 text-[#61936f] transition-transform duration-200 flex-shrink-0 ${isOpen('startTrip') ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              <div
                id="startTrip-content"
                className={`overflow-hidden transition-all duration-300 ${isOpen('startTrip') ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}
                aria-hidden={!isOpen('startTrip')}
              >
                <CardContent className="px-3 sm:px-4 md:px-6">
                  <article className="prose prose-sm max-w-none text-[#030303] overflow-hidden">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                      {startTrip}
                    </ReactMarkdown>
                  </article>
                </CardContent>
              </div>
            </Card>
          </div>
        )}
        {/* Days timeline */}
        {days.map((day, idx) => (
          <div key={idx} className="w-full flex items-stretch relative mb-8 last:mb-0" style={{ minWidth: 0 }}>
            <div className="flex flex-col items-center mr-2 sm:mr-4 flex-shrink-0">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#61936f] border-4 border-[#fcfcfc] shadow-lg z-10 mt-2" />
              {idx < days.length - 1 && (
                <div className="w-1 bg-[#61936f] flex-1 min-h-[40px]" style={{ minHeight: 60 }} />
              )}
            </div>
            <Card className="flex-1 bg-[#fcfcfc] border-[#e5e5e5] shadow-lg min-w-0 overflow-hidden" style={{ minWidth: 0 }}>
              <button
                className="w-full flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 focus:outline-none focus:ring-2 focus:ring-[#61936f] group"
                onClick={() => toggleSection(`day-${idx}`)}
                aria-expanded={isOpen(`day-${idx}`)}
                aria-controls={`day-${idx}-content`}
                type="button"
              >
                <span className="text-base sm:text-lg md:text-xl font-bold text-[#1d1d1e] truncate pr-2">
                  {tripType === 'ZapOut'
                    ? t('aiContent.zapTripAdventure', { day: idx + 1, defaultValue: `Adventure ${idx + 1}` })
                    : t('aiContent.zapTripDay', { day: idx + 1, defaultValue: `Day ${idx + 1}` })}
                </span>
                <ChevronDown
                  className={`ml-2 h-4 w-4 sm:h-5 sm:w-5 text-[#61936f] transition-transform duration-200 flex-shrink-0 ${isOpen(`day-${idx}`) ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              <div
                id={`day-${idx}-content`}
                className={`overflow-hidden transition-all duration-300 ${isOpen(`day-${idx}`) ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}
                aria-hidden={!isOpen(`day-${idx}`)}
              >
                <CardContent className="px-3 sm:px-4 md:px-6">
                  <article className="prose prose-sm max-w-none text-[#030303] overflow-hidden">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                      {day.body}
                    </ReactMarkdown>
                  </article>
                </CardContent>
              </div>
            </Card>
          </div>
        ))}
        {/* EndTrip section */}
        {endTrip && (
          <div className="w-full flex items-stretch relative mb-8" style={{ minWidth: 0 }}>
            <div className="flex flex-col items-center mr-2 sm:mr-4 flex-shrink-0">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#61936f] border-4 border-[#fcfcfc] shadow-lg z-10 mt-2" />
            </div>
            <Card className="flex-1 bg-[#fcfcfc] border-[#e5e5e5] shadow-lg min-w-0 overflow-hidden" style={{ minWidth: 0 }}>
              <button
                className="w-full flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 focus:outline-none focus:ring-2 focus:ring-[#61936f] group"
                onClick={() => toggleSection('endTrip')}
                aria-expanded={isOpen('endTrip')}
                aria-controls="endTrip-content"
                type="button"
              >
                <span className="text-base sm:text-lg md:text-xl font-bold text-[#1d1d1e] truncate pr-2">
                  {(tripType === 'ZapTrip' || tripType === 'ZapRoad')
                    ? t('aiContent.zapTripEnd', 'Our Tips and more !')
                    : t('aiContent.zapTripEnd', 'Our Tips and more !')}
                </span>
                <ChevronDown
                  className={`ml-2 h-4 w-4 sm:h-5 sm:w-5 text-[#61936f] transition-transform duration-200 flex-shrink-0 ${isOpen('endTrip') ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              <div
                id="endTrip-content"
                className={`overflow-hidden transition-all duration-300 ${isOpen('endTrip') ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}
                aria-hidden={!isOpen('endTrip')}
              >
                <CardContent className="px-3 sm:px-4 md:px-6">
                  <article className="prose prose-sm max-w-none text-[#030303] overflow-hidden">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                      {endTrip}
                    </ReactMarkdown>
                  </article>
                </CardContent>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Fallback: render as a single card
  return (
    <div className="mt-8">
      <Card className="bg-[#fcfcfc] border-[#e5e5e5] shadow-lg">
        <CardContent>
          <article className="prose prose-sm max-w-none text-[#030303]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {content}
            </ReactMarkdown>
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
