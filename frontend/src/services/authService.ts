import { Auth0Client } from '@auth0/auth0-spa-js';

const auth0Client = new Auth0Client({
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
    authorizationParams: {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
    },
    cacheLocation: 'localstorage',
    useRefreshTokens: true
});

export const getAccessToken = async () => {
    try {
        const token = await auth0Client.getTokenSilently();
        return token;
    } catch (error) {
        console.error('Error getting access token:', error);
        
        // Check if token is expired or login is required
        if (
            error instanceof Error && 
            (error.message.includes('login_required') || 
             error.message.includes('expired') ||
             error.message.includes('Invalid token'))
        ) {
            // Redirect to Auth0 login
            auth0Client.loginWithRedirect({
                authorizationParams: {
                    redirect_uri: window.location.origin
                }
            });
        }
        
        return null;
    }
};