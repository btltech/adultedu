# Listen to this lesson (browser voice + optional natural voice)

Every lesson has a **Listen to this lesson** button (Play / Pause / Stop). It reads the title,
summary, headings, paragraphs, lists and callouts. Code, interactive widgets and writing/speaking
activities are skipped. Numbers, money, percentages, maths symbols and acronyms are rewritten so
they are read sensibly (`src/lib/speech/speakable.js`; add exceptions there).

## Two voices

1. **Browser voice** - always available, no download. It prefers an en-GB voice.
2. **Natural voice (opt-in)** - Kokoro-82M running on the learner's device (display settings ->
   "Natural voice"). About 90MB, downloaded once. Works offline afterwards, nothing the learner
   reads leaves the device, and there is no per-use cost. English only. Until it has loaded,
   "Listen" uses the browser voice, so nobody waits on the download.

The switch only appears when the model is actually hosted (see below).

## Turning the natural voice on for the site

The Content-Security-Policy only allows `'self'`, so the model is served from this site, not
huggingface.co:

- `functions/api/kokoro-model/[[path]].js` serves an allow-list of model files from an R2 bucket
  bound as `MODEL_STORE`. Without the binding it returns 503 and the switch stays hidden.
- The model files are the same ones the KS2 app uses: `models/kokoro-82m-v1.0/` in the
  `demiwuraks2-app-audio` bucket (`config.json`, `tokenizer.json`, `tokenizer_config.json`,
  `onnx/model_quantized.onnx`, `voices/bf_emma.bin`). If this project is in the same Cloudflare
  account, just uncomment the `[[r2_buckets]]` block in `frontend/wrangler.toml` and deploy.
  Otherwise upload those files to your own bucket and change `bucket_name`.
- `scripts/copy-onnx-runtime.mjs` (runs before `dev`/`build`) copies the ONNX WebAssembly runtime to
  `public/onnxruntime/` so it also loads from this site. The copy is gitignored.
- `functions/_middleware.js` now allows `'wasm-unsafe-eval'` in `script-src`. Without it the
  browser refuses to run WebAssembly at all. It permits WebAssembly only, not `eval()`.
- For local development without R2, serve the model files from any folder and set
  `VITE_KOKORO_MODEL_BASE` (the folder must expose `<base>/v1.0/...`).

Confirm the model licence (the ONNX repo metadata says Apache-2.0) before shipping.

## Limits

- English only; maths and code are simplified or skipped, not read symbol by symbol.
- Runs single-threaded on WebAssembly (the site is not cross-origin isolated), so older phones may
  pause between sentences. Keep it opt-in.
- This is text-to-speech only. It cannot listen to or mark the learner's own recording.
