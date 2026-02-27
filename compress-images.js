/**
 * Comprime imágenes JPG y PNG del proyecto para reducir peso.
 * Ejecutar: npm run compress-images
 *
 * Opciones:
 *   --backup   Guarda copia de cada imagen como .original antes de comprimir
 *   --dry-run  Solo muestra qué archivos se procesarían
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = __dirname;
const EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const JPEG_QUALITY = 82;
const doBackup = process.argv.includes('--backup');
const dryRun = process.argv.includes('--dry-run');

function getAllImagePaths(dir, list = []) {
    if (!fs.existsSync(dir)) return list;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (e.name !== 'node_modules' && e.name !== '.git') getAllImagePaths(full, list);
        } else if (EXTENSIONS.includes(path.extname(e.name).toLowerCase())) {
            list.push(full);
        }
    }
    return list;
}

async function compressFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    if (dryRun) {
        console.log('[dry-run]', path.relative(ROOT, filePath));
        return;
    }

    const before = fs.statSync(filePath).size;
    let pipeline = sharp(filePath).rotate();

    if (ext === '.png') {
        pipeline = pipeline.png({ compressionLevel: 9 });
    } else {
        pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
    }

    const buffer = await pipeline.toBuffer();

    if (doBackup) {
        const backupPath = filePath + '.original';
        fs.copyFileSync(filePath, backupPath);
        console.log('  Backup:', path.relative(ROOT, backupPath));
    }

    fs.writeFileSync(filePath, buffer);
    const after = fs.statSync(filePath).size;
    const saved = ((1 - after / before) * 100).toFixed(1);
    console.log(path.relative(ROOT, filePath), before, '->', after, 'bytes', '(' + saved + '% menos)');
}

async function main() {
    const images = getAllImagePaths(ROOT);
    if (images.length === 0) {
        console.log('No se encontraron imágenes .jpg/.jpeg/.png en el proyecto.');
        return;
    }
    console.log('Imágenes a procesar:', images.length);
    if (doBackup) console.log('Modo: con backup .original');
    if (dryRun) console.log('Modo: solo listar (--dry-run)\n');

    for (const p of images) {
        try {
            await compressFile(p);
        } catch (err) {
            console.error('Error en', p, err.message);
        }
    }
    console.log('\nListo.');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
