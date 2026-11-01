import * as tauriCore from '@tauri-apps/api/core';
import * as tauriDpi from '@tauri-apps/api/dpi';
import * as tauriWindow from '@tauri-apps/api/window';

export interface Finding {
  category: string;
  severity: string;
  class: string;
  method: string;
  offset: number;
  instruction: string;
  description: string;
  snippet?: string;
}

export interface AuditReport {
  target: string;
  jar_name?: string;
  total_classes: number;
  total_packages?: number;
  obfuscator: string;
  entropy?: number;
  danger_score: number;
  findings: Finding[];
}

export interface ProtectOptions {
  jarPath: string;
  stripLvt: boolean;
  encryptStrings: boolean;
  antiDecompile: boolean;
  enableVm: boolean;
  antiTamper: boolean;
  injectBootstrap: boolean;
  dummyMesh: boolean;
  flattenRoot: boolean;
  nativeDll: boolean;
  ownerName?: string;
  outputPath?: string;
}

export interface ProtectResult {
  success: boolean;
  error?: string;
  outputPath?: string;
  outputName?: string;
  stats?: {
    classesProcessed: number;
    strippedAttributes: number;
    encryptedStrings: number;
    obfuscatedMethods: number;
    dummyClasses: number;
  };
  outputSize?: string;
  duration?: string;
}

// Check if running inside Tauri environment
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

// Unified Bridge initialization
export function setupTauriBridge(): void {
  if (typeof window === 'undefined') return;

  // If already on Electron or another provider, don't overwrite if not Tauri
  if (!isTauri() && (window as any).nanoGuardAPI) {
    return;
  }

  (window as any).nanoGuardAPI = {
    auditJar: async (jarPath: string, engine?: 'cpp' | 'rust'): Promise<AuditReport> => {
      if (isTauri()) {
        return await tauriCore.invoke('audit_jar', { jarPath, engine: engine || 'cpp' });
      }
      throw new Error('Not running inside supported runtime');
    },

    protectJar: async (options: ProtectOptions): Promise<ProtectResult> => {
      if (isTauri()) {
        return await tauriCore.invoke('protect_jar', { options });
      }
      throw new Error('Not running inside supported runtime');
    },

    selectJarFile: async (): Promise<string | null> => {
      if (isTauri()) {
        return await tauriCore.invoke('select_jar_file');
      }
      return null;
    },

    selectOutputDir: async (): Promise<string | null> => {
      if (isTauri()) {
        return await tauriCore.invoke('select_output_dir');
      }
      return null;
    },

    selectDirectory: async (): Promise<string | null> => {
      if (isTauri()) {
        return await tauriCore.invoke('select_directory');
      }
      return null;
    },

    listJarsInDirectory: async (dirPath: string): Promise<string[]> => {
      if (isTauri()) {
        return await tauriCore.invoke('list_jars_in_directory', { dirPath });
      }
      return [];
    },

    openPath: async (targetPath: string): Promise<boolean> => {
      if (isTauri()) {
        return await tauriCore.invoke('open_path', { targetPath });
      }
      return false;
    },

    getSystemStats: async () => {
      if (isTauri()) {
        return await tauriCore.invoke('get_system_stats');
      }
      return { cpu: '1.2%', ram: '32 MB', telemetry: '0% TELEMETRY (OFFLINE)' };
    },

    windowControl: async (action: 'minimize' | 'maximize' | 'close') => {
      if (isTauri()) {
        const win = tauriWindow.getCurrentWindow();
        if (action === 'minimize') {
          await win.minimize();
        } else if (action === 'maximize') {
          const isMax = await win.isMaximized();
          if (isMax) {
            await win.unmaximize();
          } else {
            await win.maximize();
          }
        } else if (action === 'close') {
          await win.close();
        }
      }
    },

    checkOtaUpdates: async () => {
      return { available: false, version: '0.1.2' };
    },

    downloadOtaModule: async () => {
      return { success: true };
    },
  };
}
