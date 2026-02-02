import axios from 'axios';

// Mobile API Configuration
// For Android Emulator: http://10.0.2.2:8080
// For physical device: Your machine IP (e.g., http://192.168.0.112:8080)
export const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'https://brickers.shop';
// export const API_BASE = 'http://192.168.0.112:8080';

const apiClient = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Authentication Interceptor (Optional: Add token if stored in SecureStore)
import * as SecureStore from 'expo-secure-store';

// Authentication Interceptor (Optional: Add token if stored in SecureStore)
apiClient.interceptors.request.use(async (config) => {
    let token = null;
    try {
        // Attempt to get token from SecureStore
        // If native module is missing (dev client mismatch), this might throw
        token = await SecureStore.getItemAsync('accessToken');
    } catch (error) {
        console.warn('[SecureStore] Failed to get token (Native Module missing?), falling back:', error);
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
            headers: config.headers,
            tokenSkeleton: token.substring(0, 10) + '...'
        });
    } else {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url} (No Token)`);
    }
    return config;
}, error => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
});

apiClient.interceptors.response.use(
    response => {
        console.log(`[API Response] ${response.status} ${response.config.url}`, response.data);
        return response;
    },
    error => {
        if (error.response) {
            console.error(`[API Error] ${error.response.status} ${error.config.url}`, error.response.data);
        } else {
            console.error(`[API Network Error] ${error.message}`);
        }
        return Promise.reject(error);
    }
);

export const api = {
    // Auth
    login: (data: any) => apiClient.post('/api/auth/login', data),
    mobileKakaoLogin: (kakaoAccessToken: string) =>
        apiClient.post('/api/auth/mobile/kakao', { kakaoAccessToken }),
    me: () => apiClient.get('/api/auth/me'),
    logout: () => apiClient.post('/api/auth/logout'),

    // Upload
    uploadImage: (formData: FormData) =>
        apiClient.post('/api/uploads/images', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),

    getPresignUrl: (originalName: string, contentType: string) =>
        apiClient.post(`/api/uploads/presign`, { originalName, contentType }),

    // Generation
    startGeneration: (data: { sourceImageUrl: string; age: string; budget: number; title: string }) =>
        apiClient.post(`/api/kids/generate`, data),

    getJobStatus: (jobId: string) =>
        apiClient.get(`/api/kids/jobs/${jobId}`),

    // Gallery
    getGallery: (page = 0, size = 10, sort = 'latest') =>
        apiClient.get(`/api/gallery`, { params: { page, size, sort } }),
};

export default apiClient;
