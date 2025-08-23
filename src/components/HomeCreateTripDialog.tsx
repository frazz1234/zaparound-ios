import React, { useRef, useEffect } from 'react';
import CreateTrip from '@/pages/create-trip';

interface HomeCreateTripDialogProps {
  session: any;
}

// This component simply embeds the full CreateTrip wizard directly on the page
// with minimal wrapper styling. It no longer provides a button or popup dialog.
export function HomeCreateTripDialog({ session }: HomeCreateTripDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Function to scroll the embedded component into view and center it
  const scrollToComponent = () => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  };



  // Listen for step changes and focus the component
  useEffect(() => {
    const handleStepChange = () => {
      // Small delay to ensure the new step content is rendered
      setTimeout(scrollToComponent, 100);
    };

    // Listen for custom events that indicate step changes
    window.addEventListener('trip-step-changed', handleStepChange);

    return () => {
      window.removeEventListener('trip-step-changed', handleStepChange);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-5xl mx-auto mt-2 md:mt-9 [&>div]:!bg-transparent [&_.step-indicator]:hidden [&_.hero-card]:!bg-transparent"
      style={{
        '--zaptrip-text': '"Travel"',
        '--zaproad-text': '"Road Trip"', 
        '--zapout-text': '"Hangout"'
      } as React.CSSProperties}
    >
      <CreateTrip session={session} embedded={true} />
    </div>
  );
} 