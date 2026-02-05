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
    searchGallery: (q?: string, tag?: string, page = 0, size = 10, sort = 'latest') =>
        apiClient.get(`/api/gallery/search`, { params: { q, tag, page, size, sort } }),
    getGalleryDetail: (id: string) =>
        apiClient.get(`/api/gallery/${id}`),
    getGalleryTags: () =>
        apiClient.get(`/api/gallery/tags`),
    getGalleryComments: (postId: string, page = 0, size = 20) =>
        apiClient.get(`/api/gallery/${postId}/comments`, { params: { page, size } }),
    postGalleryComment: (postId: string, data: { content: string; parentId?: string | null }) =>
        apiClient.post(`/api/gallery/${postId}/comments`, data),
    toggleGalleryReaction: (postId: string, type: 'LIKE' | 'DISLIKE' = 'LIKE') =>
        apiClient.post(`/api/gallery/${postId}/reaction`, { type }),
    toggleGalleryBookmark: (postId: string) =>
        apiClient.post(`/api/gallery/${postId}/bookmark`),
    getMyBookmarks: (page = 0, size = 12) =>
        apiClient.get(`/api/gallery/bookmarks/my`, { params: { page, size } }),
    registerToGallery: (data: {
        title: string;
        content?: string;
        tags?: string[];
        thumbnailUrl?: string;
        ldrUrl?: string;
        sourceImageUrl?: string;
        glbUrl?: string;
        visibility?: 'PUBLIC' | 'PRIVATE';
    }) => apiClient.post(`/api/gallery`, data),

    // MyPage
    getMyProfile: () => apiClient.get(`/api/my/profile`),
    updateMyProfile: (data: { nickname?: string; bio?: string; profileImage?: string }) =>
        apiClient.patch(`/api/my/profile`, data),
    getMyOverview: () => apiClient.get(`/api/my/overview`),
    getMyJobs: (page = 0, size = 12) =>
        apiClient.get(`/api/my/jobs`, { params: { page, size } }),
    retryJob: (jobId: string) =>
        apiClient.post(`/api/my/jobs/${jobId}/retry`),
    getMyMembership: () => apiClient.get(`/api/my/membership`),

    // Inquiries / Reports
    getMyInquiries: (page = 0, size = 20) =>
        apiClient.get(`/api/inquiries/my`, { params: { page, size } }),
    getMyReports: (page = 0, size = 20) =>
        apiClient.get(`/api/reports/my`, { params: { page, size } }),

    // Payments (web checkout)
    getPaymentPlans: () => apiClient.get(`/api/payments/plans`),
    createCheckout: (planId: string) =>
        apiClient.post(`/api/payments/checkout`, { planId }),
    deleteMyAccount: () =>
        apiClient.delete(`/api/my/account`),
};

export default apiClient;
