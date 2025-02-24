import { useAuth0 } from '@auth0/auth0-react';
import { createApiClient } from '../services/lessonPlanService';
import { useUserProfile } from './useUserProfile';
import { useMemo } from 'react';

export const useApi = () => {
    const { getAccessTokenSilently } = useAuth0();
    const { userProfile } = useUserProfile();
    
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
                throw error;
            }
        }, userProfile || undefined);
    }, [getAccessTokenSilently, userProfile]);

    return api;
}; 