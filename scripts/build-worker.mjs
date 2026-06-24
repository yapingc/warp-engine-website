/**
 * 构建 src/worker 目录下的 Node.js 代码到 dist/worker
 * 如果 src/worker 不存在或没有 index.ts 则跳过
 */
import { existsSync, cpSync } from 'fs';
import { resolve } from 'path';
import { build } from 'esbuild';

const workerDir = resolve(process.cwd(), 'src/worker');
const outDir = resolve(process.cwd(), 'dist/worker');

if (!existsSync(workerDir)) {
  process.exit(0);
}

const entryPoint = resolve(workerDir, 'index.ts');
if (!existsSync(entryPoint)) {
  process.exit(0);
}

console.log('[build-worker] 编译 src/worker → dist/worker');

const envBanner = `
// 为 ESM 产物提供 require 垫片：避免误引入 CommonJS 包（如 dotenv）时
// 报 "Dynamic require of ... is not supported"。esbuild 生成的 __require
// 会优先使用此处定义的 require，而非抛错。
import { createRequire as __createRequire } from 'node:module';
const require = __createRequire(import.meta.url);
import { readFileSync as __readFile } from 'node:fs';
import { dirname as __dirn, join as __joinP } from 'node:path';
import { fileURLToPath as __toPath } from 'node:url';
try {
  const __d = __dirn(__toPath(import.meta.url));
  for (const __l of __readFile(__joinP(__d, '.env'), 'utf-8').split('\\n')) {
    const __t = __l.trim();
    if (!__t || __t.startsWith('#')) continue;
    const __i = __t.indexOf('=');
    if (__i < 0) continue;
    const __k = __t.slice(0, __i).trim();
    const __v = __t.slice(__i + 1).trim();
    if (!(__k in process.env)) process.env[__k] = __v;
  }
} catch {}
`;

await build({
  entryPoints: [entryPoint],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: resolve(outDir, 'index.js'),
  sourcemap: false,
  banner: { js: envBanner },
});

// 复制 .env 到 dist/worker（容器运行时需要）
const envFile = resolve(workerDir, '.env');
if (existsSync(envFile)) {
  cpSync(envFile, resolve(outDir, '.env'));
}

console.log('[build-worker] 完成');
