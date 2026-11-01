import os

main_path = r'C:\Users\nanodev\NanoGuard\electron\main.ts'
with open(main_path, 'r', encoding='utf-8') as f:
    text = f.read()

target = """// IPC: Select Output Directory
ipcMain.handle('select-output-dir', async () => {
  if (!mainWindow) return null;
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Выберите папку для сохранения',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (res.canceled || res.filePaths.length === 0) return null;
  return res.filePaths[0];
});"""

replace = """// IPC: Select Output Directory
ipcMain.handle('select-output-dir', async () => {
  if (!mainWindow) return null;
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Выберите папку для сохранения',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (res.canceled || res.filePaths.length === 0) return null;
  return res.filePaths[0];
});

// IPC: Select Directory (for Batch Scan)
ipcMain.handle('select-directory', async () => {
  if (!mainWindow) return null;
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Выберите папку plugins для аудита',
    properties: ['openDirectory'],
  });
  if (res.canceled || res.filePaths.length === 0) return null;
  return res.filePaths[0];
});

// IPC: List JARs in Directory
ipcMain.handle('list-jars-in-directory', async (_event, dirPath: string) => {
  if (!dirPath || !fs.existsSync(dirPath)) return [];
  try {
    const files = fs.readdirSync(dirPath);
    return files
      .filter((f) => f.toLowerCase().endsWith('.jar'))
      .map((f) => path.join(dirPath, f));
  } catch {
    return [];
  }
});"""

if target in text:
    text = text.replace(target, replace)
else:
    target_rn = target.replace('\n', '\r\n')
    replace_rn = replace.replace('\n', '\r\n')
    assert target_rn in text, "target not found in main.ts"
    text = text.replace(target_rn, replace_rn)

with open(main_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("MAIN_TS_UPDATED_WITH_BATCH_HANDLERS")
