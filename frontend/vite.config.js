import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

function staticWorker() {
  let root;
  let output;
  return {
    name: 'bplo-static-worker',
    apply: 'build',
    configResolved(config) { root = config.root; output = resolve(root, config.build.outDir); },
    closeBundle() {
      const walk = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
        entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]);
      const files = walk(join(output, 'assets')).map(file => '/' + file.slice(output.length + 1).replaceAll('\\', '/')).sort();
      const assets = ['/index.html', '/calapan-bplo-logo.png', ...files];
      const template = readFileSync(join(root, 'public/sw.js'), 'utf8');
      const hash = createHash('sha256').update(template);
      assets.forEach(file => hash.update(file).update(readFileSync(join(output, file.slice(1)))));
      const version = hash.digest('hex').slice(0, 16);
      const worker = template.replace("const BUILD_VERSION = 'development';", `const BUILD_VERSION = '${version}';`)
        .replace('/* BUILD_ASSETS */ []', JSON.stringify(assets));
      writeFileSync(join(output, 'sw.js'), worker);
    },
  };
}

export default defineConfig({
  plugins: [staticWorker()],
  server: { host: '0.0.0.0', port: 4173, allowedHosts: ['terminal.local'] },
});
