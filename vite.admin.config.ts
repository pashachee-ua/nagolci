import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath } from 'node:url';
export default defineConfig({root:'admin',publicDir:'../public',plugins:[react()],resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))},dedupe:['react','react-dom']},css:{postcss:{plugins:[tailwindcss()]}},build:{outDir:'../dist/admin',emptyOutDir:true}});
