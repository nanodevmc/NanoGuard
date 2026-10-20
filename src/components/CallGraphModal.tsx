import React from 'react';
import { Finding } from './AuditView';

interface CallGraphModalProps {
  finding: Finding | null;
  onClose: () => void;
}

export const CallGraphModal: React.FC<CallGraphModalProps> = ({ finding, onClose }) => {
  if (!finding) return null;

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
          width: '720px',
          backgroundColor: '#0c100d',
          border: '1px solid #1f2721',
          boxShadow: '0 0 35px rgba(0, 0, 0, 0.7)',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Modal Header */}
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
            <span style={{ fontSize: '15px' }}>🌐</span>
            <span style={{ color: '#eaf0ea', fontWeight: 800, fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
              INTERACTIVE CALL FLOW GRAPH
            </span>
            <span
              style={{
                fontSize: '9px',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: finding.severity === 'CRITICAL' ? 'rgba(255,111,97,0.2)' : 'rgba(255,178,36,0.2)',
                color: finding.severity === 'CRITICAL' ? '#ff6f61' : '#ffb224',
                fontWeight: 800,
              }}
            >
              {finding.severity}
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

        {/* Modal Body / Graph Diagram */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '11px', color: '#9aa69e', fontFamily: 'JetBrains Mono, monospace' }}>
            Цепочка передачи управления от внешнего триггера к точке компрометации сервера:
          </div>

          {/* Node Visualizer */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              backgroundColor: '#070a08',
              padding: '16px',
              borderRadius: '6px',
              border: '1px solid #1f2721',
            }}
          >
            {/* Step 1: Entry Point Trigger */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                backgroundColor: '#131814',
                borderRadius: '4px',
                borderLeft: '3px solid #9bf246',
              }}
            >
              <div style={{ fontSize: '18px' }}>⚡</div>
              <div>
                <div style={{ fontSize: '9px', color: '#9bf246', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                  ENTRY POINT // ВНЕШНИЙ ТРИГГЕР
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#eaf0ea' }}>
                  org.bukkit.event.player.AsyncPlayerChatEvent
                </div>
                <div style={{ fontSize: '10px', color: '#5f6b62', marginTop: '1px', fontFamily: 'JetBrains Mono, monospace' }}>
                  Слушатель сообщений чата в потоке событий сервера
                </div>
              </div>
            </div>

            {/* Arrow down */}
            <div style={{ display: 'flex', justifyContent: 'center', color: '#334139', fontSize: '12px' }}>
              ▼
            </div>

            {/* Step 2: Target Class / Method */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                backgroundColor: '#131814',
                borderRadius: '4px',
                borderLeft: '3px solid #ffb224',
              }}
            >
              <div style={{ fontSize: '18px' }}>🔍</div>
              <div>
                <div style={{ fontSize: '9px', color: '#ffb224', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                  DISPATCHER // ВАЛИДАЦИЯ ПАРОЛЯ
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#eaf0ea' }}>
                  {finding.class}.{finding.method}
                </div>
                <div style={{ fontSize: '10px', color: '#5f6b62', marginTop: '1px', fontFamily: 'JetBrains Mono, monospace' }}>
                  Сверка секретного хеша пароля из чата для активации бэкдора
                </div>
              </div>
            </div>

            {/* Arrow down */}
            <div style={{ display: 'flex', justifyContent: 'center', color: '#334139', fontSize: '12px' }}>
              ▼
            </div>

            {/* Step 3: Malicious Sink */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                backgroundColor: 'rgba(255, 111, 97, 0.1)',
                borderRadius: '4px',
                borderLeft: '3px solid #ff6f61',
              }}
            >
              <div style={{ fontSize: '18px' }}>💥</div>
              <div>
                <div style={{ fontSize: '9px', color: '#ff6f61', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                  MALICIOUS SINK // ТОЧКА КОМПРОМЕТАЦИИ [OFFSET: 0x{finding.offset.toString(16).toUpperCase()}]
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#ff6f61' }}>
                  {finding.instruction}
                </div>
                <div style={{ fontSize: '10px', color: '#9aa69e', marginTop: '1px', fontFamily: 'JetBrains Mono, monospace' }}>
                  {finding.description}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '12px 18px',
            backgroundColor: '#070a08',
            borderTop: '1px solid #1f2721',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '6px 18px',
              backgroundColor: '#131814',
              border: '1px solid #1f2721',
              color: '#eaf0ea',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            ЗАКРЫТЬ
          </button>
        </div>
      </div>
    </div>
  );
};
