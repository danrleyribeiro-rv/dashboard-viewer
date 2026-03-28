import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

function htmlEnvPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'html-env-plugin',
    transformIndexHtml(html) {
      const companyName = env.VITE_COMPANY_NAME || 'Dashboard'
      const description = env.VITE_APP_DESCRIPTION || 'BI Dashboard Viewer Application'
      const faviconUrl = env.VITE_FAVICON_URL || '/favicon.ico'
      return html
        .replace(/<title>.*<\/title>/, `<title>${companyName} - Dashviewer</title>`)
        .replace(
          /<meta name="description" content="[^"]*" \/>/,
          `<meta name="description" content="${description}" />`
        )
        .replace(
          /<link rel="icon" href="[^"]*" \/>/,
          `<link rel="icon" href="${faviconUrl}" />`
        )
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), htmlEnvPlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
