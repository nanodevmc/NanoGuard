import React, { useState } from 'react';

interface ArmorViewProps {
  onSelectFile: () => void;
  selectedJar: string | null;
  onProtectComplete?: (outPath: string) => void;
}

interface ProtectResult {
  outputPath: string;
  stats: {
    strippedAttributes: number;
    encryptedStrings: number;
    injectedTraps: number;
    dummyClasses?: number;
    originalSize: number;
    protectedSize: number;
    compressionPercent: string;
  };
}

export const ArmorView: React.FC<ArmorViewProps> = ({ onSelectFile, selectedJar, onProtectComplete }) => {
  const [stripLvt, setStripLvt] = useState(true);
  const [encryptStrings, setEncryptStrings] = useState(true);
  const [antiDecompile, setAntiDecompile] = useState(true);
  const [antiTamper, setAntiTamper] = useState(true);
  const [enableVmFallback, setEnableVmFallback] = useState(true);
  const [injectBootstrap, setInjectBootstrap] = useState(true);
  const [dummyMesh, setDummyMesh] = useState(true);
  const [ownerName, setOwnerName] = useState('NanoDev');
  const [protecting, setProtecting] = useState(false);
  const [result, setResult] = useState<ProtectResult | null>(null);
  const [customOutPath, setCustomOutPath] = useState<string>('');

  const defaultOutPath = selectedJar ? selectedJar.replace(/\.jar$/i, '_protected.jar') : '';
  const finalOut = customOutPath || defaultOutPath;

  const handleSelectOutputDir = async () => {
    // @ts-ignore
    if (window.nanoGuardAPI?.selectOutputDir) {
      // @ts-ignore
      const dir = await window.nanoGuardAPI.selectOutputDir();
      if (dir && selectedJar) {
        const base = selectedJar.split(/[/\\]/).pop()?.replace(/\.jar$/i, '_protected.jar');
        setCustomOutPath(`${dir}\\${base}`);
      }
    }
  };

  const handleProtect = async () => {
    if (!selectedJar) return;
    setProtecting(true);
    setResult(null);

    try {
      // @ts-ignore
      if (window.nanoGuardAPI?.protectJar) {
        // @ts-ignore
        const res = await window.nanoGuardAPI.protectJar({
          jarPath: selectedJar,
          stripLvt,
          encryptStrings,
          antiDecompile,
          enableVm: enableVmFallback,
          antiTamper,
          injectBootstrap,
          dummyMesh,
          ownerName: ownerName.trim() || undefined,
          outputPath: finalOut,
        });
        if (res && res.success) {
          setResult(res);
          if (onProtectComplete) onProtectComplete(res.outputPath);
        } else {
          setResult(res);
        }
      } else {
        // Fallback simulation for browser testing
        setTimeout(() => {
          const fakeRes: ProtectResult = {
            outputPath: finalOut || 'C:\\Plugins\\suspect_plugin_protected.jar',
            stats: {
              strippedAttributes: 142,
              encryptedStrings: 94,
              injectedTraps: 58,
              dummyClasses: 100,
              originalSize: 450200,
              protectedSize: 325400,
              compressionPercent: '27.7%',
            },
          };
          setResult(fakeRes);
          setProtecting(false);
        }, 800);
        return;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProtecting(false);
    }
  };

  const handleOpenInExplorer = async () => {
    if (!result?.outputPath) return;
    // @ts-ignore
    if (window.nanoGuardAPI?.openPath) {
      // @ts-ignore
      await window.nanoGuardAPI.openPath(result.outputPath);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
      {/* Hero Drop Box */}
      <div
        id="armor-drop-zone"
        onClick={onSelectFile}
        style={{
          border: '1px dashed #1f2721',
          borderRadius: '8px',
          padding: '22px',
          textAlign: 'center',
          backgroundColor: '#0c100d',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#9bf246';
          e.currentTarget.style.backgroundColor = '#131814';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#1f2721';
          e.currentTarget.style.backgroundColor = '#0c100d';
        }}
      >
        <div style={{ fontSize: '28px', color: '#9bf246' }}>🔒</div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#eaf0ea', fontFamily: 'JetBrains Mono, monospace' }}>
          {selectedJar ? selectedJar.split(/[/\\]/).pop() : 'DROP JAR FILE TO APPLY EXTREME ARMOR'}
        </div>
        <div style={{ fontSize: '11px', color: '#9aa69e', fontFamily: 'JetBrains Mono, monospace' }}>
          {selectedJar ? (
            <span style={{ color: '#9bf246' }}>{selectedJar}</span>
          ) : (
            'Нажмите или перетащите файл плагина для наложения многоуровневой защиты'
          )}
        </div>
      </div>

      {/* Multi-Layer Protection Options */}
      <div
        style={{
          backgroundColor: '#0c100d',
          border: '1px solid #1f2721',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#eaf0ea', fontFamily: 'JetBrains Mono, monospace' }}>
              PROTECTION LAYERS (v0.1.2 EXTREME SPEC)
            </span>
            <span
              style={{
                fontSize: '9px',
                fontFamily: 'JetBrains Mono, monospace',
                color: '#9bf246',
                backgroundColor: '#131814',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid #1f2721',
              }}
            >
              5/5 ACTIVE
            </span>
          </div>

          <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#5f6b62' }}>
            CROSS-PLATFORM HYBRID FALLBACK: PURE JVM VM + WASM
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {/* Option 1: Anti-Tamper & Dynamic Checksums */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px 12px',
              backgroundColor: '#131814',
              borderRadius: '6px',
              border: antiTamper ? '1px solid #334139' : '1px solid #1f2721',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={antiTamper}
              onChange={(e) => setAntiTamper(e.target.checked)}
              style={{ accentColor: '#9bf246', marginTop: '3px' }}
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#eaf0ea' }}>
                1. Полиморфные контрольные суммы & Anti-Tamper
              </div>
              <div style={{ fontSize: '10px', color: '#9aa69e', marginTop: '2px', lineHeight: '1.4' }}>
                Динамический хеш байткода на адресах вызовов. Любая модификация ломает цепочку констант.
              </div>
            </div>
          </label>

          {/* Option 2: Constant Pool Integrity Markers */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px 12px',
              backgroundColor: '#131814',
              borderRadius: '6px',
              border: antiDecompile ? '1px solid #334139' : '1px solid #1f2721',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={antiDecompile}
              onChange={(e) => setAntiDecompile(e.target.checked)}
              style={{ accentColor: '#9bf246', marginTop: '3px' }}
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#eaf0ea' }}>
                2. Маркеры в Constant Pool (Без внешних файлов)
              </div>
              <div style={{ fontSize: '10px', color: '#9aa69e', marginTop: '2px', lineHeight: '1.4' }}>
                Отказ от статичных маркеров. Синтетические CP-атрибуты с невалидными для декомпиляторов тегами.
              </div>
            </div>
          </label>

          {/* Option 3: Java <-> Native Bridge & Universal VM Fallback */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px 12px',
              backgroundColor: '#131814',
              borderRadius: '6px',
              border: enableVmFallback ? '1px solid #334139' : '1px solid #1f2721',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={enableVmFallback}
              onChange={(e) => setEnableVmFallback(e.target.checked)}
              style={{ accentColor: '#9bf246', marginTop: '3px' }}
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#eaf0ea' }}>
                3. Native RegisterNatives + Universal JVM VM Fallback
              </div>
              <div style={{ fontSize: '10px', color: '#9aa69e', marginTop: '2px', lineHeight: '1.4' }}>
                Рандомизированный JNI_OnLoad с зачисткой RAM. Если нативная среда недоступна — работает Pure JVM VM.
              </div>
            </div>
          </label>

          {/* Option 4: Anti-Dump & ClassLoader Guard */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px 12px',
              backgroundColor: '#131814',
              borderRadius: '6px',
              border: '1px solid #334139',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={true}
              disabled
              style={{ accentColor: '#9bf246', marginTop: '3px' }}
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#eaf0ea' }}>
                4. Антидамп и контроль ClassLoader (JavaAgent Guard)
              </div>
              <div style={{ fontSize: '10px', color: '#9aa69e', marginTop: '2px', lineHeight: '1.4' }}>
                Проверка стека вызовов и блокировка чтения байткода через Java Instrumentation / ByteBuddy.
              </div>
            </div>
          </label>

          {/* Option 5: Decoy Mesh & Custom Bootstrap Injector */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px 12px',
              backgroundColor: '#131814',
              borderRadius: '6px',
              border: dummyMesh ? '1px solid #334139' : '1px solid #1f2721',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={dummyMesh}
              onChange={(e) => setDummyMesh(e.target.checked)}
              style={{ accentColor: '#9bf246', marginTop: '3px' }}
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#eaf0ea' }}>
                5. 100+ Мусорных Decoy-классов & Bootstrap Injector
              </div>
              <div style={{ fontSize: '10px', color: '#9aa69e', marginTop: '2px', lineHeight: '1.4' }}>
                Тысячи строк запутанной арифметики в сетке вызовов. Точка входа перехватывается кастомным инжектором.
              </div>
            </div>
          </label>

          {/* Option 6: String Encryption & LVT Stripper */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px 12px',
              backgroundColor: '#131814',
              borderRadius: '6px',
              border: encryptStrings ? '1px solid #334139' : '1px solid #1f2721',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={encryptStrings}
              onChange={(e) => setEncryptStrings(e.target.checked)}
              style={{ accentColor: '#9bf246', marginTop: '3px' }}
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#eaf0ea' }}>
                6. Polymorphic String Scrambler & Metadata Strip
              </div>
              <div style={{ fontSize: '10px', color: '#9aa69e', marginTop: '2px', lineHeight: '1.4' }}>
                Шифрование строк уникальным ключом билда + удаление LVT, LineNumbers и SourceFile (-40% веса).
              </div>
            </div>
          </label>
        </div>

        {/* Output & Owner Row */}
        {selectedJar && (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              paddingTop: '6px',
              borderTop: '1px solid #1f2721',
            }}
          >
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#9aa69e', fontFamily: 'JetBrains Mono, monospace' }}>
                OUTPUT:
              </span>
              <input
                type="text"
                value={finalOut}
                onChange={(e) => setCustomOutPath(e.target.value)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  backgroundColor: '#131814',
                  border: '1px solid #1f2721',
                  borderRadius: '4px',
                  color: '#9bf246',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSelectOutputDir}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#131814',
                  border: '1px solid #334139',
                  color: '#eaf0ea',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  cursor: 'pointer',
                }}
              >
                Обзор...
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#9aa69e', fontFamily: 'JetBrains Mono, monospace' }}>
                WATERMARK:
              </span>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="NanoDev"
                style={{
                  width: '120px',
                  padding: '6px 10px',
                  backgroundColor: '#131814',
                  border: '1px solid #1f2721',
                  borderRadius: '4px',
                  color: '#eaf0ea',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        )}

        {/* Large Action Button */}
        {selectedJar && (
          <button
            id="btn-protect"
            onClick={handleProtect}
            disabled={protecting}
            style={{
              padding: '12px',
              backgroundColor: '#9bf246',
              color: '#070a08',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.05em',
              cursor: protecting ? 'wait' : 'pointer',
              boxShadow: '0 0 16px rgba(155, 242, 70, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            {protecting ? '⏳ ПРИМЕНЕНИЕ ЭКСТРЕМАЛЬНОЙ БРОНИ...' : '🔒 ЗАЩИТИТЬ ПЛАГИН И СОХРАНИТЬ JAR'}
          </button>
        )}
      </div>

      {/* Result Card */}
      {result && (
        <div
          style={{
            backgroundColor: '#0c100d',
            border: '1px solid #9bf246',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 0 20px rgba(155, 242, 70, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px', color: '#9bf246' }}>✓</span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#9bf246', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>
              ПЛАГИН УСПЕШНО ЗАЩИЩЕН // ВСЕ 5 СИСТЕМ АКТИВИРОВАНЫ
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ backgroundColor: '#131814', padding: '10px', borderRadius: '4px', border: '1px solid #1f2721' }}>
              <div style={{ fontSize: '10px', color: '#9aa69e', fontFamily: 'JetBrains Mono, monospace' }}>Удалено LVT/Debug</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#eaf0ea', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                {result.stats.strippedAttributes}
              </div>
            </div>

            <div style={{ backgroundColor: '#131814', padding: '10px', borderRadius: '4px', border: '1px solid #1f2721' }}>
              <div style={{ fontSize: '10px', color: '#9aa69e', fontFamily: 'JetBrains Mono, monospace' }}>Зашифровано строк</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#9bf246', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                {result.stats.encryptedStrings}
              </div>
            </div>

            <div style={{ backgroundColor: '#131814', padding: '10px', borderRadius: '4px', border: '1px solid #1f2721' }}>
              <div style={{ fontSize: '10px', color: '#9aa69e', fontFamily: 'JetBrains Mono, monospace' }}>Мусорных Decoy-классов</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffb224', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                {result.stats.dummyClasses || 100}
              </div>
            </div>

            <div style={{ backgroundColor: '#131814', padding: '10px', borderRadius: '4px', border: '1px solid #1f2721' }}>
              <div style={{ fontSize: '10px', color: '#9aa69e', fontFamily: 'JetBrains Mono, monospace' }}>Экономия размера</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#9bf246', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                {result.stats.compressionPercent}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#131814',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #1f2721',
            }}
          >
            <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#9aa69e' }}>
              Файл: <span style={{ color: '#9bf246' }}>{result.outputPath}</span>
            </div>

            <button
              onClick={handleOpenInExplorer}
              style={{
                padding: '4px 12px',
                backgroundColor: '#0c100d',
                border: '1px solid #9bf246',
                color: '#9bf246',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              📂 Открыть в проводнике
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
