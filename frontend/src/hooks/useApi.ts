import { useAuth0 } from '@auth0/auth0-react';
import { createApiClient } from '../services/lessonPlanService';
import { useUserProfile } from './useUserProfile';
import { useMemo, useEffect } from 'react';

export const useApi = () => {
    const { getAccessTokenSilently, loginWithRedirect, isAuthenticated } = useAuth0();
    const { userProfile } = useUserProfile();
    
    // Handle initial authentication check
    useEffect(() => {
        if (!isAuthenticated) {
            localStorage.clear();
            const currentPath = window.location.pathname;
            if (currentPath !== '/login') {
                loginWithRedirect({
                    appState: { returnTo: currentPath }
                });
            }
        }
    }, [isAuthenticated, loginWithRedirect]);
    
    const api = useMemo(() => {
        return createApiClient(async () => {
            try {
                const token = await getAccessTokenSilently({
                    authorizationParams: {
                        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
                        scope: 'openid profile email'
                    }
                });
                console.debug('Token retrieved successfully');
                return token;
            } catch (error) {
                console.error('Error getting access token:', error);
                
                
                // clear local storage
                localStorage.clear();
                
                // Handle any auth error by redirecting to login
                console.log('Auth error, redirecting to login...');
                const currentPath = window.location.pathname;
                loginWithRedirect({
                    appState: { returnTo: currentPath }
                });
                
                // Return a rejected promise to prevent further API calls
                return Promise.reject(new Error('Authentication required'));
            }
        }, userProfile || undefined);
    }, [getAccessTokenSilently, loginWithRedirect, userProfile, isAuthenticated]);

    return api;
};