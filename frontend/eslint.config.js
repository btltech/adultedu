import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
    {
        ignores: ['dist/**', 'test-results/**', 'node_modules/**', '.wrangler/**'],
    },
    js.configs.recommended,
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: { ecmaFeatures: { jsx: true } },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            // Existing files contain a small amount of intentional legacy
            // dead code. Keep it visible without making the first lint pass
            // unusable; hook ordering remains an error.
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-undef': 'warn',
            // These compiler-era rules are intentionally not enforced yet;
            // the app predates React Compiler and uses established effect
            // patterns throughout. Keep the stable hooks rules below.
            'react-hooks/set-state-in-effect': 'off',
            'react-hooks/immutability': 'off',
            'react-hooks/error-boundaries': 'off',
            'react-hooks/purity': 'off',
            'react-hooks/preserve-manual-memoization': 'off',
            'react-hooks/preserve-caught-error': 'off',
            'no-useless-escape': 'off',
            'no-empty': 'off',
            'no-useless-assignment': 'off',
            'preserve-caught-error': 'off',
        },
    },
]
