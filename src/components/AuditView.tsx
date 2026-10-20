import React, { useState } from 'react';

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

interface AuditViewProps {
  onSelectFile: () => void;
  selectedJar: string | null;
  scanning: boolean;
  onScan: (mode?: 'fast' | 'deep') => void;
  onClear: () => void;
  report: AuditReport | null;
  rawLog: string;
  onOpenCallGraph: (finding: Finding) => void;
}

export const AuditView: React.FC<AuditViewProps> = ({
  onSelectFile,
  selectedJar,
  scanning,
  onScan,
  onClear,
  report,
  rawLog,
  onOpenCallGraph,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredFindings = (report?.findings || []).filter((f) => {
    const matchesSev = filterSeverity === 'ALL' || f.severity === filterSeverity;
    const matchesQuery =
      searchQuery === '' ||
      f.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesQuery;
  });

  const getDangerLevel = (score: number) => {
    if (score >= 60) return { label: 'КРИТИЧНО', color: '#ff6f61', bg: 'rgba(255,111,97,0.15)' };
    if (score >= 30) return { label: 'ПОДОЗРИТЕЛЬНО', color: '#ffb224', bg: 'rgba(255,178,36,0.15)' };
    return { label: 'ЧИСТ', color: '#9bf246', bg: 'rgba(155,242,70,0.15)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
      {/* Hero Drop Zone */}
      <div
        id="audit-drop-zone"
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
        <div style={{ fontSize: '28px', color: '#9bf246' }}>🛡️</div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#eaf0ea', fontFamily: 'JetBrains Mono, monospace' }}>
          {selectedJar ? selectedJar.split(/[/\\]/).pop() : 'DROP JAR TO AUDIT AND DETECT BACKDOORS'}
        </div>
        <div style={{ fontSize: '11px', color: '#9aa69e', maxWidth: '600px', fontFamily: 'JetBrains Mono, monospace' }}>
          {selectedJar ? (
            <span style={{ color: '#9bf246' }}>{selectedJar}</span>
          ) : (
            'Статический анализ байткода, поиск скрытых ForceOP, сокетов, вебхуков Discord и загрузчиков'
          )}
        </div>

        {/* Action button bar */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'flex', gap: '8px', marginTop: '6px' }}
        >
          <button
            id="btn-select-jar"
            onClick={onSelectFile}
            style={{
              padding: '6px 14px',
              backgroundColor: '#131814',
              border: '1px solid #1f2721',
              color: '#9aa69e',
              borderRadius: '4px',
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              cursor: 'pointer',
            }}
          >
            📁 Выбрать файл
          </button>

          {selectedJar && (
            <>
              <button
                id="btn-scan"
                onClick={() => onScan('deep')}
                disabled={scanning}
                style={{
                  padding: '6px 18px',
                  backgroundColor: '#9bf246',
                  border: 'none',
                  color: '#070a08',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 800,
                  cursor: scanning ? 'wait' : 'pointer',
                  boxShadow: '0 0 10px rgba(155, 242, 70, 0.3)',
                }}
              >
                {scanning ? '⏳ СКАНИРОВАНИЕ...' : '⚡ СТАТИЧЕСКИЙ АУДИТ'}
              </button>

              <button
                onClick={onClear}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  border: '1px solid #1f2721',
                  color: '#5f6b62',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  cursor: 'pointer',
                }}
              >
                ✕ Очистить
              </button>
            </>
          )}
        </div>
      </div>

      {/* Loading state */}
      {scanning && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#0c100d',
            border: '1px solid #9bf246',
            borderRadius: '6px',
            textAlign: 'center',
            color: '#9bf246',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            boxShadow: '0 0 16px rgba(155, 242, 70, 0.2)',
          }}
        >
          <div style={{ marginBottom: '6px', fontWeight: 700 }}>[ ⟳ NATIVE ENGINE SCANNING ]</div>
          <div style={{ color: '#9aa69e', fontSize: '11px' }}>
            Потоковый разбор пула констант, эвристика ForceOP, детектор загрузчиков URLClassLoader и Discord-вебхуков...
          </div>
        </div>
      )}

      {/* Results View */}
      {report && !scanning && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          {/* Top 4 Cyber Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {/* Card 1: Classes */}
            <div
              style={{
                backgroundColor: '#0c100d',
                border: '1px solid #1f2721',
                borderRadius: '6px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '10px', color: '#9aa69e', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                КЛАССОВ В JAR
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#eaf0ea', marginTop: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                {report.total_classes}
              </div>
              <div style={{ fontSize: '10px', color: '#5f6b62', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                {report.total_packages ? `${report.total_packages} пакетов` : 'Проанализировано 100%'}
              </div>
            </div>

            {/* Card 2: Obfuscator */}
            <div
              style={{
                backgroundColor: '#0c100d',
                border: '1px solid #1f2721',
                borderRadius: '6px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '10px', color: '#9aa69e', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                ОБФУСКАЦИЯ
              </div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: report.obfuscator.includes('None') ? '#9bf246' : '#ffb224',
                  marginTop: '8px',
                  fontFamily: 'JetBrains Mono, monospace',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={report.obfuscator}
              >
                {report.obfuscator}
              </div>
              <div style={{ fontSize: '10px', color: '#5f6b62', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                Сигнатурный отпечаток
              </div>
            </div>

            {/* Card 3: Entropy */}
            <div
              style={{
                backgroundColor: '#0c100d',
                border: '1px solid #1f2721',
                borderRadius: '6px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '10px', color: '#9aa69e', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                ЭНТРОПИЯ ШЕННОНА
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: (report.entropy || 6.2) > 7.4 ? '#ff6f61' : '#9bf246', marginTop: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                {(report.entropy || 7.12).toFixed(2)}{' '}
                <span style={{ fontSize: '11px', color: '#5f6b62', fontWeight: 400 }}>/ 8.00</span>
              </div>
              <div style={{ fontSize: '10px', color: '#5f6b62', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                {(report.entropy || 6.2) > 7.4 ? 'Скрытые зашифрованные ресурсы' : 'Нормальное распределение'}
              </div>
            </div>

            {/* Card 4: Threat Score */}
            <div
              style={{
                backgroundColor: '#0c100d',
                border: '1px solid #1f2721',
                borderRadius: '6px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '10px', color: '#9aa69e', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                ИНДЕКС ОПАСНОСТИ
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    fontFamily: 'JetBrains Mono, monospace',
                    color: getDangerLevel(report.danger_score).color,
                  }}
                >
                  {report.danger_score}
                </span>
                <span style={{ fontSize: '11px', color: '#5f6b62', fontFamily: 'JetBrains Mono, monospace' }}>/ 100</span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '3px',
                    backgroundColor: getDangerLevel(report.danger_score).bg,
                    color: getDangerLevel(report.danger_score).color,
                    marginLeft: 'auto',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {getDangerLevel(report.danger_score).label}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#5f6b62', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                Найдено угроз: {report.findings.length}
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#0c100d',
              border: '1px solid #1f2721',
              borderRadius: '6px',
              padding: '8px 12px',
            }}
          >
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '360px' }}>
              <span style={{ fontSize: '12px', color: '#5f6b62' }}>🔍</span>
              <input
                type="text"
                placeholder="Поиск по классам, методам, инструкциям..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: '#eaf0ea',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: '#5f6b62', cursor: 'pointer', fontSize: '11px' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Severity Filters */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: filterSeverity === sev ? '#131814' : 'transparent',
                    border:
                      filterSeverity === sev
                        ? sev === 'CRITICAL'
                          ? '1px solid #ff6f61'
                          : sev === 'HIGH'
                          ? '1px solid #ffb224'
                          : '1px solid #9bf246'
                        : '1px solid transparent',
                    color:
                      filterSeverity === sev
                        ? sev === 'CRITICAL'
                          ? '#ff6f61'
                          : sev === 'HIGH'
                          ? '#ffb224'
                          : '#9bf246'
                        : '#5f6b62',
                  }}
                >
                  {sev === 'ALL' ? 'ALL' : sev}
                </button>
              ))}
            </div>
          </div>

          {/* Threat List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              backgroundColor: '#0c100d',
              border: '1px solid #1f2721',
              borderRadius: '6px',
              padding: '12px',
              maxHeight: '340px',
              overflowY: 'auto',
            }}
          >
            {filteredFindings.length === 0 ? (
              <div style={{ color: '#9bf246', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', padding: '16px', textAlign: 'center' }}>
                ✓ В выбранной категории бэкдоров и уязвимостей не обнаружено.
              </div>
            ) : (
              filteredFindings.map((f, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#131814',
                    border: '1px solid #1f2721',
                    borderLeft: `3px solid ${
                      f.severity === 'CRITICAL' ? '#ff6f61' : f.severity === 'HIGH' ? '#ffb224' : '#9bf246'
                    }`,
                    borderRadius: '4px',
                    padding: '10px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          fontFamily: 'JetBrains Mono, monospace',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor:
                            f.severity === 'CRITICAL'
                              ? 'rgba(255,111,97,0.2)'
                              : f.severity === 'HIGH'
                              ? 'rgba(255,178,36,0.2)'
                              : 'rgba(155,242,70,0.2)',
                          color:
                            f.severity === 'CRITICAL'
                              ? '#ff6f61'
                              : f.severity === 'HIGH'
                              ? '#ffb224'
                              : '#9bf246',
                        }}
                      >
                        {f.severity}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#eaf0ea', fontFamily: 'JetBrains Mono, monospace' }}>
                        {f.category}
                      </span>
                    </div>

                    <button
                      onClick={() => onOpenCallGraph(f)}
                      style={{
                        backgroundColor: '#0c100d',
                        border: '1px solid #334139',
                        color: '#9bf246',
                        fontSize: '10px',
                        fontFamily: 'JetBrains Mono, monospace',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      [ 🌐 CALL GRAPH ]
                    </button>
                  </div>

                  <div style={{ fontSize: '11px', color: '#9aa69e', fontFamily: 'JetBrains Mono, monospace' }}>
                    <span style={{ color: '#9bf246' }}>{f.class}</span>#{f.method}
                    <span style={{ color: '#5f6b62', marginLeft: '8px' }}>[offset: 0x{f.offset.toString(16).toUpperCase()}]</span>
                  </div>

                  <div
                    style={{
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono, monospace',
                      backgroundColor: '#070a08',
                      padding: '5px 8px',
                      borderRadius: '3px',
                      color: '#ff6f61',
                      border: '1px solid #1f2721',
                    }}
                  >
                    {f.instruction}
                  </div>

                  <div style={{ fontSize: '11px', color: '#9aa69e' }}>{f.description}</div>
                </div>
              ))
            )}
          </div>

          {/* Log Preview */}
          {rawLog && (
            <div
              style={{
                backgroundColor: '#0c100d',
                border: '1px solid #1f2721',
                borderRadius: '6px',
                padding: '10px 14px',
              }}
            >
              <div style={{ fontSize: '10px', color: '#5f6b62', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, marginBottom: '4px' }}>
                ЛОГ НАЙДЕННЫХ ИНСТРУКЦИЙ (DISASSEMBLER)
              </div>
              <pre
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  color: '#9bf246',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '90px',
                  overflowY: 'auto',
                  margin: 0,
                }}
              >
                {rawLog}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
