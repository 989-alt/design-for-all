import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';

// file:// 에서 열리도록 module·crossorigin 을 뗀다(iife 단일 번들이라 가능)
const classicScript: Plugin = {
  name: 'classic-script',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace(/<script type="module" crossorigin/g, '<script defer').replace(/<link rel="stylesheet" crossorigin/g, '<link rel="stylesheet"'),
};

export default defineConfig({
  base: './',
  plugins: [preact(), classicScript],
  build: {
    modulePreload: false,
    cssCodeSplit: false,
    rollupOptions: { output: { format: 'iife' } },
  },
});
