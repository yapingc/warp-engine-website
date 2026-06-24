const baseConfig = require('@fuxi/eslint-config-fuxi/react')({
  // 如果项目是 monorepo 在此处添加所有 tsconfig 即可
  tsconfig: [
    `${process.cwd()}/tsconfig.json`,
    `${process.cwd()}/tsconfig.node.json`,
  ],
  root: process.cwd(),
  // 可以手动指定额外需要忽略的文件
  globalIgnores: ['/node_modules/**', '/dist/**', 'src/worker/**'],
  rules: {
    'max-depth': ['warn', 3],
    'react/self-closing-comp': [
      'error',
      {
        component: true,
        html: true,
      },
    ],
    'fuxi/no-export-default': 'off',
    'no-restricted-imports': ['off', 'lodash'],
  },
});

module.exports = [
  ...(Array.isArray(baseConfig) ? baseConfig : [baseConfig]),
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.jsx'],
    rules: {
      'max-lines': ['error', 400],
    },
  },
];
