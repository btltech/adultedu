// Keep the retired /api surface an API, rather than allowing Pages' SPA
// fallback to turn it into a successful HTML response. The versioned proxy at
// /api/v1/* is handled by the more-specific function in api/v1/[[path]].js.
export async function onRequest() {
    return new Response(JSON.stringify({
        error: 'Gone',
        message: 'Legacy /api routes have been removed. Use /api/v1.',
    }), {
        status: 410,
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Cache-Control': 'no-store',
        },
    })
}
