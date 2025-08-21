import React from 'react';
import { BrowserDemo } from '@/components/ui/browser-demo';

/**
 * Test page for the browser service
 * Access this page to test the @capacitor/browser integration
 */
export default function BrowserTest() {
  return (
    <div className="min-h-screen bg-background">
      <BrowserDemo />
    </div>
  );
}
