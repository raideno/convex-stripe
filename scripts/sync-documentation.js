import fs from 'fs';
import path from 'path';

const ROOT_README_PATH = path.resolve('README.md');
const TARGETS = [
    path.resolve('documentation/README.md'),
    path.resolve('packages/lib/README.md'),
];

if (!fs.existsSync(ROOT_README_PATH)) {
    console.error('[sync-documentation.js]: root README.md not found:', ROOT_README_PATH);
    process.exit(1);
}
const content = fs.readFileSync(ROOT_README_PATH);
TARGETS.forEach(target => {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
    console.log(`[sync-documentation.js]: copied README.md to ${target}`);
});
