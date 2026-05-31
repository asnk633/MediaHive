---
name: learned-mistakes
description: A living record of specific mistakes, sharp edges, and gotchas encountered while building the MediaHive application. Always check this before writing code to avoid repeating historical errors.
---

# MediaHive Lessons Learned & Mistake Tracker

This skill serves as a self-annealing memory bank. Before implementing new features or refactoring, review these past mistakes to ensure they are not repeated.

## 📱 Flutter / Mobile App
- **Flutter Supabase Count Queries**: When querying Supabase in Dart/Flutter, using `.count(CountOption.exact)` does not necessarily return an object with a `.count` property like the JS client does. It can lead to silent type failures resulting in `0` if treated as dynamic. Safest pattern for small data sets is to select the IDs and use `(response as List).length`.
- **Flutter ConsumerWidget Context**: When extracting helper widget builder methods (e.g., `_buildPageHeader()`) inside a `ConsumerWidget`, **always explicitly pass `BuildContext context`** as an argument if you need to use routing (`context.push`), theming, or MediaQuery. The `context` is only available within the `build(BuildContext context, WidgetRef ref)` method scope and is not a class-level property.
- **Role-Based Routing Constraints**: Never build nested authenticated routes that completely bypass a main screen for admins (e.g., routing admins directly to `/governance/command-center` instead of `/governance`). Allow all valid users to see the base screen, and provide an explicit UI entry point (like a button) for admins to access their specialized deeper views.

## 🌐 Next.js / Web App
- **Supabase safeQuery Typings**: When using the custom `safeQuery` wrapper in `canonicalDataService.ts`, the TypeScript compiler may not accurately infer the `.count` property on the returned data object when utilizing Supabase's `head: true` count queries. You must explicitly cast the result (e.g., `(inventoryRes as any).count`) to prevent strict TS compilation errors during the production Next.js build.
- **Promise.all Destructuring Mismatches**: When adding a new asynchronous call to an existing `Promise.all` array, always ensure you update the destructuring array on the left side to perfectly match the length and order of the promises. Failure to do so leads to "Cannot find name" TS errors.

## 🔄 General
- **Static vs Live Data Validation**: Before calling a UI feature "done", rigorously search the component file for any hardcoded static numbers or strings (e.g., dummy percentages, hardcoded `120` limits, demo user names). Ensure all visible metrics are explicitly wired to a backend data source.

*Add new mistakes to this list immediately after diagnosing and fixing them.*
