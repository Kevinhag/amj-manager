const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  printToPDF: (content) => ipcRenderer.send('print-to-pdf', content),
  onPDFGenerated: (callback) => ipcRenderer.on('pdf-generated', callback),
  onPDFError: (callback) => ipcRenderer.on('pdf-error', callback),
  onSavePDF: (callback) => ipcRenderer.on('save-pdf', callback),
  getAppVersion: () => ipcRenderer.invoke('getAppVersion'),

  send: (channel, data) => {
    // Coloque os canais permitidos aqui
    let validChannels = ['print-to-pdf', 'save-pdf'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  sendSync: (channel, data) => {
    let validChannels = ['getAppVersion'];
    if (validChannels.includes(channel)) {
      return ipcRenderer.sendSync(channel, data);
    }
  },
  receive: (channel, func) => {
    let validChannels = ['pdf-generated', 'pdf-error', 'save-pdf'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
});
