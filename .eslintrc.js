module.exports = {
    env: {
        node: true,
        es6: true,
        jest: true,
    },
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'import'],
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
    },
    ignorePatterns: ['web-build', '__mocks__'],
};
