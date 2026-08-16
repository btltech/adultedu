/**
 * API client utility for making requests to the backend
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const NETWORK_MESSAGE = "We couldn't reach AdultEdu. Check your connection and try again."
const SERVICE_MESSAGE = 'AdultEdu is temporarily unavailable. Please try again shortly.'
const GENERIC_MESSAGE = 'Something went wrong. Please try again.'

/**
 * True when an error payload came from infrastructure sitting in front of the
 * API (host platform, proxy, CDN) rather than from our own error handler.
 * Those bodies carry provider wording like "Application not found" that must
 * never reach a learner.
 */
function isUpstreamPayload(data) {
    if (!data || typeof data !== 'object') return true
    return data.status === 'error' || 'request_id' in data
}

/**
 * Map a failed response to copy that is safe to show a learner. Server text is
 * only trusted for the statuses our routes use to explain a bad request.
 */
function userMessageFor(status, data) {
    if (status === 429) return 'Too many attempts. Please wait a moment and try again.'
    if (isUpstreamPayload(data)) return SERVICE_MESSAGE

    const serverMessage = typeof data.message === 'string' ? data.message.trim() : ''

    switch (true) {
        case status === 400 || status === 409 || status === 422:
            return serverMessage || GENERIC_MESSAGE
        case status === 401:
            return 'Your session has expired. Please sign in again.'
        case status === 403:
            return "You don't have permission to do that."
        case status === 404:
            return "We couldn't find what you were looking for."
        case status >= 500:
            return SERVICE_MESSAGE
        default:
            return GENERIC_MESSAGE
    }
}

/**
 * Copy safe to render in the UI. `error.message` stays technical for logs.
 */
export function getUserMessage(error, fallback = GENERIC_MESSAGE) {
    return error?.userMessage || fallback
}

function withQuery(endpoint, params = {}) {
    const query = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        query.set(key, String(value))
    })

    const queryString = query.toString()
    return queryString ? `${endpoint}?${queryString}` : endpoint
}

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
                const err = new Error(`HTTP ${response.status}: ${response.statusText}`);
                err.status = response.status;
                err.userMessage = userMessageFor(response.status, null);
                throw err;
            }
            return null;
        }

        const data = await response.json();

        if (!response.ok) {
            const message = data.message || data.error || `HTTP ${response.status}`;
            const err = new Error(message);
            err.status = response.status;
            err.userMessage = userMessageFor(response.status, data);
            throw err;
        }

        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        // fetch rejects (offline, DNS failure, CORS) before any status exists
        if (!error.userMessage) error.userMessage = NETWORK_MESSAGE;
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
export const verifyEmail = (body) => apiPost('/auth/verify-email', body);
export const resendVerificationEmail = () => apiPost('/auth/resend-verification', {});

// Tracks
export const getTracks = (params) => apiGet(withQuery('/tracks', params));
export const getTrack = (slug) => apiGet(`/tracks/${slug}`);
export const getCertificate = (slug) => apiGet(`/progress/${slug}`);

// Frameworks
export const getFrameworks = () => apiGet('/frameworks');


// UK Levels
export const getUkLevels = () => apiGet('/uk-levels');

// Progress
export const getProgressDetail = (slug) => apiGet(`/progress/${slug}`);
export const getOnboardingStatus = () => apiGet('/onboarding/status');
export const getOnboardingRecommendation = (body) => apiPost('/onboarding/recommend', body);
export const completeOnboarding = (body) => apiPost('/onboarding/complete', body);
export const recordOnboardingOutcome = (body) => apiPost('/onboarding/outcome', body);
export const getPartnerOverview = (params) => apiGet(withQuery('/admin/partners/overview', params));
export const getPartnerExportUrl = (params = {}) => `${API_BASE}${withQuery('/admin/partners/export', params)}`;

export default {
    get: apiGet,
    post: apiPost,
    put: apiPut,
    delete: apiDelete
};
