const { contextBridge, ipcRenderer, webUtils } = require('electron')

contextBridge.exposeInMainWorld('winampAPI', {
  openFiles: () => ipcRenderer.invoke('dialog:openFiles'),
  readMetadata: (filePath) => ipcRenderer.invoke('metadata:read', filePath),
  readMetadataBatch: (filePaths) => ipcRenderer.invoke('metadata:readBatch', filePaths),
  getPathForFile: (file) => webUtils.getPathForFile(file),
  resolveDropped: (paths) => ipcRenderer.invoke('fs:resolveDropped', paths),
  savePlaylist: (tracks) => ipcRenderer.invoke('playlist:save', tracks),
  getStartSoundPath: () => ipcRenderer.invoke('app:startSoundPath'),
  closeWindow: () => ipcRenderer.send('window:close'),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  resizeWindow: (height) => ipcRenderer.send('window:resize', height),
  platform: process.platform,
})
