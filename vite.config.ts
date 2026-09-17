import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

const buildTimestamp = Date.now();
const appVersion = '2.1.0';

function versionEmitterPlugin(): Plugin {
  return {
    name: 'version-emitter',
    buildStart() {
      const versionObj = {
        version: appVersion,
        buildTime: buildTimestamp,
        builtAt: new Date(buildTimestamp).toISOString(),
      };
      const publicDir = path.resolve(process.cwd(), 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      fs.writeFileSync(path.resolve(publicDir, 'version.json'), JSON.stringify(versionObj, null, 2));
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), versionEmitterPlugin()],
  base: './',
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp),
    __APP_VERSION__: JSON.stringify(appVersion),
  },
});
