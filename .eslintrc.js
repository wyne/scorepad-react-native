module.exports = {
    env: {
        node: true,
        es6: true,
        jest: true,
    },
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'import', 'react-hooks'],
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:jest/recommended',
        'prettier',
    ],
    rules: {
        'quotes': ['error', 'single'],
        '@typescript-eslint/no-var-requires': 0,
        'jest/no-disabled-tests': 0,
        'semi': ['error', 'always'],
        'eol-last': ['error', 'always'],
        'import/order': ['error', {
            'pathGroups': [
                {
                    'pattern': 'react',
                    'group': 'builtin',
                    'position': 'before'
                }
            ],
            'pathGroupsExcludedImportTypes': ['react'],
            'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
            'alphabetize': {
                'order': 'asc',
                'caseInsensitive': true,
            },
            'newlines-between': 'always',
        }],
        'import/no-duplicates': 'error',
        // Existing dependency warnings are being fixed incrementally. Keep them
        // visible without blocking the ordering-safety rollout.
        'react-hooks/exhaustive-deps': 'warn',
        'react-hooks/rules-of-hooks': 'error',
    },
    ignorePatterns: ['web-build', '__mocks__'],
    overrides: [
        {
            // Expo config plugins must be CommonJS
            files: ['plugins/**/*.js'],
            rules: {
                '@typescript-eslint/no-require-imports': 'off',
            },
        },
        {
            // e2e tests use mocha, not jest — no expect() assertions required
            files: ['e2e/**/*.ts'],
            rules: {
                'jest/expect-expect': 'off',
            },
        },
    ],
};
