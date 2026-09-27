import { build } from 'esbuild';
import { cp, mkdir } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
await build({ entryPoints: ['src/app.js'], bundle: true, outdir: 'dist', minify: true, sourcemap: true, target: ['es2022'] });
console.log('Built dist/');
