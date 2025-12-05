# Tailwind v4 migration notes

Steps to migrate safely from Tailwind v3 -> v4:
1. Create a branch `chore/tailwind-v4-migration`.
2. Install latest Tailwind + PostCSS: `npm i -D tailwindcss@latest postcss@latest autoprefixer@latest`.
3. Run `npx tailwindcss init -p` -> inspect generated config and merge tokens from current `tailwind.config.js`.
