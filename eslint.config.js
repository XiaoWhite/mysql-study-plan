import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import vue from 'eslint-plugin-vue';
import globals from 'globals';

export default defineConfig([
  globalIgnores(['dist/']),
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    extends: [js.configs.recommended],
  },
  vue.configs['flat/recommended'],
  {
    files: ['src/**/*.{js,vue}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['*.config.js'],
    languageOptions: { globals: globals.nodeBuiltin },
  },
  {
    files: ['src/views/LessonPage.vue'],
    rules: {
      // These bindings render bundled course Markdown.
      'vue/no-v-html': ['warn', { ignorePattern: '^(caseStudyHtml|lessonHtml)$' }],
    },
  },
  prettier,
]);
