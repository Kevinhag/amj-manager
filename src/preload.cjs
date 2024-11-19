const { contextBridge, ipcRenderer } = require('electron');

const validSendChannels = ['print-to-pdf', 'save-pdf'];
const validSendSyncChannels = ['getAppVersion'];
const validReceiveChannels = ['pdf-generated', 'pdf-error', 'save-pdf'];

contextBridge.exposeInMainWorld('electron', {
  printToPDF: (content) => {
    if (typeof content === 'string') {
      ipcRenderer.send('print-to-pdf', content);
    } else {
      console.error('Invalid content type for printToPDF');
    }
  },

  onPDFGenerated: (callback) => {
    if (typeof callback === 'function') {
      ipcRenderer.on('pdf-generated', (event, ...args) => callback(...args));
    }
  },

  onPDFError: (callback) => {
    if (typeof callback === 'function') {
      ipcRenderer.on('pdf-error', (event, ...args) => callback(...args));
    }
  },

  onSavePDF: (callback) => {
    if (typeof callback === 'function') {
      ipcRenderer.on('save-pdf', (event, ...args) => callback(...args));
    }
  },

  getAppVersion: async () => {
    try {
      return await ipcRenderer.invoke('getAppVersion');
    } catch (error) {
      console.error('Error getting app version:', error);
    }
  },

  updateServiceOrder: async (osData) => {
    try {
      return await ipcRenderer.invoke('update-service-order', osData);
    } catch (error) {
      console.error('Error updating service order:', error);
      throw error;
    }
  },

  fetchReportData: async (reportType, params) => {
    return await ipcRenderer.invoke('fetch-report-data', reportType, params);
  },

  fetchClients: async () => {
    return await ipcRenderer.invoke('fetch-clients');
  },

  fetchServiceOrdersByClient: async (clientId) => {
    return await ipcRenderer.invoke('fetch-service-orders-by-client', clientId);
  },

  send: (channel, data) => {
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  sendSync: (channel, data) => {
    if (validSendSyncChannels.includes(channel)) {
      return ipcRenderer.sendSync(channel, data);
    }
  },

  receive: (channel, func) => {
    if (validReceiveChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
});
