/**
 * API client utility for making requests to the backend
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Make an API request
 * @param {string} endpoint - API endpoint (without /api prefix)
 * @param {object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
export async function api(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    // Get CSRF token from cookies
    const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(csrfToken && { 'X-CSRF-Token': csrfToken }), // Add CSRF header
            ...options.headers,
        },
        credentials: 'include', // Include cookies for session auth
        ...options,
    };

    // Convert body to JSON if it's an object
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(url, config);

        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return null;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || `HTTP ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

// Convenience methods
export const apiGet = (endpoint) => api(endpoint, { method: 'GET' });
export const apiPost = (endpoint, body) => api(endpoint, { method: 'POST', body });
export const apiPut = (endpoint, body) => api(endpoint, { method: 'PUT', body });
export const apiDelete = (endpoint) => api(endpoint, { method: 'DELETE' });

// Health check
export const checkHealth = () => apiGet('/health');

// Tracks
export const getTracks = () => apiGet('/tracks');
export const getTrack = (slug) => apiGet(`/tracks/${slug}`);
export const getCertificate = (slug) => apiGet(`/progress/${slug}`);

// Frameworks
export const getFrameworks = () => apiGet('/frameworks');


// UK Levels
export const getUkLevels = () => apiGet('/uk-levels');

// Progress
export const getProgressDetail = (slug) => apiGet(`/progress/${slug}`);

export default {
    get: apiGet,
    post: apiPost,
    put: apiPut,
    delete: apiDelete
};
