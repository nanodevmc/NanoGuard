import os

armor_path = r'C:\Users\nanodev\NanoGuard\src\components\ArmorView.tsx'
with open(armor_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add preset state
state_target = "  const [nativeDll, setNativeDll] = useState(true);"
state_replace = """  const [nativeDll, setNativeDll] = useState(true);
  const [activePreset, setActivePreset] = useState<'heavy' | 'light' | 'native'>('heavy');

  const applyPreset = (preset: 'heavy' | 'light' | 'native') => {
    setActivePreset(preset);
    if (preset === 'heavy') {
      setStripLvt(true);
      setEncryptStrings(true);
      setAntiDecompile(true);
      setAntiTamper(true);
      setEnableVmFallback(true);
      setInjectBootstrap(true);
      setDummyMesh(true);
      setFlattenRoot(true);
      setNativeDll(true);
    } else if (preset === 'light') {
      setStripLvt(true);
      setEncryptStrings(true);
      setAntiDecompile(false);
      setAntiTamper(false);
      setEnableVmFallback(false);
      setInjectBootstrap(false);
      setDummyMesh(false);
      setFlattenRoot(false);
      setNativeDll(false);
    } else if (preset === 'native') {
      setStripLvt(true);
      setEncryptStrings(true);
      setAntiDecompile(true);
      setAntiTamper(true);
      setEnableVmFallback(true);
      setInjectBootstrap(true);
      setDummyMesh(false);
      setFlattenRoot(false);
      setNativeDll(true);
    }
  };"""

assert state_target in text, "state_target not found"
text = text.replace(state_target, state_replace)

# 2. Add preset buttons UI directly before PROTECTION LAYERS
ui_target = """        {/* Multi-Layer Protection Options */}
        <div
          style={{
            backgroundColor: '#0c100d',
            border: '1px solid #1f2721',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>"""

ui_replace = """        {/* Armor Preset Selector (Idea 20) */}
        <div
          style={{
            backgroundColor: '#0c100d',
            border: '1px solid #1f2721',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#eaf0ea', fontFamily: 'JetBrains Mono, monospace' }}>
              ⚡ QUICK PRESET:
            </span>
            <span style={{ fontSize: '11px', color: '#9aa69e', fontFamily: 'JetBrains Mono, monospace' }}>
              (Выбор уровня защиты в 1 клик)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => applyPreset('light')}
              style={{
                backgroundColor: activePreset === 'light' ? '#1f2721' : '#131814',
                border: activePreset === 'light' ? '1px solid #9bf246' : '1px solid #334139',
                color: activePreset === 'light' ? '#9bf246' : '#9aa69e',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '5px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              title="Лёгкий режим: только шифрование строк и очистка метаданных (без просадок FPS)"
            >
              🟢 Light (Server-Friendly)
            </button>
            <button
              onClick={() => applyPreset('native')}
              style={{
                backgroundColor: activePreset === 'native' ? '#1f2721' : '#131814',
                border: activePreset === 'native' ? '1px solid #38bdf8' : '1px solid #334139',
                color: activePreset === 'native' ? '#38bdf8' : '#9aa69e',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '5px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              title="Вынос логики в C++ машинный код DLL + JVM VM fallback"
            >
              🔷 Native Only (C++ DLL)
            </button>
            <button
              onClick={() => applyPreset('heavy')}
              style={{
                backgroundColor: activePreset === 'heavy' ? '#1f2721' : '#131814',
                border: activePreset === 'heavy' ? '1px solid #ef4444' : '1px solid #334139',
                color: activePreset === 'heavy' ? '#f87171' : '#9aa69e',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '5px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 700,
              }}
              title="Максимальная броня: Flow-Flattening, Opaque Predicates, Native DLL, Anti-Tamper, Dummy Mesh"
            >
              🔥 Anti-Leak (Heavy Max)
            </button>
          </div>
        </div>

        {/* Multi-Layer Protection Options */}
        <div
          style={{
            backgroundColor: '#0c100d',
            border: '1px solid #1f2721',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>"""

if ui_target in text:
    text = text.replace(ui_target, ui_replace)
else:
    ui_target_rn = ui_target.replace('\n', '\r\n')
    ui_replace_rn = ui_replace.replace('\n', '\r\n')
    assert ui_target_rn in text, "ui_target not found with RN"
    text = text.replace(ui_target_rn, ui_replace_rn)

with open(armor_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("ARMORVIEW_PRESETS_ADDED")
