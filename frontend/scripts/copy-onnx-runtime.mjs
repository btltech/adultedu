// Copies the ONNX WebAssembly runtime next to the app so the natural-voice worker loads it from
// this site (the Content-Security-Policy blocks CDNs). Runs before dev/build; output is gitignored.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'node_modules', '@huggingface', 'transformers', 'dist')
const target = path.join(root, 'public', 'onnxruntime')
const files = ['ort-wasm-simd-threaded.jsep.mjs', 'ort-wasm-simd-threaded.jsep.wasm']

fs.mkdirSync(target, { recursive: true })
for (const file of files) {
    const from = path.join(source, file)
    if (!fs.existsSync(from)) {
        console.error(`copy-onnx-runtime: ${from} not found. Run npm install first.`)
        process.exit(1)
    }
    fs.copyFileSync(from, path.join(target, file))
}
console.log(`copy-onnx-runtime: copied ${files.length} files to public/onnxruntime`)
