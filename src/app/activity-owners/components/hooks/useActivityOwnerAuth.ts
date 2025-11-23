'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { 
    ActivityOwner, 
    LoginCredentials, 
    OwnerSession,
    ApiResponse 
} from '@/types/activity-owner-types';

interface UseActivityOwnerAuthReturn {
    owner: ActivityOwner | null;
    session: OwnerSession | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
    verifyEmail: (token: string) => Promise<boolean>;
    verifyPhone: (code: string, phone: string) => Promise<boolean>;
    refreshToken: () => Promise<boolean>;
    error: string | null;
    clearError: () => void;
}

export function useActivityOwnerAuth(): UseActivityOwnerAuthReturn {
    const [owner, setOwner] = useState<ActivityOwner | null>(null);
    const [session, setSession] = useState<OwnerSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const isAuthenticated = !!(owner && session && new Date(session.expiresAt) > new Date());

    // Initialize auth state from localStorage
    useEffect(() => {
        const initAuth = async () => {
            try {
                const storedSession = localStorage.getItem('activityOwnerSession');
                const storedOwner = localStorage.getItem('activityOwner');

                if (storedSession && storedOwner) {
                    const session: OwnerSession = JSON.parse(storedSession);
                    const owner: ActivityOwner = JSON.parse(storedOwner);

                    // Check if session is still valid
                    if (new Date(session.expiresAt) > new Date()) {
                        setSession(session);
                        setOwner(owner);
                    } else {
                        // Try to refresh token
                        const refreshed = await refreshTokenInternal();
                        if (!refreshed) {
                            // Clear invalid session
                            localStorage.removeItem('activityOwnerSession');
                            localStorage.removeItem('activityOwner');
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to initialize auth:', error);
                localStorage.removeItem('activityOwnerSession');
                localStorage.removeItem('activityOwner');
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const login = useCallback(async (credentials: LoginCredentials) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/activity-owners/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data: ApiResponse<{ owner: ActivityOwner; session: OwnerSession }> = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            if (data.data) {
                const { owner, session } = data.data;
                
                setOwner(owner);
                setSession(session);
                
                // Store in localStorage
                localStorage.setItem('activityOwner', JSON.stringify(owner));
                localStorage.setItem('activityOwnerSession', JSON.stringify(session));

                // Redirect to dashboard
                router.push('/activity-owners/dashboard');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Login failed';
            setError(message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    const logout = useCallback(() => {
        setOwner(null);
        setSession(null);
        setError(null);
        
        // Clear localStorage
        localStorage.removeItem('activityOwner');
        localStorage.removeItem('activityOwnerSession');
        
        // Make logout API call (fire and forget)
        if (session?.token) {
            fetch('/api/activity-owners/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.token}`,
                },
            }).catch(() => {
                // Ignore errors - user is already logged out locally
            });
        }

        // Redirect to login
        router.push('/activity-owners/auth/login');
    }, [session, router]);

    const verifyEmail = useCallback(async (token: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/activity-owners/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            const data: ApiResponse<{ verified: boolean; owner?: ActivityOwner }> = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Email verification failed');
            }

            if (data.data?.verified && data.data?.owner) {
                // Update owner with verified status
                setOwner(data.data.owner);
                localStorage.setItem('activityOwner', JSON.stringify(data.data.owner));
                return true;
            }

            return false;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Email verification failed';
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const verifyPhone = useCallback(async (code: string, phone: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/activity-owners/verify-phone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code, phone }),
            });

            const data: ApiResponse<{ verified: boolean; owner?: ActivityOwner }> = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Phone verification failed');
            }

            if (data.data?.verified && data.data?.owner) {
                // Update owner with verified status
                setOwner(data.data.owner);
                localStorage.setItem('activityOwner', JSON.stringify(data.data.owner));
                return true;
            }

            return false;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Phone verification failed';
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshTokenInternal = useCallback(async (): Promise<boolean> => {
        try {
            const storedSession = localStorage.getItem('activityOwnerSession');
            if (!storedSession) return false;

            const session: OwnerSession = JSON.parse(storedSession);

            const response = await fetch('/api/activity-owners/refresh-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.token}`,
                },
            });

            const data: ApiResponse<{ owner: ActivityOwner; session: OwnerSession }> = await response.json();

            if (!response.ok || !data.data) {
                return false;
            }

            const { owner, session: newSession } = data.data;
            
            setOwner(owner);
            setSession(newSession);
            
            localStorage.setItem('activityOwner', JSON.stringify(owner));
            localStorage.setItem('activityOwnerSession', JSON.stringify(newSession));

            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    }, []);

    const refreshToken = useCallback(async (): Promise<boolean> => {
        return refreshTokenInternal();
    }, [refreshTokenInternal]);

    return {
        owner,
        session,
        isLoading,
        isAuthenticated,
        login,
        logout,
        verifyEmail,
        verifyPhone,
        refreshToken,
        error,
        clearError,
    };
}
