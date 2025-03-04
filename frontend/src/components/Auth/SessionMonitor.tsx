import { FC, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

// How often to check the token (in milliseconds)
const CHECK_INTERVAL = 60000; // Check every minute

export const SessionMonitor: FC = () => {
  const { getAccessTokenSilently, loginWithRedirect, isAuthenticated } = useAuth0();
  const checkIntervalRef = useRef<number | null>(null);

  const checkSession = async () => {
    if (!isAuthenticated) return;
    
    try {
      // Try to get a new token silently
      await getAccessTokenSilently({
        detailedResponse: true,
      });
    } catch (error) {
      console.error('Session check failed:', error);
      
      // If the error indicates session expiration, redirect to login
      if (
        error instanceof Error && 
        (error.message.includes('login_required') || 
         error.message.includes('expired') ||
         error.message.includes('Invalid token'))
      ) {
        console.log('Auth session expired during periodic check, redirecting to login...');
        loginWithRedirect({
          appState: { returnTo: window.location.pathname }
        });
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Initial check
      checkSession();
      
      // Set up periodic checks
      checkIntervalRef.current = window.setInterval(checkSession, CHECK_INTERVAL);
      
      return () => {
        // Clean up interval on unmount
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
      };
    }
  }, [isAuthenticated]);

  // This component doesn't render anything visible
  return null;
};