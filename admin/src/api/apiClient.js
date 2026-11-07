import { INDUSTRIES, SERVICES, PRODUCTS, REVIEWS, OFFERS, PORTFOLIO_ITEMS } from '@/data/siteData';

// API Base URL connecting to our Express/Prisma backend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? `${window.location.origin}/api/v1`
        : 'http://localhost:3000/api/v1');

// Fallback in-memory data store in case backend is temporarily unreachable
const fallbackData = {
    Industry: INDUSTRIES || [],
    Service: SERVICES || [],
    Product: PRODUCTS || [],
    Review: REVIEWS || [],
    Offer: OFFERS || [],
    PortfolioItem: PORTFOLIO_ITEMS || [],
    Lead: [],
    Notification: [],
    ImportJob: [],
    Quotation: [],
    Order: [],
    Payment: [],
    Category: [],
    MediaItem: [],
    Customer: [],
};

const ENTITY_ROUTES = {
    Product: 'products',
    Service: 'services',
    Industry: 'industries',
    Category: 'categories',
    Lead: 'leads',
    Quotation: 'quotations',
    Order: 'orders',
    Payment: 'payments',
    Review: 'reviews',
    Offer: 'offers',
    PortfolioItem: 'portfolio',
    MediaItem: 'media',
    Customer: 'customers',
    Notification: 'notifications',
    ImportJob: 'import-jobs',
    User: 'users',
    Admin: 'admins',
};

function getAuthHeader() {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('token') || localStorage.getItem('rk_token') || localStorage.getItem('rk_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timer);
        return response;
    } catch (error) {
        clearTimeout(timer);
        if (error.name === 'AbortError') {
            throw new Error(`Request timed out after ${timeoutMs / 1000}s. Please check network connectivity.`);
        }
        if (error.message && error.message.toLowerCase().includes('failed to fetch')) {
            throw new Error('Unable to connect to RK Printers API server. Please check your internet or server status.');
        }
        throw error;
    }
}

