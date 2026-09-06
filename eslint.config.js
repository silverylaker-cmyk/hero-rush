import tseslint from 'typescript-eslint';
export default [{ files: ['src/core/**/*.ts'], languageOptions: { parser: tseslint.parser }, rules: {
  'no-restricted-imports': ['error', { patterns: ['phaser', 'phaser/*', '**/render/**'] }],
  'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'requestAnimationFrame'],
  'no-restricted-properties': ['error', { object: 'Math', property: 'random', message: 'Use the battle seed stream.' }]
} }];
