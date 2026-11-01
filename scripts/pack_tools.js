const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const engineDir = path.join(__dirname, '../resources/engine');
const filesToPack = ['nanoguard.exe', 'nanoguard-fastscan.exe', 'compile_bridge.bat'];

const bundle = {};

for (const file of filesToPack) {
    const filePath = path.join(engineDir, file);
    if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath);
        console.log(`Compressing ${file} (${raw.length} bytes)...`);
        const compressed = zlib.brotliCompressSync(raw, {
            params: {
                [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
            }
        });
        bundle[file] = compressed.toString('base64');
        console.log(`-> ${file} brotli-packed: ${compressed.length} bytes (ratio: ${(raw.length / compressed.length).toFixed(2)})`);
    }
}

const outPath = path.join(engineDir, 'engine_pack.br.json');
fs.writeFileSync(outPath, JSON.stringify(bundle), 'utf8');
console.log(`Created ultra-compressed tool bundle: ${outPath} (${fs.statSync(outPath).size} bytes)`);
