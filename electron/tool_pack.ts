import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as zlib from 'zlib';
import { app } from 'electron';

export class ToolPackManager {
  private static extractedDir: string | null = null;

  public static getExtractedEngineDir(): string {
    if (this.extractedDir && fs.existsSync(this.extractedDir)) {
      return this.extractedDir;
    }

    const baseDir = app ? app.getPath('userData') : os.tmpdir();
    const targetDir = path.join(baseDir, 'nanoguard_engine_bin');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    this.extractedDir = targetDir;
    this.ensureToolsExtracted(targetDir);
    return targetDir;
  }

  public static getToolPath(name: string): string | null {
    const dir = this.getExtractedEngineDir();
    const exeName = process.platform === 'win32' ? (name.endsWith('.exe') || name.endsWith('.bat') ? name : `${name}.exe`) : name;
    const target = path.join(dir, exeName);
    if (fs.existsSync(target)) {
      return target;
    }
    return null;
  }

  private static ensureToolsExtracted(targetDir: string): void {
    const candidates = [
      path.join(process.resourcesPath || '', 'engine', 'engine_pack.br.json'),
      path.join(process.resourcesPath || '', 'engine_pack.br.json'),
      path.join(process.cwd(), 'resources/engine', 'engine_pack.br.json'),
      path.join(__dirname, '../../resources/engine', 'engine_pack.br.json'),
      path.join(__dirname, '../resources/engine', 'engine_pack.br.json'),
    ];

    let packFile: string | null = null;
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        packFile = c;
        break;
      }
    }

    if (!packFile) return;

    try {
      const rawJson = fs.readFileSync(packFile, 'utf8');
      const bundle = JSON.parse(rawJson) as Record<string, string>;

      for (const [filename, base64Compressed] of Object.entries(bundle)) {
        const destPath = path.join(targetDir, filename);
        if (!fs.existsSync(destPath) || fs.statSync(destPath).size === 0) {
          const compBuffer = Buffer.from(base64Compressed, 'base64');
          const decompressed = zlib.brotliDecompressSync(compBuffer);
          fs.writeFileSync(destPath, decompressed);
          try {
            fs.chmodSync(destPath, 0o755);
          } catch {}
        }
      }
    } catch (e) {
      console.error('[ToolPackManager] Failed to extract tool pack:', e);
    }
  }
}
