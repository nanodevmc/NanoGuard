import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  engine: 'cpp' | 'rust';
  setEngine: (eng: 'cpp' | 'rust') => void;
  threads: number;
  setThreads: (t: number) => void;
  autoOpen: boolean;
  setAutoOpen: (v: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  engine,
  setEngine,
  threads,
  setThreads,
  autoOpen,
  setAutoOpen,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        style={{
          width: '540px',
          backgroundColor: '#0c100d',
          border: '1px solid #1f2721',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.6)',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 18px',
            backgroundColor: '#070a08',
            borderBottom: '1px solid #1f2721',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>⚙</span>
            <span style={{ color: '#eaf0ea', fontWeight: 800, fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>
              SETTINGS // NANOGUARD CORE
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9aa69e',
              cursor: 'pointer',
              fontSize: '15px',
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Engine Selector */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#9aa69e', fontFamily: 'JetBrains Mono, monospace', marginBottom: '8px' }}>
              STATIC AUDIT ENGINE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div
                onClick={() => setEngine('cpp')}
                style={{
                  padding: '10px',
                  backgroundColor: engine === 'cpp' ? '#131814' : '#070a08',
                  border: engine === 'cpp' ? '1px solid #9bf246' : '1px solid #1f2721',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: engine === 'cpp' ? '#9bf246' : '#eaf0ea', fontFamily: 'JetBrains Mono, monospace' }}>
                  C++17 Native Engine
                </div>
                <div style={{ fontSize: '10px', color: '#5f6b62', marginTop: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                  Точный байткод-парсер, Constant Pool эвристика, декомпилятор инструкций
                </div>
              </div>

              <div
                onClick={() => setEngine('rust')}
                style={{
                  padding: '10px',
                  backgroundColor: engine === 'rust' ? '#131814' : '#070a08',
                  border: engine === 'rust' ? '1px solid #9bf246' : '1px solid #1f2721',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: engine === 'rust' ? '#9bf246' : '#eaf0ea', fontFamily: 'JetBrains Mono, monospace' }}>
                  Rust FastScan Engine
                </div>
                <div style={{ fontSize: '10px', color: '#5f6b62', marginTop: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                  Многопоточный Rayon сканер, zero-copy ZIP, YARA сигнатуры
                </div>
              </div>
            </div>
          </div>

          {/* Threads Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#9aa69e', fontFamily: 'JetBrains Mono, monospace' }}>
                THREADS
              </span>
              <span style={{ fontSize: '11px', color: '#9bf246', fontFamily: 'JetBrains Mono, monospace' }}>{threads}</span>
            </div>
            <input
              type="range"
              min="1"
              max="16"
              value={threads}
              onChange={(e) => setThreads(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: '#9bf246' }}
            />
          </div>

          {/* Auto open in Explorer */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoOpen}
              onChange={(e) => setAutoOpen(e.target.checked)}
              style={{ accentColor: '#9bf246' }}
            />
            <span style={{ fontSize: '12px', color: '#eaf0ea', fontFamily: 'JetBrains Mono, monospace' }}>
              Автоматически открывать проводник после защиты
            </span>
          </label>

          {/* About / Info */}
          <div
            style={{
              padding: '12px',
              backgroundColor: '#131814',
              borderRadius: '6px',
              border: '1px solid #1f2721',
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              color: '#9aa69e',
              lineHeight: '1.6',
            }}
          >
            <div>Версия: <span style={{ color: '#9bf246' }}>v0.1.2</span></div>
            <div>
              Разработчик: <a href="https://t.me/WineSquad" target="_blank" rel="noreferrer" style={{ color: '#9bf246', textDecoration: 'none' }}>NanoDev (t.me/WineSquad)</a>
            </div>
            <div style={{ color: '#5f6b62', fontSize: '10px', marginTop: '4px' }}>
              100% Offline // Нулевая телеметрия // Локальная обработка
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#070a08',
            borderTop: '1px solid #1f2721',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              backgroundColor: '#9bf246',
              color: '#070a08',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 800,
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              cursor: 'pointer',
            }}
          >
            ЗАКРЫТЬ
          </button>
        </div>
      </div>
    </div>
  );
};
