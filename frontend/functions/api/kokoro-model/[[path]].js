// Serves the Kokoro-82M text-to-speech model files from a private R2 bucket.
//
// The ~90MB model is over the Pages 25MB asset limit, so it lives in R2 and is bound as
// MODEL_STORE (see docs/natural-voice.md). Without the binding this returns 503 and the
// app quietly keeps using the browser voice. Only an allow-list of files is exposed.

const MODEL_PREFIX = 'models/kokoro-82m-v1.0'
const ALLOWED_FILES = /^(config\.json|tokenizer\.json|tokenizer_config\.json|onnx\/model_quantized\.onnx|voices\/bf_emma\.bin)$/

const json = (status, body) => new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
})

async function serve({ env, params, request }) {
    if (!env.MODEL_STORE) return json(503, { error: 'Natural voice storage is not configured' })

    // URL shape: /api/kokoro-model/v1.0/<file path>; the model id segment is fixed by the worker.
    const segments = Array.isArray(params.path) ? params.path : [params.path]
    const [modelId, ...rest] = segments
    const file = rest.join('/')
    if (modelId !== 'v1.0' || !ALLOWED_FILES.test(file)) return json(404, { error: 'Not found' })

    const object = request.method === 'HEAD'
        ? await env.MODEL_STORE.head(`${MODEL_PREFIX}/${file}`)
        : await env.MODEL_STORE.get(`${MODEL_PREFIX}/${file}`)
    if (!object) return json(404, { error: 'Model file not found' })

    const headers = new Headers({
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
    })
    if (object.httpEtag) headers.set('ETag', object.httpEtag)
    if (object.size !== undefined) headers.set('Content-Length', String(object.size))
    return new Response(request.method === 'HEAD' ? null : object.body, { status: 200, headers })
}

export const onRequestGet = serve
export const onRequestHead = serve
