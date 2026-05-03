import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
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
      'import/no-unresolved': 'off', // Disabled to avoid unresolved noise in this environment
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
          ]
        }
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='push'][callee.object.name='router']",
          message: 'Direct use of router.push is forbidden in Capacitor. Use nativeNavigate(path, router) from @/lib/utils instead.',
        },
        {
          selector: "CallExpression[callee.property.name='replace'][callee.object.name='router']",
          message: 'Direct use of router.replace is forbidden in Capacitor. Use nativeNavigate(path, router) from @/lib/utils instead.',
        },
        {
          selector: "CallExpression[callee.name='redirect']",
          message: 'Direct use of redirect() is forbidden in Capacitor. Use nativeNavigate(path, router) from @/lib/utils instead or handle via logic.',
        },
        {
          selector: "Literal[value=/^\/api\/]/",
          message: 'Direct /api/ literals are forbidden in mobile builds. Use apiClient instead.',
        },
        {
          selector: "TemplateLiteral > * > Literal[value=/^\/api\/]/",
          message: 'Direct /api/ literals are forbidden in mobile builds. Use apiClient instead.',
        },
      ],
    },
  },
  {
    files: ['src/components/home/widgets/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='filter'][callee.object.name='tasks']",
          message: 'WIDGET VIOLATION: Do not filter raw "tasks" in widgets. Use dashboardMetrics.* or compute in dashboardMetrics.ts.',
        },
        {
          selector: "CallExpression[callee.property.name='filter'][callee.object.name='events']",
          message: 'WIDGET VIOLATION: Do not filter raw "events" in widgets. Use dashboardMetrics.* or compute in dashboardMetrics.ts.',
        },
        {
          selector: "CallExpression[callee.property.name='reduce']",
          message: 'WIDGET VIOLATION: Do not use .reduce() in widgets to compute metrics. Use dashboardMetrics.ts.',
        }
      ]
    }
  },
]

export default eslintConfig