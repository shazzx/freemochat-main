import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import commonjs from 'vite-plugin-commonjs'

export default defineConfig(({ mode }) => {
  // const env = loadEnv(mode, process.cwd(), '');
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
    // define: {
    //   'process.env': env
    // },
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
