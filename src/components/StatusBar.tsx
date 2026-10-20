import React from 'react';

interface StatusBarProps {
  cpu: string;
  ram: string;
  telemetry: string;
  engine: 'cpp' | 'rust';
}

export const StatusBar: React.FC<StatusBarProps> = ({ cpu, ram, telemetry, engine }) => {
  return (
    <div
      style={{
        height: '26px',
        backgroundColor: '#070a08',
        borderTop: '1px solid #1f2721',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 14px',
        fontSize: '11px',
        fontFamily: 'JetBrains Mono, monospace',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', gap: '16px', color: '#5f6b62' }}>
        <span>
          CPU: <span style={{ color: '#9bf246', fontWeight: 600 }}>{cpu}</span>
        </span>
        <span>
          RAM: <span style={{ color: '#eaf0ea', fontWeight: 600 }}>{ram}</span>
        </span>
        <span style={{ color: '#9aa69e' }}>
          {telemetry}
        </span>
        <span>
          ENGINE: <span style={{ color: '#9bf246' }}>{engine.toUpperCase()} NATIVE / VM</span>
        </span>
      </div>

      <div style={{ color: '#5f6b62', display: 'flex', gap: '8px' }}>
        <span>NanoDev</span>
        <span>·</span>
        <a
          href="https://t.me/WineSquad"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#9bf246', textDecoration: 'none', fontWeight: 600 }}
        >
          t.me/WineSquad
        </a>
      </div>
    </div>
  );
};
