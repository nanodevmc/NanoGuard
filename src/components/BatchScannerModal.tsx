import React, { useState } from 'react';

export interface BatchItem {
  path: string;
  name: string;
  size: number;
  status: 'pending' | 'scanning' | 'done' | 'error';
  danger_score?: number;
  total_classes?: number;
  findings_count?: number;
  error?: string;
}

interface BatchScannerProps {
  onScanSingle: (jarPath: string) => Promise<any>;
}

export const BatchScannerModal: React.FC<BatchScannerProps & { isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
  onScanSingle,
}) => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [currentIdx, setCurrentIdx] = useState<number>(-1);

  if (!isOpen) return null;

  const handleSelectFolder = async () => {
    // @ts-ignore
    if (window.nanoGuardAPI?.selectDirectory) {
      // @ts-ignore
      const dir = await window.nanoGuardAPI.selectDirectory();
      if (dir) {
        // @ts-ignore
        const files: string[] = await window.nanoGuardAPI.listJarsInDirectory(dir);
        if (files && files.length > 0) {
          const newItems: BatchItem[] = files.map((f) => ({
            path: f,
            name: f.split(/[/\\]/).pop() || f,
            size: 0,
            status: 'pending',
          }));
          setItems(newItems);
        }
      }
    }
  };

  const startBatchScan = async () => {
    if (items.length === 0 || scanning) return;
    setScanning(true);

    for (let i = 0; i < items.length; i++) {
      setCurrentIdx(i);
      setItems((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: 'scanning' } : it))
      );

      try {
        const report = await onScanSingle(items[i].path);
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? {
                  ...it,
                  status: 'done',
                  danger_score: report?.danger_score ?? 0,
                  total_classes: report?.total_classes ?? 0,
                  findings_count: (report?.findings || []).length,
                }
              : it
          )
        );
      } catch (err: any) {
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? {
                  ...it,
                  status: 'error',
                  error: err.message || 'Scan error',
                }
              : it
          )
        );
      }
    }

    setScanning(false);
    setCurrentIdx(-1);
  };

  const dangerousCount = items.filter((i) => (i.danger_score || 0) >= 60).length;
  const suspiciousCount = items.filter(
    (i) => (i.danger_score || 0) >= 20 && (i.danger_score || 0) < 60
  ).length;
  const cleanCount = items.filter(
    (i) => i.status === 'done' && (i.danger_score || 0) < 20
  ).length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '900px',
          maxWidth: '95vw',
          maxHeight: '85vh',
          backgroundColor: '#0c100d',
          border: '1px solid #1f2721',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#131814',
            borderBottom: '1px solid #1f2721',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>📂</span>
            <div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#eaf0ea',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                BATCH PLUGINS AUDITOR (IDEA 13)
              </div>
              <div style={{ fontSize: '11px', color: '#9aa69e' }}>
                Массовое экспресс-сканирование всей папки plugins/ сервера
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #334139',
              color: '#9aa69e',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace',
              padding: '4px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Toolbar & Summary */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid #1f2721',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#0e120f',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handleSelectFolder}
              disabled={scanning}
              style={{
                backgroundColor: '#131814',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '6px 14px',
                borderRadius: '4px',
                cursor: scanning ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
            >
              📁 ВЫБРАТЬ ПАПКУ PLUGINS
            </button>

            <button
              onClick={startBatchScan}
              disabled={scanning || items.length === 0}
              style={{
                backgroundColor: scanning || items.length === 0 ? '#1f2721' : '#131814',
                border:
                  scanning || items.length === 0
                    ? '1px solid #334139'
                    : '1px solid #9bf246',
                color: scanning || items.length === 0 ? '#5f6b62' : '#9bf246',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '6px 14px',
                borderRadius: '4px',
                cursor: scanning || items.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 700,
              }}
            >
              {scanning ? '⏳ ИДЁТ АУДИТ...' : `⚡ СКАНИРОВАТЬ ВСЕ (${items.length})`}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
            <span style={{ color: '#9aa69e' }}>ВСЕГО: <b>{items.length}</b></span>
            <span style={{ color: '#9bf246' }}>ЧИСТЫЕ: <b>{cleanCount}</b></span>
            <span style={{ color: '#facc15' }}>ПОДОЗРИТЕЛЬНЫЕ: <b>{suspiciousCount}</b></span>
            <span style={{ color: '#ef4444' }}>ОПАСНЫЕ: <b>{dangerousCount}</b></span>
          </div>
        </div>

        {/* Table of Jars */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
          {items.length === 0 ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: '#5f6b62',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '12px',
              }}
            >
              Папка не выбрана. Нажмите «ВЫБРАТЬ ПАПКУ PLUGINS» для загрузки всех JAR-файлов сервера.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {items.map((it, idx) => {
                const isScanningThis = idx === currentIdx;
                const isDanger = (it.danger_score || 0) >= 60;
                const isSuspicious = (it.danger_score || 0) >= 20 && (it.danger_score || 0) < 60;

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: isScanningThis ? '#1c261e' : '#131814',
                      border: isScanningThis
                        ? '1px solid #9bf246'
                        : isDanger
                        ? '1px solid rgba(239, 68, 68, 0.4)'
                        : '1px solid #1f2721',
                      borderRadius: '4px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#5f6b62', minWidth: '24px' }}>#{idx + 1}</span>
                      <span style={{ color: '#eaf0ea', fontWeight: 600 }}>{it.name}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {it.status === 'pending' && (
                        <span style={{ color: '#5f6b62' }}>[ ОЖИДАЕТ ]</span>
                      )}
                      {it.status === 'scanning' && (
                        <span style={{ color: '#38bdf8' }}>[ ⏳ СКАНИРУЕТСЯ... ]</span>
                      )}
                      {it.status === 'error' && (
                        <span style={{ color: '#ef4444' }}>[ ОШИБКА ]</span>
                      )}
                      {it.status === 'done' && (
                        <>
                          <span style={{ color: '#9aa69e' }}>Классов: {it.total_classes}</span>
                          <span style={{ color: '#9aa69e' }}>Находок: {it.findings_count}</span>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '3px',
                              fontWeight: 700,
                              backgroundColor: isDanger
                                ? 'rgba(239, 68, 68, 0.2)'
                                : isSuspicious
                                ? 'rgba(250, 204, 21, 0.2)'
                                : 'rgba(155, 242, 70, 0.1)',
                              color: isDanger
                                ? '#ef4444'
                                : isSuspicious
                                ? '#facc15'
                                : '#9bf246',
                            }}
                          >
                            {it.danger_score}/100 {isDanger ? 'DANGER' : isSuspicious ? 'WARN' : 'CLEAN'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
