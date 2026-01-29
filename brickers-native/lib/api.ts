import axios from 'axios';

// Mobile API Configuration
// For Android Emulator: http://10.0.2.2:8080
// For physical device: Your machine IP (e.g., http://192.168.0.112:8080)
export const API_BASE = 'https://brickers.shop';

const apiClient = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Authentication Interceptor (Optional: Add token if stored in SecureStore)
apiClient.interceptors.request.use(async (config) => {
    // const token = await SecureStore.getItemAsync('accessToken');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const api = {
    // Auth
    login: (data: any) => apiClient.post('/api/auth/login', data),
    me: () => apiClient.get('/api/auth/me'),

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
