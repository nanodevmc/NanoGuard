import os

app_path = r'C:\Users\nanodev\NanoGuard\src\App.tsx'
with open(app_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1. Add import BatchScannerModal
for i, l in enumerate(lines):
    if 'import { BytecodeViewerModal }' in l:
        lines.insert(i + 1, "import { BatchScannerModal } from './components/BatchScannerModal';\n")
        break

# 2. Add state batchOpen
for i, l in enumerate(lines):
    if 'const [settingsOpen, setSettingsOpen] = useState(false);' in l:
        lines.insert(i + 1, "  const [batchOpen, setBatchOpen] = useState(false);\n")
        break

# 3. Add onOpenBatchScanner prop to AuditView
for i, l in enumerate(lines):
    if 'onOpenDisasm={(f) => setDisasmFinding(f)}' in l:
        lines.insert(i + 1, "            onOpenBatchScanner={() => setBatchOpen(true)}\n")
        break

# 4. Insert BatchScannerModal component before SettingsModal
for i, l in enumerate(lines):
    if '<SettingsModal' in l:
        modal_code = [
            "      <BatchScannerModal\n",
            "        isOpen={batchOpen}\n",
            "        onClose={() => setBatchOpen(false)}\n",
            "        onScanSingle={async (path) => {\n",
            "          // @ts-ignore\n",
            "          return await window.nanoGuardAPI.auditJar(path, engine);\n",
            "        }}\n",
            "      />\n\n"
        ]
        lines[i:i] = modal_code
        break

with open(app_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("APP_TSX_BATCH_SCANNER_CONNECTED")
