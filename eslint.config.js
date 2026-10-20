import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';
export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'e2e-results'] },
  js.configs.recommended, ...tseslint.configs.recommended, ...vue.configs['flat/recommended'],
  { files: ['**/*.vue'], languageOptions: { parserOptions: { parser: tseslint.parser } } },
  { rules: { 'vue/multi-word-component-names': 'off', 'no-undef': 'off', '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-globals': ['error', { name: 'confirm', message: 'Use useConfirm()' }, { name: 'alert', message: 'Use useToast()' }, { name: 'prompt', message: 'Use a Dialog' }],
      'no-restricted-properties': ['error', { object: 'window', property: 'confirm' }, { object: 'window', property: 'alert' }, { object: 'window', property: 'prompt' }],
    } },
  prettier,
);
