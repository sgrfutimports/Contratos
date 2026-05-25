import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

import { execSync } from 'child_process';

// Get current git hash and commit count
let gitHash = 'unknown';
let gitCount = '0';
let gitDate = new Date().toISOString().split('T')[0];

try {
  gitHash = execSync('git rev-parse --short HEAD').toString().trim();
  gitCount = execSync('git rev-list --count HEAD').toString().trim();
  gitDate = execSync('git log -1 --format=%cd --date=short').toString().trim();
} catch (e) {
  console.warn('Could not retrieve git info.');
}

export default defineConfig(() => {
  return {
    define: {
      __APP_VERSION__: JSON.stringify(`1.5.${gitCount}`),
      __GIT_HASH__: JSON.stringify(gitHash),
      __GIT_DATE__: JSON.stringify(gitDate),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Exclude server-side data directories to prevent page reloads on db/log writes.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: [
          '**/database/**',
          '**/backups/**',
          '**/uploads/**',
          '**/logs/**',
          '**/node_modules/**',
        ],
      },
    },
  };
});
