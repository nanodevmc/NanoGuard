import os

armor_path = r'C:\Users\nanodev\NanoGuard\src\components\ArmorView.tsx'
with open(armor_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1. Add preset logic after nativeDll state
for i, l in enumerate(lines):
    if 'const [nativeDll, setNativeDll] = useState(true);' in l:
        preset_code = [
            "  const [activePreset, setActivePreset] = useState<'heavy' | 'light' | 'native'>('heavy');\n\n",
            "  const applyPreset = (preset: 'heavy' | 'light' | 'native') => {\n",
            "    setActivePreset(preset);\n",
            "    if (preset === 'heavy') {\n",
            "      setStripLvt(true);\n",
            "      setEncryptStrings(true);\n",
            "      setAntiDecompile(true);\n",
            "      setAntiTamper(true);\n",
            "      setEnableVmFallback(true);\n",
            "      setInjectBootstrap(true);\n",
            "      setDummyMesh(true);\n",
            "      setFlattenRoot(true);\n",
            "      setNativeDll(true);\n",
            "    } else if (preset === 'light') {\n",
            "      setStripLvt(true);\n",
            "      setEncryptStrings(true);\n",
            "      setAntiDecompile(false);\n",
            "      setAntiTamper(false);\n",
            "      setEnableVmFallback(false);\n",
            "      setInjectBootstrap(false);\n",
            "      setDummyMesh(false);\n",
            "      setFlattenRoot(false);\n",
            "      setNativeDll(false);\n",
            "    } else if (preset === 'native') {\n",
            "      setStripLvt(true);\n",
            "      setEncryptStrings(true);\n",
            "      setAntiDecompile(true);\n",
            "      setAntiTamper(true);\n",
            "      setEnableVmFallback(true);\n",
            "      setInjectBootstrap(true);\n",
            "      setDummyMesh(false);\n",
            "      setFlattenRoot(false);\n",
            "      setNativeDll(true);\n",
            "    }\n",
            "  };\n"
        ]
        lines[i+1:i+1] = preset_code
        break

# 2. Add preset buttons UI directly before Multi-Layer Protection Options
for i, l in enumerate(lines):
    if '{/* Multi-Layer Protection Options */}' in l:
        ui_code = [
            "      {/* Armor Preset Selector (Idea 20) */}\n",
            "      <div\n",
            "        style={{\n",
            "          backgroundColor: '#0c100d',\n",
            "          border: '1px solid #1f2721',\n",
            "          borderRadius: '8px',\n",
            "          padding: '12px 16px',\n",
            "          display: 'flex',\n",
            "          justifyContent: 'space-between',\n",
            "          alignItems: 'center',\n",
            "        }}\n",
            "      >\n",
            "        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>\n",
            "          <span style={{ fontSize: '12px', fontWeight: 700, color: '#eaf0ea', fontFamily: 'JetBrains Mono, monospace' }}>\n",
            "            ⚡ QUICK PRESET:\n",
            "          </span>\n",
            "          <span style={{ fontSize: '11px', color: '#9aa69e', fontFamily: 'JetBrains Mono, monospace' }}>\n",
            "            (Выбор уровня защиты в 1 клик)\n",
            "          </span>\n",
            "        </div>\n\n",
            "        <div style={{ display: 'flex', gap: '8px' }}>\n",
            "          <button\n",
            "            onClick={() => applyPreset('light')}\n",
            "            style={{\n",
            "              backgroundColor: activePreset === 'light' ? '#1f2721' : '#131814',\n",
            "              border: activePreset === 'light' ? '1px solid #9bf246' : '1px solid #334139',\n",
            "              color: activePreset === 'light' ? '#9bf246' : '#9aa69e',\n",
            "              fontSize: '11px',\n",
            "              fontFamily: 'JetBrains Mono, monospace',\n",
            "              padding: '5px 12px',\n",
            "              borderRadius: '4px',\n",
            "              cursor: 'pointer',\n",
            "              fontWeight: 600,\n",
            "            }}\n",
            "            title=\"Лёгкий режим: только шифрование строк и очистка метаданных (без просадок FPS)\"\n",
            "          >\n",
            "            🟢 Light (Server-Friendly)\n",
            "          </button>\n",
            "          <button\n",
            "            onClick={() => applyPreset('native')}\n",
            "            style={{\n",
            "              backgroundColor: activePreset === 'native' ? '#1f2721' : '#131814',\n",
            "              border: activePreset === 'native' ? '1px solid #38bdf8' : '1px solid #334139',\n",
            "              color: activePreset === 'native' ? '#38bdf8' : '#9aa69e',\n",
            "              fontSize: '11px',\n",
            "              fontFamily: 'JetBrains Mono, monospace',\n",
            "              padding: '5px 12px',\n",
            "              borderRadius: '4px',\n",
            "              cursor: 'pointer',\n",
            "              fontWeight: 600,\n",
            "            }}\n",
            "            title=\"Вынос логики в C++ машинный код DLL + JVM VM fallback\"\n",
            "          >\n",
            "            🔷 Native Only (C++ DLL)\n",
            "          </button>\n",
            "          <button\n",
            "            onClick={() => applyPreset('heavy')}\n",
            "            style={{\n",
            "              backgroundColor: activePreset === 'heavy' ? '#1f2721' : '#131814',\n",
            "              border: activePreset === 'heavy' ? '1px solid #ef4444' : '1px solid #334139',\n",
            "              color: activePreset === 'heavy' ? '#f87171' : '#9aa69e',\n",
            "              fontSize: '11px',\n",
            "              fontFamily: 'JetBrains Mono, monospace',\n",
            "              padding: '5px 12px',\n",
            "              borderRadius: '4px',\n",
            "              cursor: 'pointer',\n",
            "              fontWeight: 700,\n",
            "            }}\n",
            "            title=\"Максимальная броня: Flow-Flattening, Opaque Predicates, Native DLL, Anti-Tamper, Dummy Mesh\"\n",
            "          >\n",
            "            🔥 Anti-Leak (Heavy Max)\n",
            "          </button>\n",
            "        </div>\n",
            "      </div>\n\n"
        ]
        lines[i:i] = ui_code
        break

with open(armor_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("SUCCESS_PRESETS_INSERTED")
