module.exports = {
    env: {
        node: true,
        es6: true,
        jest: true,
    },
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:jest/recommended',
        'prettier',
    ],
    rules: {
        '@typescript-eslint/no-var-requires': 0,
        'jest/no-disabled-tests': 0,
        'semi': ['error', 'always'],
        'eol-last': ['error', 'always'],
    },
    ignorePatterns: ['web-build', '__mocks__'],
};
