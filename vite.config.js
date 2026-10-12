import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const openRouterKey =
    env.VITE_OPENROUTER_API_KEY ||
    env.OPENROUTER_API_KEY ||
    ''

  return {
    plugins: [react()],
    define: {
      'process.env.OPENROUTER_API_KEY': JSON.stringify(openRouterKey),
      'import.meta.env.OPENROUTER_API_KEY': JSON.stringify(openRouterKey),
    },
  }
})
