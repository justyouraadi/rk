import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '@/api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [appPublicSettings, setAppPublicSettings] = useState({ id: 'rk-printers-app', public_settings: {} });

    useEffect(() => {
        checkUserAuth();
    }, []);

    const checkUserAuth = async () => {
        try {
            setIsLoadingAuth(true);
            setAuthError(null);

            const token = api.auth.getToken();
            const storedUser = typeof window !== 'undefined' ? localStorage.getItem('rk_user') : null;

            if (!token && !storedUser) {
                setUser(null);
                setIsAuthenticated(false);
                setIsLoadingAuth(false);
                setAuthChecked(true);
                return;
            }

            const currentUser = await api.auth.me();
            if (currentUser) {
                setUser(currentUser);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('User auth check failed:', error);
            setUser(null);
            setIsAuthenticated(false);
            setAuthError({
                type: 'auth_required',
                message: error.message || 'Authentication required',
            });
        } finally {
            setIsLoadingAuth(false);
            setAuthChecked(true);
        }
    };

    const logout = (shouldRedirect = true) => {
        setUser(null);
        setIsAuthenticated(false);
        api.auth.logout();

        if (shouldRedirect && typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    };

    const navigateToLogin = () => {
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isLoadingAuth,
                isLoadingPublicSettings,
                authError,
                appPublicSettings,
                logout,
                navigateToLogin,
                checkAppState: checkUserAuth,
                authChecked,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
