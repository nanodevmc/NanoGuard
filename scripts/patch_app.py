import os

path = r'C:\Users\nanodev\NanoGuard\src\App.tsx'
with open(path, 'rb') as f:
    raw = f.read()

# detect newline
nl = b'\r\n' if b'\r\n' in raw else b'\n'

t1 = b"import { CallGraphModal } from './components/CallGraphModal';"
r1 = b"import { CallGraphModal } from './components/CallGraphModal';" + nl + b"import { BytecodeViewerModal } from './components/BytecodeViewerModal';"

t2 = b"const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);"
r2 = b"const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);" + nl + b"  const [disasmFinding, setDisasmFinding] = useState<Finding | null>(null);"

t3 = b"onOpenCallGraph={(f) => setSelectedFinding(f)}"
r3 = b"onOpenCallGraph={(f) => setSelectedFinding(f)}" + nl + b"            onOpenDisasm={(f) => setDisasmFinding(f)}"

t4 = b"<CallGraphModal"
r4 = b"<BytecodeViewerModal finding={disasmFinding} onClose={() => setDisasmFinding(null)} />" + nl + nl + b"      <CallGraphModal"

assert t1 in raw, "t1 not found"
assert t2 in raw, "t2 not found"
assert t3 in raw, "t3 not found"
assert t4 in raw, "t4 not found"

raw = raw.replace(t1, r1)
raw = raw.replace(t2, r2)
raw = raw.replace(t3, r3)
raw = raw.replace(t4, r4)

with open(path, 'wb') as f:
    f.write(raw)

print("SUCCESS_PATCHED_APP_TSX")
