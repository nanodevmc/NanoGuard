import React, { useState } from 'react';

interface ConsoleViewProps {
  rawLog: string;
  onClear: () => void;
}

export const ConsoleView: React.FC<ConsoleViewProps> = ({ rawLog, onClear }) => {
  const [copied, setCopied] = useState(false);

  const defaultLines = [
    '[+] NanoGuard v0.1.2 initialized in OFFLINE mode.',
    '[+] Native C++17 bytecode streaming disassembler ready.',
    '[+] Rust FastScan multi-threaded engine loaded.',
    '[+] Hybrid JVM VM interpreter fallback active.',
    '[*] Waiting for JAR archive input...',
  ];

  const lines = rawLog ? rawLog.trim().split('\n') : defaultLines;

  const handleCopy = () => {
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLineColor = (line: string) => {
    if (line.startsWith('[!]') || line.includes('CRITICAL') || line.includes('Error')) return '#ff6f61';
    if (line.startsWith('[+]') || line.includes('SUCCESS') || line.includes('CLEAN')) return '#9bf246';
    if (line.startsWith('[*]')) return '#9aa69e';
    return '#eaf0ea';
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#070a08',
        border: '1px solid #1f2721',
        borderRadius: '6px',
        overflow: 'hidden',
      }}
    >
      {/* Console Top Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 14px',
          backgroundColor: '#0c100d',
          borderBottom: '1px solid #1f2721',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#9bf246' }}></span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#eaf0ea', fontFamily: 'JetBrains Mono, monospace' }}>
            TERMINAL // NATIVE ENGINE STREAM
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCopy}
            style={{
              padding: '4px 10px',
              backgroundColor: '#131814',
              border: '1px solid #1f2721',
              color: '#9aa69e',
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'JetBrains Mono, monospace',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {copied ? '✓ Скопировано' : '📋 Копировать'}
          </button>
          <button
            onClick={onClear}
            style={{
              padding: '4px 10px',
              backgroundColor: '#131814',
              border: '1px solid #1f2721',
              color: '#5f6b62',
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'JetBrains Mono, monospace',
              cursor: 'pointer',
            }}
          >
            ✕ Очистить
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div
        style={{
          flex: 1,
          padding: '12px 14px',
          overflowY: 'auto',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          lineHeight: '1.6',
          backgroundColor: '#070a08',
        }}
      >
        {lines.map((line, index) => (
          <div key={index} style={{ color: getLineColor(line) }}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};
