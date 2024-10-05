import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import commonjs from 'vite-plugin-commonjs'

export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), commonjs()],
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173
    },
    optimizeDeps: {
      include: ['tailwindcss-animate'],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
