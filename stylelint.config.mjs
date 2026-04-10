/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-recommended-scss'],
  ignoreFiles: ['**/dist/**', '**/node_modules/**', '**/coverage/**', '**/storybook-static/**', '**/playwright-report/**', '**/test-results/**'],
  rules: {
    // VS Code `css.lint.emptyRules` / `scss.lint.emptyRules` 와 대응 — 빈 ruleset 허용
    'block-no-empty': null,
  },
}
