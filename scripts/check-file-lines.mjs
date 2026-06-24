#!/usr/bin/env node

/**
 * 检查文件行数是否超过限制
 * 用法: node scripts/check-file-lines.mjs [--max <行数>] <file1> <file2> ...
 * 默认最大行数: 400
 */

import { readFileSync } from 'fs';
import { basename } from 'path';

const args = process.argv.slice(2);

let maxLines = 400;
const files = [];

// 解析参数
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--max' && args[i + 1]) {
    maxLines = parseInt(args[i + 1], 10);
    i++;
  } else {
    files.push(args[i]);
  }
}

if (files.length === 0) {
  process.exit(0);
}

let hasError = false;

for (const file of files) {
  try {
    const content = readFileSync(file, 'utf-8');
    const lineCount = content.split('\n').length;

    if (lineCount > maxLines) {
      console.error(
        `\x1b[31m✘ ${file} 有 ${lineCount} 行，超过了 ${maxLines} 行的限制。\x1b[0m`
      );
      console.error(
        `  请拆分组件，保持单个文件不超过 ${maxLines} 行。`
      );
      hasError = true;
    }
  } catch {
    // 文件不存在（可能已被删除），跳过
  }
}

if (hasError) {
  console.error(
    `\n\x1b[33m提示: src/ 下的 .tsx 文件不允许超过 ${maxLines} 行。请将大组件拆分为更小的子组件。\x1b[0m\n`
  );
  process.exit(1);
}
