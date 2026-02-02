import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginWithKakao, logoutFromKakao, getAccessToken, LoginResponse } from './auth';
import { api } from './api';

interface User {
    id: string;
    email: string;
    nickname: string;
    profileImage: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isLoggedIn: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 앱 시작 시 로그인 상태 확인
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = await getAccessToken();
            if (token) {
                // 토큰이 있으면 유저 정보 조회
                const response = await api.me();
                setUser(response.data);
            }
        } catch (error) {
            console.log('[AuthContext] Not logged in or token expired');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = useCallback(async () => {
        setIsLoading(true);
        try {
            const result: LoginResponse = await loginWithKakao();
            setUser(result.user);
        } catch (error) {
            console.error('[AuthContext] Login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setIsLoading(true);
        try {
            await logoutFromKakao();
            setUser(null);
        } catch (error) {
            console.error('[AuthContext] Logout failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const response = await api.me();
            setUser(response.data);
        } catch (error) {
            console.error('[AuthContext] Failed to refresh user:', error);
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isLoggedIn: user !== null,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
