import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

function normalizeBasePath(value) {
  const raw = String(value || '/').trim();
  if (!raw || raw === '/') return '/';

  const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: normalizeBasePath(process.env.VITE_BASE_PATH),
})
