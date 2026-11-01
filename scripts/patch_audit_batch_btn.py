import os

audit_path = r'C:\Users\nanodev\NanoGuard\src\components\AuditView.tsx'
with open(audit_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1. Update props interface
for i, l in enumerate(lines):
    if 'onOpenDisasm?: (finding: Finding) => void;' in l:
        lines.insert(i + 1, "  onOpenBatchScanner?: () => void;\n")
        break

# 2. Update component signature
for i, l in enumerate(lines):
    if 'onOpenDisasm,' in l:
        lines.insert(i + 1, "  onOpenBatchScanner,\n")
        break

# 3. Add button in action button bar
for i, l in enumerate(lines):
    if '📁 Выбрать файл' in l:
        # After button close
        btn_close_idx = -1
        for j in range(i, i + 5):
            if '</button>' in lines[j]:
                btn_close_idx = j
                break
        if btn_close_idx != -1:
            batch_btn = [
                "\n",
                "          {onOpenBatchScanner && (\n",
                "            <button\n",
                "              onClick={onOpenBatchScanner}\n",
                "              style={{\n",
                "                padding: '6px 14px',\n",
                "                backgroundColor: '#131814',\n",
                "                border: '1px solid #38bdf8',\n",
                "                color: '#38bdf8',\n",
                "                borderRadius: '4px',\n",
                "                fontSize: '11px',\n",
                "                fontFamily: 'JetBrains Mono, monospace',\n",
                "                cursor: 'pointer',\n",
                "                fontWeight: 600,\n",
                "              }}\n",
                "              title=\"Пакетное сканирование всех плагинов в папке plugins (Idea 13)\"\n",
                "            >\n",
                "              📂 Пакетный аудит папки\n",
                "            </button>\n",
                "          )}\n"
            ]
            lines[btn_close_idx+1:btn_close_idx+1] = batch_btn
        break

with open(audit_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("AUDIT_VIEW_BATCH_BUTTON_ADDED")
