interface Auth0Config {
    domain: string;
    clientId: string;
    clientSecret: string;
    audience: string;
    redirectUri: string;
    scope: string;
}

export const auth0Config: Auth0Config = {
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
    clientSecret: import.meta.env.VITE_AUTH0_CLIENT_SECRET,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
    redirectUri: window.location.origin,
    scope: 'openid profile email'
}; 