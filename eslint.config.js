import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'e2e-results'] },
  js.configs.recommended, ...tseslint.configs.recommended, ...vue.configs['flat/recommended'],
  { files: ['**/*.vue'], languageOptions: { parserOptions: { parser: tseslint.parser } } },
  { rules: { 'vue/multi-word-component-names': 'off', '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } },
);
