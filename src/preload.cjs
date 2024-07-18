const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {

	printToPDF: (content) => ipcRenderer.send('print-to-pdf', content),
	onPDFGenerated: (callback) => ipcRenderer.on('pdf-generated', callback),
	onPDFError: (callback) => ipcRenderer.on('pdf-error', callback),
	onSavePDF: (callback) => ipcRenderer.on('save-pdf', callback),

	send: (channel, data) => {
		ipcRenderer.send(channel, data);
	},
	sendSync: (channel, data) => {
		ipcRenderer.sendSync(channel, data);
	},
	receive: (channel, func) => {
		ipcRenderer.on(channel, (event, ...args) => func(...args));
	},
	getAppVersion: () => ipcRenderer.invoke('getAppVersion'),
});
