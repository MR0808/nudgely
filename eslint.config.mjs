import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
    ...nextCoreWebVitals,
    {
        ignores: [
            'node_modules/**',
            '.next/**',
            'out/**',
            'build/**',
            'coverage/**',
            'generated/**',
            'emails/**'
        ]
    },
    {
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            'react-hooks/exhaustive-deps': 'off',
            'react-hooks/set-state-in-effect': 'off',
            'react-hooks/purity': 'off',
            'react-hooks/incompatible-library': 'off',
            'react/no-unescaped-entities': 'off',
            'prefer-const': 'off',
            'import/no-anonymous-default-export': 'off'
        }
    }
];

export default eslintConfig;
