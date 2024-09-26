import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
   
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
    define: {
      'process.env': env
    },
    server: {
      host: '0.0.0.0',
      port: 5173
    },
    resolve: {
      
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
