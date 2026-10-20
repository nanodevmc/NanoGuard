import React from 'react';

interface TitlebarProps {
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}

export const Titlebar: React.FC<TitlebarProps> = ({ onMinimize, onMaximize, onClose }) => {
  return (
    <div
      className="window-drag-region"
      style={{
        height: '38px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 12px',
        backgroundColor: '#070a08',
        borderBottom: '1px solid #1f2721',
        userSelect: 'none',
      }}
    >
      {/* Brand & Version */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2L3 6V11.5C3 17.5 6.8 23 12 24.5C17.2 23 21 17.5 21 11.5V6L12 2Z"
            fill="#131814"
            stroke="#9bf246"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 12.5L11 15L15.5 9.5"
            stroke="#9bf246"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.08em', color: '#eaf0ea' }}>
            NANOGUARD
          </span>
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'JetBrains Mono, monospace',
              color: '#9bf246',
              fontWeight: 700,
              backgroundColor: '#131814',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #1f2721',
            }}
          >
            v0.1.2
          </span>
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'JetBrains Mono, monospace',
              color: '#5f6b62',
              letterSpacing: '0.05em',
            }}
          >
            // NATIVE CORE & HYBRID VM
          </span>
        </div>
      </div>

      {/* Status & Window Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#9bf246' }}>
          <span
            className="pulse-dot"
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#9bf246',
              boxShadow: '0 0 8px #9bf246',
            }}
          />
          <span>HARDENED // OFFLINE</span>
        </div>

        {/* Minimalist Window Controls */}
        <div className="window-no-drag" style={{ display: 'flex', gap: '2px' }}>
          <button
            onClick={onMinimize}
            title="Свернуть"
            style={{
              background: 'none',
              border: 'none',
              color: '#9aa69e',
              padding: '4px 10px',
              cursor: 'pointer',
              fontSize: '12px',
              borderRadius: '3px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#131814')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            —
          </button>
          <button
            onClick={onMaximize}
            title="Развернуть"
            style={{
              background: 'none',
              border: 'none',
              color: '#9aa69e',
              padding: '4px 10px',
              cursor: 'pointer',
              fontSize: '12px',
              borderRadius: '3px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#131814')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            ▢
          </button>
          <button
            onClick={onClose}
            title="Закрыть"
            style={{
              background: 'none',
              border: 'none',
              color: '#9aa69e',
              padding: '4px 10px',
              cursor: 'pointer',
              fontSize: '13px',
              borderRadius: '3px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ff6f61';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#9aa69e';
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};
