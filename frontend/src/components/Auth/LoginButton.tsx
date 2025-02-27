import { useAuth0 } from '@auth0/auth0-react';
import { useLocation } from 'react-router-dom';

export const LoginButton = () => {
    const { loginWithRedirect, isAuthenticated } = useAuth0();
    const location = useLocation();

    if (isAuthenticated) {
        return null;
    }

    return (
        <button
            onClick={() => loginWithRedirect({
                appState: { returnTo: location.pathname === '/login' ? '/plans' : location.pathname }
            })}
        >
            Sign In
        </button>
    );
}; 