function createEntityHandler(entityName) {
    const route = ENTITY_ROUTES[entityName] || `entities/${entityName.toLowerCase()}`;

    return {
        list: async (sort, limit) => {
            try {
                const params = new URLSearchParams();
                if (sort) params.append('sort', sort);
                if (limit) params.append('limit', String(limit));

                const res = await fetchWithTimeout(`${API_BASE_URL}/${route}?${params.toString()}`, {
                    headers: { credentials: 'omit', ...getAuthHeader() },
                }, 12000);
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && Array.isArray(json.data)) {
                        return json.data;
                    }
                }
            } catch (err) {
                console.warn(`[Backend API] List ${entityName} failed, using fallback:`, err.message);
            }

            const items = fallbackData[entityName] || [];
            return limit ? items.slice(0, limit) : items;
        },

        filter: async (criteria = {}, sort, limit) => {
            try {
                const params = new URLSearchParams();
                for (const [k, v] of Object.entries(criteria)) {
                    if (v !== undefined && v !== null) params.append(k, String(v));
                }
                if (sort) params.append('sort', sort);
                if (limit) params.append('limit', String(limit));

                const res = await fetchWithTimeout(`${API_BASE_URL}/${route}?${params.toString()}`, {
                    headers: { credentials: 'omit', ...getAuthHeader() },
                }, 12000);
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && Array.isArray(json.data)) {
                        return json.data;
                    }
                }
            } catch (err) {
                console.warn(`[Backend API] Filter ${entityName} failed, using fallback:`, err.message);
            }

            let items = fallbackData[entityName] || [];
            items = items.filter((item) => {
                for (const [k, v] of Object.entries(criteria)) {
                    if (item[k] !== v && !((item[k] || []).includes && item[k].includes(v))) {
                        return false;
                    }
                }
                return true;
            });
            return limit ? items.slice(0, limit) : items;
        },

        get: async (idOrSlug) => {
            try {
                const res = await fetchWithTimeout(`${API_BASE_URL}/${route}/${idOrSlug}`, {
                    headers: { credentials: 'omit', ...getAuthHeader() },
                }, 12000);
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && json.data) {
                        return json.data;
                    }
                }
            } catch (err) {
                console.warn(`[Backend API] Get ${entityName}/${idOrSlug} failed:`, err.message);
            }

            const items = fallbackData[entityName] || [];
            return items.find((it) => it.id === idOrSlug || it.slug === idOrSlug) || null;
        },

        create: async (data) => {
            try {
                const res = await fetchWithTimeout(`${API_BASE_URL}/${route}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                    body: JSON.stringify(data),
                }, 15000);
                const json = await res.json();
                if (res.ok && json.success && json.data) {
                    return json.data;
                }
                if (!res.ok) {
                    const msg = json.message || (json.error && (json.error.explanation || json.error.message)) || `Failed to create ${entityName}`;
                    throw new Error(msg);
                }
            } catch (err) {
                if (err.message && !err.message.includes('fetch')) {
                    throw err;
                }
                console.warn(`[Backend API] Create ${entityName} failed, using local store:`, err.message);
            }

            const newItem = { id: `local-${Date.now()}`, createdAt: new Date().toISOString(), created_date: new Date().toISOString(), ...data };
            if (!fallbackData[entityName]) fallbackData[entityName] = [];
            fallbackData[entityName].unshift(newItem);
            return newItem;
        },

        update: async (id, data) => {
            try {
                const res = await fetchWithTimeout(`${API_BASE_URL}/${route}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                    body: JSON.stringify(data),
                }, 15000);
                const json = await res.json();
                if (res.ok && json.success && json.data) {
                    return json.data;
                }
                if (!res.ok) {
                    const msg = json.message || (json.error && (json.error.explanation || json.error.message)) || `Failed to update ${entityName}`;
                    throw new Error(msg);
                }
            } catch (err) {
                if (err.message && !err.message.includes('fetch')) {
                    throw err;
                }
                console.warn(`[Backend API] Update ${entityName}/${id} failed:`, err.message);
            }

            const items = fallbackData[entityName] || [];
            const idx = items.findIndex((it) => it.id === id);
            if (idx >= 0) {
                items[idx] = { ...items[idx], ...data, updated_date: new Date().toISOString() };
                return items[idx];
            }
            return { id, ...data };
        },

        delete: async (id) => {
            try {
                const res = await fetchWithTimeout(`${API_BASE_URL}/${route}/${id}`, {
                    method: 'DELETE',
                    headers: { ...getAuthHeader() },
                }, 15000);
                if (res.ok) {
                    return { success: true, id };
                }
                const json = await res.json();
                if (!res.ok) {
                    const msg = json.message || (json.error && (json.error.explanation || json.error.message)) || `Failed to delete ${entityName}`;
                    throw new Error(msg);
                }
            } catch (err) {
                if (err.message && !err.message.includes('fetch')) {
                    throw err;
                }
                console.warn(`[Backend API] Delete ${entityName}/${id} failed:`, err.message);
            }

            if (fallbackData[entityName]) {
                fallbackData[entityName] = fallbackData[entityName].filter((it) => it.id !== id);
            }
            return { success: true };
        },

        bulkUpdate: async (items) => {
            try {
                const res = await fetch(`${API_BASE_URL}/${route}/bulk-update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                    body: JSON.stringify({ items }),
                });
                if (res.ok) {
                    const json = await res.json();
                    return json.data;
                }
            } catch (err) {
                console.warn(`[Backend API] Bulk update ${entityName} failed:`, err.message);
            }
            return { updatedCount: items?.length || 0 };
        },

        deleteMany: async (criteriaOrIds) => {
            try {
                const ids = Array.isArray(criteriaOrIds)
                    ? criteriaOrIds
                    : criteriaOrIds?.id?.$in || criteriaOrIds?.ids || [];

                const res = await fetch(`${API_BASE_URL}/${route}/delete-many`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                    body: JSON.stringify({ ids }),
                });
                if (res.ok) {
                    const json = await res.json();
                    return json.data;
                }
            } catch (err) {
                console.warn(`[Backend API] DeleteMany ${entityName} failed:`, err.message);
            }
            return { deletedCount: 0 };
        },
    };
}

const entities = new Proxy({}, {
    get(target, prop) {
        if (!target[prop]) {
            target[prop] = createEntityHandler(prop);
        }
        return target[prop];
    },
});

const auth = {
    me: async () => {
        if (typeof window === 'undefined') return null;
        const token = localStorage.getItem('token') || localStorage.getItem('rk_token') || localStorage.getItem('rk_admin_token');
        if (token) {
            try {
                const adminRes = await fetch(`${API_BASE_URL}/admins/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (adminRes.ok) {
                    const json = await adminRes.json();
                    if (json.success && json.data) {
                        return {
                            ...json.data,
                            role: json.data.role?.toLowerCase() || 'admin',
                            whatsapp_settings: json.data.whatsapp_settings || json.data.settings?.whatsapp_settings || null,
                        };
                    }
                }
            } catch {
                // fallback to localStorage
            }
        }
        const userStr = localStorage.getItem('rk_user');
        return userStr ? JSON.parse(userStr) : null;
    },

    updateMe: async (data) => {
        const token = auth.getToken();
        const res = await fetch(`${API_BASE_URL}/admins/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify(data),
        });
        const json = await res.json();
        if (res.ok && json.success && json.data) {
            const current = (await auth.me()) || {};
            const updated = {
                ...current,
                ...json.data,
                role: json.data.role?.toLowerCase() || 'admin',
                whatsapp_settings: json.data.whatsapp_settings || json.data.settings?.whatsapp_settings || null,
            };
            if (typeof window !== 'undefined') {
                localStorage.setItem('rk_user', JSON.stringify(updated));
            }
            return updated;
        }
        const msg = json.message || (json.error && (json.error.explanation || json.error.message)) || 'Failed to update settings';
        throw new Error(msg);
    },

    loginAdmin: async (email, password) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/admins/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        }, 15000);
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success) {
            const token = json.data.jwt;
            const admin = json.data.admin;
            const formatted = {
                ...admin,
                role: 'admin',
                token,
                whatsapp_settings: admin.whatsapp_settings || admin.settings?.whatsapp_settings || null,
            };
            if (typeof window !== 'undefined') {
                localStorage.setItem('token', token);
                localStorage.setItem('rk_token', token);
                localStorage.setItem('rk_admin_token', token);
                localStorage.setItem('rk_user', JSON.stringify(formatted));
            }
            return formatted;
        }
        if (res.status === 401 || res.status === 404) {
            throw new Error('Invalid email or password');
        }
        const msg = json.message || (json.error && (json.error.explanation || json.error.message)) || 'Login request failed';
        throw new Error(msg);
    },

    loginViaEmailPassword: async (email, password) => {
        return auth.loginAdmin(email, password);
    },

    logout: async () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('rk_token');
            localStorage.removeItem('rk_admin_token');
            localStorage.removeItem('rk_user');
        }
    },

    setToken: (token) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
            localStorage.setItem('rk_token', token);
            localStorage.setItem('rk_admin_token', token);
        }
    },

    getToken: () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token') || localStorage.getItem('rk_token') || localStorage.getItem('rk_admin_token') || null;
        }
        return null;
    },

    resetPasswordRequest: async (email) => {
        return { success: true };
    },

    testEmail: async (email) => {
        const token = auth.getToken();
        const res = await fetch(`${API_BASE_URL}/admins/test-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ email }),
        });
        const json = await res.json();
        if (res.ok && json.success) return json.data;
        throw new Error(json.message || 'Failed to send test email');
    },

    resetPassword: async ({ resetToken, newPassword }) => {
        return { success: true };
    },
};

const integrations = {
    Core: {
        UploadPublicFile: async ({ file, folder = 'rk-printers/public' }) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', folder);

            const res = await fetch(`${API_BASE_URL}/uploads/single`, {
                method: 'POST',
                headers: { ...getAuthHeader() },
                body: formData,
            });
            const json = await res.json();
            if (res.ok && json.success) {
                return {
                    file_url: json.data.url,
                    file_uri: json.data.url,
                    ...json.data,
                };
            }
            throw new Error(json.message || 'Upload failed');
        },

        UploadPrivateFile: async ({ file, folder = 'rk-printers/private' }) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', folder);

            const res = await fetch(`${API_BASE_URL}/uploads/single`, {
                method: 'POST',
                headers: { ...getAuthHeader() },
                body: formData,
            });
            const json = await res.json();
            if (res.ok && json.success) {
                return {
                    file_url: json.data.url,
                    file_uri: json.data.url,
                    ...json.data,
                };
            }
            throw new Error(json.message || 'Upload failed');
        },
    },
};

const app = {
    getPublicSettings: async () => ({
        id: 'rk-printers-admin',
        public_settings: {},
    }),
};

export const apiClient = {
    entities,
    auth,
    integrations,
    app,
};

export const api = apiClient;
export default apiClient;
