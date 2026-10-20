import React from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
}

interface ToastsProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toasts: React.FC<ToastsProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'success':
        return { border: '#9bf246', color: '#9bf246', icon: '✓' };
      case 'error':
        return { border: '#ff6f61', color: '#ff6f61', icon: '✕' };
      case 'warning':
        return { border: '#ffb224', color: '#ffb224', icon: '⚠' };
      default:
        return { border: '#9bf246', color: '#9bf246', icon: 'ℹ' };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '36px',
        right: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 200,
      }}
    >
      {toasts.map((t) => {
        const style = getTypeStyle(t.type);
        return (
          <div
            key={t.id}
            onClick={() => onDismiss(t.id)}
            style={{
              backgroundColor: '#0c100d',
              border: `1px solid #1f2721`,
              borderLeft: `3px solid ${style.border}`,
              boxShadow: `0 4px 20px rgba(0,0,0,0.6)`,
              borderRadius: '6px',
              padding: '10px 14px',
              minWidth: '260px',
              maxWidth: '380px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <span style={{ color: style.color, fontWeight: 800, fontSize: '13px' }}>{style.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#eaf0ea' }}>{t.title}</div>
              <div style={{ fontSize: '11px', color: '#9aa69e', marginTop: '2px' }}>{t.message}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
