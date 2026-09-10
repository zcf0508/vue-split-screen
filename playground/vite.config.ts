import * as path from 'node:path';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      include: [
        /\.[tj]sx?$/,
        /\.vue$/,
        /\.vue\?vue/,
      ],
      imports: ['vue', 'vue-router', '@vueuse/core'],
      dirs: ['src/hooks', 'src/store', 'src/utils', 'src/api'],
      dts: 'src/auto-import.d.ts',
    }),
    Components({
      dirs: ['src/components'],
      extensions: ['vue'],
      deep: true,
      dts: 'src/components.d.ts',
      resolvers: [],
    }),
    UnoCSS(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      'vue-split-screen': path.resolve(import.meta.dirname, '../src'),
    },
    dedupe: ['vue', 'vue-router'],
  },
});
