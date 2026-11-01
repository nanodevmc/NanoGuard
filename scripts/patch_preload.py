import os

preload_path = r'C:\Users\nanodev\NanoGuard\electron\preload.ts'
with open(preload_path, 'r', encoding='utf-8') as f:
    text = f.read()

target = "  selectOutputDir: () => ipcRenderer.invoke('select-output-dir'),"
replace = """  selectOutputDir: () => ipcRenderer.invoke('select-output-dir'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  listJarsInDirectory: (dirPath: string) => ipcRenderer.invoke('list-jars-in-directory', dirPath),"""

assert target in text, "target not found in preload.ts"
text = text.replace(target, replace)

with open(preload_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("PRELOAD_TS_UPDATED")
