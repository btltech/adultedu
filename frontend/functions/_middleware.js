const SECURITY_HEADERS = {
    'Content-Security-Policy': [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "img-src 'self' data: https:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "script-src 'self'",
        "connect-src 'self'",
        "worker-src 'self'",
        "object-src 'none'",
        'upgrade-insecure-requests',
    ].join('; '),
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-Permitted-Cross-Domain-Policies': 'none',
}

/**
 * Apply a consistent browser-security baseline to HTML, assets, and proxied
 * API responses. A root Pages middleware runs before every nested function.
 */
export async function onRequest(context) {
    const response = await context.next()
    const secured = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    })

    Object.entries(SECURITY_HEADERS).forEach(([name, value]) => {
        secured.headers.set(name, value)
    })

    return secured
}
