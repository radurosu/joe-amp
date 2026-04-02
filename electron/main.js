const { app, BrowserWindow, ipcMain, dialog, protocol, net } = require('electron')
const path = require('path')
const fs = require('fs')

// Must be called before app is ready
protocol.registerSchemesAsPrivileged([{
  scheme: 'joeamp',
  privileges: { secure: true, standard: true, supportFetchAPI: true, stream: true },
}])

const AUDIO_EXTS = new Set(['.mp3', '.flac', '.ogg', '.wav', '.m4a', '.aac', '.opus', '.wma'])

function parseM3U(m3uPath) {
  const dir = path.dirname(m3uPath)
  return fs.readFileSync(m3uPath, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => (path.isAbsolute(l) ? l : path.resolve(dir, l)))
    .filter((l) => AUDIO_EXTS.has(path.extname(l).toLowerCase()))
}

function collectAudioFiles(inputPath) {
  const results = []
  const stat = fs.statSync(inputPath)
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(inputPath).sort()) {
      results.push(...collectAudioFiles(path.join(inputPath, entry)))
    }
  } else if (['.m3u', '.m3u8'].includes(path.extname(inputPath).toLowerCase())) {
    results.push(...parseM3U(inputPath))
  } else if (AUDIO_EXTS.has(path.extname(inputPath).toLowerCase())) {
    results.push(inputPath)
  }
  return results
}

const isDev = !app.isPackaged

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 275,
    height: 380,
    minWidth: 275,
    maxWidth: 275,
    minHeight: 116,
    resizable: true,
    frame: false,
    transparent: false,
    backgroundColor: '#232323',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    // Forward renderer console.log → terminal
    mainWindow.webContents.on('console-message', (_e, level, message) => {
      console.log('[renderer]', message)
    })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  // Serve local audio files via joeamp://local/<encoded-path>
  protocol.handle('joeamp', (request) => {
    const filePath = decodeURIComponent(new URL(request.url).pathname.slice(1))
    return net.fetch('file://' + filePath)
  })
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Window controls
ipcMain.on('window:close', () => mainWindow.close())
ipcMain.on('window:minimize', () => mainWindow.minimize())
ipcMain.on('window:resize', (_e, height) => {
  const [w] = mainWindow.getSize()
  mainWindow.setSize(w, height, true)
})

// File dialog
ipcMain.handle('dialog:openFiles', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Audio', extensions: ['mp3', 'flac', 'ogg', 'wav', 'm4a', 'aac', 'opus'] },
    ],
  })
  if (canceled) return []
  return filePaths
})

// Metadata reading (music-metadata is ESM, use dynamic import)
async function readMeta(filePath) {
  try {
    const { parseFile } = await import('music-metadata')
    const meta = await parseFile(filePath, { duration: true })
    return {
      title: meta.common.title || path.basename(filePath, path.extname(filePath)),
      artist: meta.common.artist || 'Unknown Artist',
      album: meta.common.album || '',
      duration: meta.format.duration || 0,
    }
  } catch {
    return {
      title: path.basename(filePath, path.extname(filePath)),
      artist: 'Unknown Artist',
      album: '',
      duration: 0,
    }
  }
}

ipcMain.handle('fs:resolveDropped', (_e, paths) => {
  const results = []
  for (const p of paths) {
    try { results.push(...collectAudioFiles(p)) } catch { /* skip unreadable paths */ }
  }
  return results
})

ipcMain.handle('playlist:save', async (_e, tracks) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'playlist.m3u',
    filters: [{ name: 'M3U Playlist', extensions: ['m3u'] }],
  })
  if (canceled || !filePath) return false
  const lines = ['#EXTM3U']
  for (const t of tracks) {
    lines.push(`#EXTINF:${Math.round(t.duration)},${t.artist} - ${t.title}`)
    lines.push(t.path)
  }
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8')
  return true
})

// Returns null in dev (renderer uses Vite's served ./start.m4a),
// or the absolute path to the extraResource in production
ipcMain.handle('app:startSoundPath', () => {
  if (isDev) return null
  return path.join(process.resourcesPath, 'start.m4a')
})

ipcMain.handle('metadata:read', (_e, filePath) => readMeta(filePath))

ipcMain.handle('metadata:readBatch', (_e, filePaths) =>
  Promise.all(filePaths.map(readMeta))
)
