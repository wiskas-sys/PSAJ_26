import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Memetakan alias "@/..." ke root proyek agar modul bisa diuji di luar Next.js.
const root = process.cwd();

export function resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) {
        const target = path.join(root, specifier.slice(2));
        return next(pathToFileURL(path.extname(target) ? target : `${target}.js`).href, context);
    }
    return next(specifier, context);
}

export function load(url, context, next) {
    if (url.startsWith('file:') && url.endsWith('.js') && !url.includes(`${path.sep}node_modules${path.sep}`))
        return next(url, { ...context, format: 'module' });
    return next(url, context);
}
