import { FlatCompat } from '@eslint/eslintrc'
 
const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
})
 
const eslintConfig = [
  ...compat.config({
    extends: ['next'],
    plugins: ['import'],
  }),
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',
      'import/no-absolute-path': 'error',
      'import/no-dynamic-require': 'error',
      'import/no-self-import': 'error',
      'import/no-cycle': 'error',
      'import/no-useless-path-segments': 'error',
      // Ban direct firebase/firestore imports in client code
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'firebase/firestore',
              message: 'Direct Firestore imports are forbidden. Use API routes instead.',
            },
            {
              name: '@firebase/firestore',
              message: 'Direct Firestore imports are forbidden. Use API routes instead.',
            },
          ],
          patterns: [
            {
              group: ['firebase/*', '@firebase/*'],
              message: 'Only Firestore is restricted. Other Firebase imports are allowed.',
              allow: ['firebase/app', 'firebase/auth', 'firebase/functions', 'firebase/storage', 'firebase/messaging']
            }
          ]
        }
      ],
      // Custom rule to ban direct fetch usage (would require custom rule, for now we'll rely on code review and documentation)
    },
  },
]

export default eslintConfig