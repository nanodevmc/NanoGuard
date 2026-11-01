import React, { useState } from 'react';

interface PluginYmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawYaml: string;
  onSave: (updatedYaml: string) => Promise<void>;
  jarName?: string;
}

export const PluginYmlModal: React.FC<PluginYmlModalProps> = ({
  isOpen,
  onClose,
  rawYaml,
  onSave,
  jarName,
}) => {
  const [content, setContent] = useState(rawYaml);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      await onSave(content);
      setStatusMsg('✓ plugin.yml успешно сохранён в JAR-архив!');
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 1200);
    } catch (e: any) {
      setStatusMsg(`Ошибка сохранения: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '780px',
          maxWidth: '95vw',
          height: '620px',
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
            padding: '12px 18px',
            backgroundColor: '#131814',
            borderBottom: '1px solid #1f2721',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>📝</span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#eaf0ea',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              PLUGIN.YML MANIFEST INSPECTOR & EDITOR (IDEA 16)
            </span>
            {jarName && (
              <span
                style={{
                  fontSize: '11px',
                  color: '#9bf246',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                [{jarName}]
              </span>
            )}
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

        {/* Editor Area */}
        <div style={{ flex: 1, padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: '#9aa69e', fontFamily: 'JetBrains Mono, monospace' }}>
            Редактируйте метаданные плагина (имя, версия, команды, права, главный класс) прямо в архиве:
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1,
              backgroundColor: '#070a08',
              border: '1px solid #1f2721',
              borderRadius: '6px',
              color: '#9bf246',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              lineHeight: '1.5',
              padding: '12px',
              resize: 'none',
              outline: 'none',
            }}
          />
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#131814',
            borderTop: '1px solid #1f2721',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            {statusMsg && (
              <span
                style={{
                  fontSize: '12px',
                  fontFamily: 'JetBrains Mono, monospace',
                  color: statusMsg.startsWith('✓') ? '#9bf246' : '#ef4444',
                }}
              >
                {statusMsg}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #334139',
                color: '#9aa69e',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '6px 14px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                backgroundColor: '#131814',
                border: '1px solid #9bf246',
                color: '#9bf246',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700,
                padding: '6px 18px',
                borderRadius: '4px',
                cursor: saving ? 'wait' : 'pointer',
              }}
            >
              {saving ? '⏳ СОХРАНЕНИЕ...' : '💾 СОХРАНИТЬ В JAR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
