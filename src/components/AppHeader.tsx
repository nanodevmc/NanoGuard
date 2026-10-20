import React from 'react';

export type TabType = 'audit' | 'protect' | 'console';

interface AppHeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenSettings: () => void;
  selectedJar: string | null;
  threatCount: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  selectedJar,
  threatCount,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        backgroundColor: '#0c100d',
        borderBottom: '1px solid #1f2721',
      }}
    >
      {/* Navigation tabs */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          id="tab-audit"
          onClick={() => onTabChange('audit')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            backgroundColor: activeTab === 'audit' ? '#131814' : 'transparent',
            border: activeTab === 'audit' ? '1px solid #334139' : '1px solid transparent',
            color: activeTab === 'audit' ? '#9bf246' : '#9aa69e',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span>🛡️</span>
          <span>BACKDOOR HUNTER</span>
          {threatCount > 0 && (
            <span
              style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '10px',
                backgroundColor: '#ff6f61',
                color: '#070a08',
                fontWeight: 800,
              }}
            >
              {threatCount}
            </span>
          )}
        </button>

        <button
          id="tab-protect"
          onClick={() => onTabChange('protect')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            backgroundColor: activeTab === 'protect' ? '#131814' : 'transparent',
            border: activeTab === 'protect' ? '1px solid #334139' : '1px solid transparent',
            color: activeTab === 'protect' ? '#9bf246' : '#9aa69e',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span>🔒</span>
          <span>BYTECODE ARMOR</span>
        </button>

        <button
          id="tab-console"
          onClick={() => onTabChange('console')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            backgroundColor: activeTab === 'console' ? '#131814' : 'transparent',
            border: activeTab === 'console' ? '1px solid #334139' : '1px solid transparent',
            color: activeTab === 'console' ? '#9bf246' : '#9aa69e',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span>⚡</span>
          <span>TERMINAL</span>
        </button>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {selectedJar && (
          <div
            style={{
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              color: '#9bf246',
              backgroundColor: '#131814',
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid #1f2721',
              maxWidth: '240px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={selectedJar}
          >
            JAR: {selectedJar.split(/[/\\]/).pop()}
          </div>
        )}

        <button
          onClick={onOpenSettings}
          title="Настройки NanoGuard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            backgroundColor: '#131814',
            border: '1px solid #1f2721',
            color: '#9aa69e',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#9bf246';
            e.currentTarget.style.color = '#eaf0ea';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#1f2721';
            e.currentTarget.style.color = '#9aa69e';
          }}
        >
          <span>⚙</span>
          <span>SETTINGS</span>
        </button>
      </div>
    </div>
  );
};
