// scripts/remove-unused-deps.js
// Script to remove unused dependencies identified by depcheck

const { execSync } = require('child_process');
const fs = require('fs');

// List of unused dependencies to remove
const unusedDeps = [
  '@babel/parser',
  '@dnd-kit/modifiers',
  '@headlessui/react',
  '@heroicons/react',
  '@hookform/resolvers',
  '@number-flow/react',
  '@react-three/drei',
  '@react-three/fiber',
  '@tabler/icons-react',
  '@tailwindcss/typography',
  '@tsparticles/engine',
  '@tsparticles/react',
  '@tsparticles/slim',
  'atmn',
  'autumn-js',
  'bcrypt',
  'better-auth',
  'cobe',
  'date-fns',
  'dotted-map',
  'embla-carousel-auto-scroll',
  'embla-carousel-autoplay',
  'estree-walker',
  'flubber',
  'framer-motion',
  'mini-svg-data-uri',
  'motion-dom',
  'qss',
  'react-dropzone',
  'react-fast-marquee',
  'react-icons',
  'react-intersection-observer',
  'react-responsive-masonry',
  'react-syntax-highlighter',
  'react-wrap-balancer',
  'simplex-noise',
  'swiper',
  'tailwindcss-animate',
  'three',
  'three-globe',
  'zod'
];

const unusedDevDeps = [
  '@tailwindcss/postcss',
  '@types/react-syntax-highlighter',
  '@types/three',
  'autoprefixer',
  'eslint',
  'eslint-config-next',
  'source-map-explorer',
  'tailwindcss',
  'tsconfig-paths',
  'tw-animate-css'
];

console.log('Removing unused dependencies...');

try {
  // Remove unused dependencies
  if (unusedDeps.length > 0) {
    console.log('Removing unused dependencies:', unusedDeps.join(', '));
    execSync(`npm uninstall ${unusedDeps.join(' ')}`, { stdio: 'inherit' });
  }

  // Remove unused dev dependencies
  if (unusedDevDeps.length > 0) {
    console.log('Removing unused dev dependencies:', unusedDevDeps.join(', '));
    execSync(`npm uninstall --save-dev ${unusedDevDeps.join(' ')}`, { stdio: 'inherit' });
  }

  console.log('Unused dependencies removed successfully!');
} catch (error) {
  console.error('Error removing dependencies:', error.message);
}