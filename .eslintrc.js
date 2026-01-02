require('@rushstack/eslint-patch/modern-module-resolution');

/** @type {import('eslint').Linter.Config} */
module.exports = {
    root: true,
    extends: [
        'plugin:@kocdigital/loose',
    ],
    parserOptions: {
        parser: {
            ts: '@typescript-eslint/parser',
            '<template>': 'espree',
        },
    },
    rules: {
        'vue/multi-word-component-names': ['error', {
            ignores: ['Map'],
        }],
        'no-use-before-define': 'off',
        '@typescript-eslint/no-use-before-define': 'warn',
        'vue/valid-v-slot': ['error', {
            allowModifiers: true,
        }],
        'eslint-comments/disable-enable-pair': ['error', {allowWholeFile: true}],
    },
    settings: {
        'import/resolver': {
            typescript: {
                project: __dirname,
            },
        },
    },
};
