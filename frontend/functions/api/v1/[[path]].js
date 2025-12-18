export async function onRequest({ request, env }) {
    const apiOrigin = env.API_ORIGIN
    if (!apiOrigin) {
        return new Response('Missing API_ORIGIN', { status: 500 })
    }

    const incomingUrl = new URL(request.url)
    const targetUrl = new URL(`${incomingUrl.pathname}${incomingUrl.search}`, apiOrigin)

    return fetch(new Request(targetUrl, request))
}

