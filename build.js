// Build script: reads HTML/CSS and generates src/page.js with embedded content
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const html = readFileSync(resolve(__dirname, 'src/public/index.html'), 'utf8');
const css = readFileSync(resolve(__dirname, 'src/public/styles.css'), 'utf8');

// Inject CSS inline into the HTML (replace the /public/styles.css link)
const fullHtml = html.replace(
    '<link rel="stylesheet" href="/public/styles.css">',
    `<style>${css}</style>`
);

// Escape backticks and dollar signs for template literal
const escaped = fullHtml.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

const output = `// Auto-generated — do not edit. Run: node build.js\nexport const PAGE_HTML = \`${escaped}\`;\n`;

writeFileSync(resolve(__dirname, 'src/page.js'), output, 'utf8');
console.log('Built src/page.js');
