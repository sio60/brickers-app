import * as SecureStore from 'expo-secure-store';
import * as KakaoLogin from '@react-native-seoul/kakao-login';
import { API_BASE } from './api';

// 토큰 저장 키
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// 로그인 응답 타입
export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        nickname: string;
        profileImage: string;
    };
}

// 토큰 저장
export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
        console.log('[Auth] Tokens saved successfully');
    } catch (error) {
        console.error('[Auth] Failed to save tokens:', error);
        throw error;
    }
}

// 토큰 가져오기
export async function getAccessToken(): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch (error) {
        console.warn('[Auth] Failed to get access token:', error);
        return null;
    }
}

export async function getRefreshToken(): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
        console.warn('[Auth] Failed to get refresh token:', error);
        return null;
    }
}

// 토큰 삭제 (로그아웃)
export async function clearTokens(): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        console.log('[Auth] Tokens cleared');
    } catch (error) {
        console.error('[Auth] Failed to clear tokens:', error);
    }
}

// 카카오 로그인
export async function loginWithKakao(): Promise<LoginResponse> {
    try {
        console.log('[Auth] Starting Kakao login...');

        // 1. 카카오 SDK로 로그인 (카카오 액세스 토큰 획득)
        const kakaoResult = await KakaoLogin.login();
        console.log('[Auth] Kakao login success:', kakaoResult.accessToken?.substring(0, 20) + '...');

        if (!kakaoResult.accessToken) {
            throw new Error('카카오 로그인 실패: 토큰을 받지 못했습니다.');
        }

        // 2. 백엔드에 카카오 토큰 전송 → JWT 발급
        const response = await fetch(`${API_BASE}/api/auth/mobile/kakao`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                kakaoAccessToken: kakaoResult.accessToken,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `로그인 실패: ${response.status}`);
        }

        const data: LoginResponse = await response.json();
        console.log('[Auth] Backend login success:', data.user.nickname);

        // 3. JWT 토큰 저장
        await saveTokens(data.accessToken, data.refreshToken);

        return data;
    } catch (error: any) {
        console.error('[Auth] Kakao login failed:', error);
        throw error;
    }
}

// 카카오 로그아웃
export async function logoutFromKakao(): Promise<void> {
    try {
        // 카카오 SDK 로그아웃
        await KakaoLogin.logout();
        console.log('[Auth] Kakao logout success');
    } catch (error) {
        console.warn('[Auth] Kakao logout failed (may not be logged in):', error);
    }

    // 로컬 토큰 삭제
    await clearTokens();
}

// 로그인 상태 확인
export async function isLoggedIn(): Promise<boolean> {
    const token = await getAccessToken();
    return token !== null;
}

// 토큰 갱신
export async function refreshAccessToken(): Promise<string | null> {
    try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
            return null;
        }

        const response = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            // 리프레시 토큰도 만료됨 → 재로그인 필요
            await clearTokens();
            return null;
        }

        const data = await response.json();
        await saveTokens(data.accessToken, data.refreshToken || refreshToken);

        return data.accessToken;
    } catch (error) {
        console.error('[Auth] Token refresh failed:', error);
        await clearTokens();
        return null;
    }
}
