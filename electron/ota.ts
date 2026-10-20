import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';

export interface ModuleUpdateInfo {
  name: string;
  version: string;
  downloadUrl: string;
  size: number;
  type: 'cpp-engine' | 'rust-fastscan' | 'rules' | 'heuristics';
}

export interface OtaCheckResult {
  hasUpdates: boolean;
  latestVersion: string;
  currentVersion: string;
  modules: ModuleUpdateInfo[];
}

export class OtaManager {
  private static getUpdatesDir(): string {
    const dir = path.join(app.getPath('userData'), 'updates', 'engine');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  public static getOverriddenBinary(name: string): string | null {
    const exeName = process.platform === 'win32' ? `${name}.exe` : name;
    const target = path.join(this.getUpdatesDir(), exeName);
    if (fs.existsSync(target)) {
      return target;
    }
    return null;
  }

  public static async checkForUpdates(currentVersion: string): Promise<OtaCheckResult> {
    const repo = 'NanoDev1488/NanoGuard';
    const url = `https://api.github.com/repos/${repo}/releases/latest`;

    return new Promise((resolve) => {
      const req = https.get(
        url,
        {
          headers: {
            'User-Agent': 'NanoGuard-OTA-Client',
            Accept: 'application/vnd.github.v3+json',
          },
        },
        (res) => {
          if (res.statusCode !== 200) {
            resolve({
              hasUpdates: false,
              latestVersion: currentVersion,
              currentVersion,
              modules: [],
            });
            return;
          }

          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const release = JSON.parse(data);
              const latestTag = (release.tag_name || '').replace(/^v/, '');
              const assets = release.assets || [];

              const osKey =
                process.platform === 'win32'
                  ? 'windows'
                  : process.platform === 'darwin'
                  ? 'macos'
                  : 'linux';

              const modules: ModuleUpdateInfo[] = [];

              for (const a of assets) {
                const name: string = a.name.toLowerCase();
                // Match C++ core engine for current OS
                if (name.includes('nanoguard-cli') && name.includes(osKey)) {
                  modules.push({
                    name: a.name,
                    version: latestTag,
                    downloadUrl: a.browser_download_url,
                    size: a.size,
                    type: 'cpp-engine',
                  });
                }
                // Match Rust fastscan for current OS
                if (name.includes('nanoguard-fastscan') && name.includes(osKey)) {
                  modules.push({
                    name: a.name,
                    version: latestTag,
                    downloadUrl: a.browser_download_url,
                    size: a.size,
                    type: 'rust-fastscan',
                  });
                }
                // Match rules / heuristics bundle
                if (name.endsWith('.ngrule') || name.includes('rules.bundle')) {
                  modules.push({
                    name: a.name,
                    version: latestTag,
                    downloadUrl: a.browser_download_url,
                    size: a.size,
                    type: 'rules',
                  });
                }
              }

              const hasUpdates = latestTag !== currentVersion && modules.length > 0;

              resolve({
                hasUpdates,
                latestVersion: latestTag,
                currentVersion,
                modules,
              });
            } catch {
              resolve({
                hasUpdates: false,
                latestVersion: currentVersion,
                currentVersion,
                modules: [],
              });
            }
          });
        }
      );

      req.on('error', () => {
        resolve({
          hasUpdates: false,
          latestVersion: currentVersion,
          currentVersion,
          modules: [],
        });
      });
    });
  }

  public static async downloadModule(
    downloadUrl: string,
    targetFileName: string
  ): Promise<boolean> {
    const dest = path.join(this.getUpdatesDir(), targetFileName);
    const tempDest = `${dest}.tmp`;

    return new Promise((resolve) => {
      const file = fs.createWriteStream(tempDest);
      const request = (uri: string) => {
        https
          .get(uri, { headers: { 'User-Agent': 'NanoGuard-OTA-Client' } }, (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              request(res.headers.location);
              return;
            }
            if (res.statusCode !== 200) {
              file.close();
              try { fs.unlinkSync(tempDest); } catch (_) {}
              resolve(false);
              return;
            }

            res.pipe(file);
            file.on('finish', () => {
              file.close(() => {
                try {
                  if (fs.existsSync(dest)) {
                    fs.unlinkSync(dest);
                  }
                  fs.renameSync(tempDest, dest);
                  if (process.platform !== 'win32') {
                    fs.chmodSync(dest, 0o755);
                  }
                  resolve(true);
                } catch {
                  resolve(false);
                }
              });
            });
          })
          .on('error', () => {
            file.close();
            try { fs.unlinkSync(tempDest); } catch (_) {}
            resolve(false);
          });
      };

      request(downloadUrl);
    });
  }
}
