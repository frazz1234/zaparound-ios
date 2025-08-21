import { supabase } from './client';

const MAIN_DOMAIN = 'zaparound.com';
const ADMIN_DOMAIN = 'admin.zaparound.com';

export const setupCrossDomainAuth = async () => {
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    // Store the session in localStorage with a specific key for cross-domain access
    localStorage.setItem('zaparound_auth_session', JSON.stringify(session));
    
    // If we're on the main domain, redirect to admin with the session
    if (window.location.hostname === MAIN_DOMAIN) {
      const adminUrl = `https://${ADMIN_DOMAIN}?session=${encodeURIComponent(JSON.stringify(session))}`;
      window.location.href = adminUrl;
    }
  }
};

export const handleCrossDomainSession = async () => {
  // Check if we have a session in the URL (coming from main domain)
  const urlParams = new URLSearchParams(window.location.search);
  const sessionParam = urlParams.get('session');
  
  if (sessionParam) {
    try {
      const session = JSON.parse(decodeURIComponent(sessionParam));
      
      // Set the session in Supabase
      const { error } = await supabase.auth.setSession(session);
      
      if (!error) {
        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Store the session in localStorage
        localStorage.setItem('zaparound_auth_session', JSON.stringify(session));
      }
    } catch (error) {
      console.error('Error handling cross-domain session:', error);
    }
  } else {
    // Check if we have a stored session
    const storedSession = localStorage.getItem('zaparound_auth_session');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        await supabase.auth.setSession(session);
      } catch (error) {
        console.error('Error restoring stored session:', error);
      }
    }
  }
}; 