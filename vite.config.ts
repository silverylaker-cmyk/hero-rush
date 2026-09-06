import { defineConfig } from 'vite';
import { readFileSync,writeFileSync,readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
export default defineConfig({ base: '/hero-rush/', plugins:[{name:'hero-rush-offline',apply:'build',closeBundle(){
  const assets=['./',...readdirSync('dist/assets').filter(n=>/\.(js|css)$/.test(n)).map(n=>'assets/'+n),'assets/units/atlas.png','assets/units/atlas.json','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
  const hash=createHash('sha256');for(const file of assets)hash.update(readFileSync('dist/'+(file==='./'?'index.html':file)));
  const source=readFileSync('dist/sw.js','utf8').replace("'hero-rush-v1'",JSON.stringify('hero-rush-'+hash.digest('hex').slice(0,12))).replace('const ASSETS = [];',`const ASSETS = ${JSON.stringify(assets)};`);
  writeFileSync('dist/sw.js',source);
}}],build: { rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } }, chunkSizeWarningLimit: 1600 }, server: { port: 5173, strictPort: true } });
