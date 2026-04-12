/// <reference types="vite/client" />
import { createClient } from '@insforge/sdk'

// InsForge client — initialized once and reused across the app
const insforge = createClient({
  baseUrl: import.meta.env.VITE_INSFORGE_URL,
  anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY,
})

export default insforge
