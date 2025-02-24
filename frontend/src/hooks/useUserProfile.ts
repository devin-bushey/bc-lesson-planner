import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';

export interface UserProfile {
    sub: string;
    email: string;
    name: string;
    picture: string;
}

export const useUserProfile = () => {
    const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        if (isAuthenticated && user) {
            setUserProfile({
                sub: user.sub as string,
                email: user.email as string,
                name: user.name as string,
                picture: user.picture as string,
            });
        }
    }, [isAuthenticated, user]);

    return { userProfile };
}; 