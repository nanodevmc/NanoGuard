import React, { useState } from 'react';
import { Finding } from './AuditView';

interface BytecodeViewerModalProps {
  finding: Finding | null;
  onClose: () => void;
}

export const BytecodeViewerModal: React.FC<BytecodeViewerModalProps> = ({ finding, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!finding) return null;

  const hexOffset = '0x' + finding.offset.toString(16).toUpperCase().padStart(4, '0');

  // Realistic disassembly listing around instruction
  const sampleListing = [
    `// Class: ${finding.class}`,
    `// Method: ${finding.method}`,
    `// Category: ${finding.category} [${finding.severity}]`,
    `--------------------------------------------------------------------------------`,
    `0x0010:  aload_0`,
    `0x0011:  getfield        #14 // Field listener:Lorg/bukkit/event/Listener;`,
    `0x0014:  ifnonnull       +18`,
    `0x0017:  new             #22 // Class java/lang/IllegalStateException`,
    `0x001A:  dup`,
    `0x001B:  ldc             #24 // String "Uninitialized runtime context"`,
    `0x001D:  invokespecial   #26 // Method java/lang/IllegalStateException."<init>":(Ljava/lang/String;)V`,
    `0x0020:  athrow`,
    `0x0021:  aload_1`,
    `0x0022:  invokevirtual   #30 // Method org/bukkit/entity/Player.getName:()Ljava/lang/String;`,
    `// >>> TARGET TRIGGER MATCH <<<`,
    `${hexOffset}:  ${finding.instruction}`,
    `0x002C:  pop`,
    `0x002D:  return`,
    `--------------------------------------------------------------------------------`,
    `// Description: ${finding.description}`
  ].join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleListing);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        style={{
          width: '780px',
          backgroundColor: '#0c100d',
          border: '1px solid #1f2721',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.85)',
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
            <span style={{ fontSize: '15px' }}>⚡</span>
            <span style={{ color: '#eaf0ea', fontWeight: 800, fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
              INTERACTIVE BYTECODE DISASSEMBLER
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

        {/* Code Listing Area */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#9aa69e', fontFamily: 'JetBrains Mono, monospace' }}>
              Местоположение: <span style={{ color: '#9bf246' }}>{finding.class}#{finding.method}</span>
            </span>
            <button
              onClick={handleCopy}
              style={{
                padding: '4px 10px',
                backgroundColor: '#131814',
                border: '1px solid #1f2721',
                color: copied ? '#9bf246' : '#9aa69e',
                borderRadius: '4px',
                fontSize: '10px',
                fontFamily: 'JetBrains Mono, monospace',
                cursor: 'pointer',
              }}
            >
              {copied ? '✓ СКОПИРОВАНО' : '📋 КОПИРОВАТЬ ОПКОДЫ'}
            </button>
          </div>

          <pre
            style={{
              backgroundColor: '#070a08',
              border: '1px solid #1f2721',
              borderRadius: '6px',
              padding: '14px',
              color: '#eaf0ea',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              lineHeight: '1.6',
              maxHeight: '380px',
              overflowY: 'auto',
              margin: 0,
            }}
          >
            {sampleListing.split('\n').map((line, i) => {
              const isTarget = line.includes('TARGET TRIGGER MATCH') || line.startsWith(hexOffset);
              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: isTarget ? 'rgba(255, 111, 97, 0.15)' : 'transparent',
                    color: isTarget ? '#ff6f61' : line.startsWith('//') || line.startsWith('---') ? '#5f6b62' : '#9bf246',
                    fontWeight: isTarget ? 700 : 400,
                    padding: isTarget ? '2px 4px' : '0',
                    borderRadius: '2px',
                  }}
                >
                  {line}
                </div>
              );
            })}
          </pre>
        </div>

        {/* Footer */}
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
