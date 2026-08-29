import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Split the large, rarely-changing dependencies out of the app bundle so no
// single chunk trips the 500 kB warning and vendor code stays cached between
// deploys. Rolldown (Vite 8) requires manualChunks to be a function, and it
// hands us module ids that always use forward slashes.
const vendorChunks = [
  ['react', ['react', 'react-dom', 'scheduler', 'react-router', 'react-router-dom']],
  ['clerk', ['@clerk']],
  ['editor', ['quill', 'parchment']],
  ['media', ['react-youtube', 'youtube-player']],
]

const MARKER = '/node_modules/'

const chunkForModule = (id) => {
  const index = id.lastIndexOf(MARKER)

  if (index === -1) return undefined

  const packagePath = id.slice(index + MARKER.length)

  for (const [chunkName, packages] of vendorChunks) {
    if (packages.some((name) => packagePath === name || packagePath.startsWith(name + '/'))) {
      return chunkName
    }
  }

  return undefined
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: chunkForModule,
      },
    },
  },
})
