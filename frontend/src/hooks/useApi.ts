import { useAuth0 } from '@auth0/auth0-react';
import { createApiClient } from '../services/lessonPlanService';
import { useUserProfile } from './useUserProfile';
import { useMemo } from 'react';

export const useApi = () => {
    const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
    const { userProfile } = useUserProfile();
    
    const api = useMemo(() => {
        return createApiClient(async () => {
            try {
                const token = await getAccessTokenSilently({
                    authorizationParams: {
                        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
                        scope: 'openid profile email offline_access'
                    }
                });
                console.debug('Token retrieved successfully');
                return token;
            } catch (error) {
                console.error('Error getting access token:', error);
                
                // Handle session timeout/expiration errors
                if (
                    error instanceof Error && 
                    (error.message.includes('login_required') || 
                     error.message.includes('expired') ||
                     error.message.includes('Invalid token') ||
                     error.message.includes('Missing Refresh Token'))
                ) {
                    console.log('Auth session expired or invalid, redirecting to login...');
                    loginWithRedirect({
                        appState: { returnTo: window.location.pathname }
                    });
                }
                
                throw error;
            }
        }, userProfile || undefined);
    }, [getAccessTokenSilently, loginWithRedirect, userProfile]);

    return api;
};