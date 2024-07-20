const windowStateManager = require('electron-window-state');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const contextMenu = require('electron-context-menu');
const serve = require('electron-serve');
const path = require('path');
const fs = require('fs');
const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');

// Obtenha o diretório de dados do usuário do Electron
const userDataPath = app.getPath('userData');

// Defina a pasta onde o arquivo .db será criado
const dbFolderPath = path.join(userDataPath, 'userdb');
const dbPath = path.join("./", 'data.db');

// Certifique-se de que a pasta existe
if (!fs.existsSync(dbFolderPath)) {
  fs.mkdirSync(dbFolderPath, { recursive: true });
}

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Cria uma instância do servidor Express
const exServer = express();
exServer.use(cors());
exServer.use(express.json());

const db = new Database(dbPath);

// Função para verificar se a tabela existe e criar se necessário
function createTables() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS cliente (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        cpf TEXT UNIQUE,
        endereco TEXT,
        bairro TEXT,
        cidade TEXT,
        numero_casa TEXT,
        complemento TEXT,
        tel TEXT,
        tel2 TEXT
      );
      CREATE TABLE IF NOT EXISTS carro (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER REFERENCES cliente(id) ON DELETE CASCADE,
        placa TEXT UNIQUE,
        marca TEXT,
        modelo TEXT,
        ano INTEGER,
        km INTEGER,
        potencia INTEGER,
        observacao TEXT,
        obsretifica TEXT
      );
      CREATE TABLE IF NOT EXISTS peca (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        marca TEXT
      );
      CREATE TABLE IF NOT EXISTS ordem_servico (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        carro_id INTEGER REFERENCES carro(id) ON DELETE CASCADE,
        observacao TEXT,
        data DATE NOT NULL,
        valor_total DECIMAL(10, 2) NOT NULL
      );
      CREATE TABLE IF NOT EXISTS troca_peca (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ordem_servico_id INTEGER REFERENCES ordem_servico(id) ON DELETE CASCADE,
        nome_peca TEXT NOT NULL,
        marca_peca TEXT NOT NULL,
        quantidade INTEGER NOT NULL,
        preco_unitario DECIMAL(10, 2) NOT NULL
      );
    `);
    console.log('Tables created successfully');
}

createTables();

function getAllClients() {
  return new Promise((resolve, reject) => {
    try {
      const rows = db.prepare('SELECT * FROM cliente').all();
      resolve(rows);
    } catch (err) {
      reject(err);
    }
  });
}

function getAllCars() {
  return new Promise((resolve, reject) => {
    try {
      const rows = db.prepare('SELECT * FROM carro').all();
      resolve(rows);
    } catch (err) {
      reject(err);
    }
  });
}

function getAllParts(sortby) {
  return new Promise((resolve, reject) => {
    try {
      const query = `SELECT * FROM peca ORDER BY ${sortby}`;
      const rows = db.prepare(query).all();
      resolve(rows);
    } catch (err) {
      reject(err);
    }
  });
}

exServer.post('/api/insert-part', async (req, res) => {
  try {
    const { nome, marca } = req.body;
    const insertPartQuery = `INSERT INTO peca (nome, marca) VALUES (?, ?)`;
    const stmt = db.prepare(insertPartQuery);
    const info = stmt.run(nome, marca);
    res.send({ message: 'Peça inserida com sucesso!', partId: info.lastInsertRowid });
  } catch (error) {
    console.error("Erro ao inserir peça:", error.message);
    res.status(500).send({ error: error.message });
  }
});

exServer.put('/api/update-parts', async (req, res) => {
  try {
    const { id, nome, marca } = req.body;
    console.log("Dados recebidos para atualização:", { id, nome, marca });
    
    const updatePartQuery = `UPDATE peca SET nome = ?, marca = ? WHERE id = ?`;
    const stmt = db.prepare(updatePartQuery);
    const info = stmt.run(nome, marca, id);
    
    if (info.changes === 0) {
      throw new Error('Nenhuma peça encontrada com o ID fornecido.');
    }

    res.send({ message: 'Peça atualizada com sucesso!' });
  } catch (error) {
    console.error("Erro ao atualizar peça:", error.message);
    res.status(500).send({ error: error.message });
  }
});

exServer.delete('/api/delete-part/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletePartQuery = `DELETE FROM peca WHERE id = ?`;
    const stmt = db.prepare(deletePartQuery);
    const info = stmt.run(id);

    if (info.changes === 0) {
      throw new Error('Nenhuma peça encontrada com o ID fornecido.');
    }

    res.send({ message: 'Peça deletada com sucesso!' });
  } catch (error) {
    console.error("Erro ao deletar peça:", error.message);
    res.status(500).send({ error: error.message });
  }
});

exServer.get('/api/clients', async (req, res) => {
  try {
    const clients = await getAllClients();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

exServer.get('/api/cars', async (req, res) => {
  try {
    const cars = await getAllCars();
    res.json(cars);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

exServer.get('/api/parts', async (req, res) => {
  try {
    const parts = await getAllParts('marca');
    res.json(parts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

exServer.post('/api/save-os', async (req, res) => {
  try {
    const { carroId, observacao, data, valorTotal, itens } = req.body;

    const insertOsQuery = `INSERT INTO ordem_servico (carro_id, observacao, data, valor_total) VALUES (?, ?, ?, ?)`;
    const osParams = [carroId, observacao, data, valorTotal];

    const stmt = db.prepare(insertOsQuery);
    const info = stmt.run(...osParams);
    const ordemServicoId = info.lastInsertRowid;

    const insertItemQuery = `INSERT INTO troca_peca (ordem_servico_id, nome_peca, marca_peca, quantidade, preco_unitario) VALUES (?, ?, ?, ?, ?)`;

    const itemStmt = db.prepare(insertItemQuery);
    const insertMany = db.transaction((itens) => {
      for (const item of itens) {
        itemStmt.run(ordemServicoId, item.nome, item.marca, item.quantidade, item.preco);
      }
    });

    insertMany(itens);

    res.send({ message: 'Ordem de Serviço salva com sucesso!', ordemServicoId });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

try {
  require('electron-reloader')(module);
} catch (e) {
  console.error(e);
}

const serveURL = serve({ directory: '.' });
const port = process.env.PORT || 5173;
const dev = !app.isPackaged;
let mainWindow;

function createWindow() {
  let windowState = windowStateManager({
    defaultWidth: 1280,
    defaultHeight: 720,
  });

  mainWindow = new BrowserWindow({
    minHeight: 720,
    minWidth: 1280,
    webPreferences: {
      enableRemoteModule: true,
      contextIsolation: true,
      nodeIntegration: true,
      spellcheck: false,
      devTools: dev,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
  });

  windowState.manage(mainWindow);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('close', () => {
    windowState.saveState(mainWindow);
  });

  return mainWindow;
}

contextMenu({
  showLookUpSelection: false,
  showSearchWithGoogle: false,
  showCopyImage: false,
  prepend: (defaultActions, params, browserWindow) => [
    {
      label: 'Save as PDF',
      click: () => {
        mainWindow.webContents.send('save-pdf');
      }
    },
  ],
});

function loadVite(port) {
  mainWindow.loadURL(`http://localhost:${port}`).catch((e) => {
    console.log('Error loading URL, retrying', e);
    setTimeout(() => {
      loadVite(port);
    }, 200);
  });
}

function createMainWindow() {
  mainWindow = createWindow();
  mainWindow.once('close', () => {
    mainWindow = null;
  });

  if (dev) loadVite(port);
  else serveURL(mainWindow);

  autoUpdater.checkForUpdates();

  ipcMain.on('getAppVersion', (event) => {
    event.reply('getAppVersion', { version: app.getVersion() });
  });

  ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.on('close_app', () => {
    app.quit();
  });

  ipcMain.handle('getAppVersion', () => {
    return app.getVersion();
  });

  ipcMain.on('print-to-pdf', async (event, content) => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save PDF',
      defaultPath: 'OrdemDeServico.pdf',
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });

    if (canceled || !filePath) {
      return;
    }

    const options = {
      marginsType: 0,
      pageSize: 'A4',
      printBackground: true,
      printSelectionOnly: false,
      landscape: false,
    };

    try {
      const win = new BrowserWindow({ show: false });
      await win.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(content)}`);
      const pdfData = await win.webContents.printToPDF(options);
      fs.writeFileSync(filePath, pdfData);
      win.close();
      event.reply('pdf-generated', filePath);
      dialog.showMessageBox({
        type: 'info',
        title: 'PDF Generated',
        message: `PDF has been saved to ${filePath}`,
        buttons: ['OK']
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      event.reply('pdf-error', error.message);
    }
  });
}

app.once('ready', createMainWindow);
app.on('activate', () => {
  if (!mainWindow) {
    createMainWindow();
  }
});

server = exServer.listen(3000, () => {
  console.log('Express server is running on port 3000');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('to-main', (event, count) => {
  event.reply('from-main', `next count is ${count + 1}`);
});

ipcMain.on('fetch-data', (event) => {
  try {
    const rows = db.prepare('SELECT * FROM Artist').all();
    event.reply('fetch-data-success', rows);
  } catch (err) {
    console.error(err.message);
    event.reply('fetch-data-error', err.message);
  }
});

autoUpdater.on('update-available', () => {
  dialog
    .showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: 'A new update is available. Do you want to download it now?',
      buttons: ['Yes', 'No'],
    })
    .then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
});

autoUpdater.on('update-downloaded', () => {
  dialog
    .showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. It will be installed on restart. Restart now?',
      buttons: ['Yes', 'Later'],
    })
    .then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
});

autoUpdater.on('update-not-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'No Updates',
    message: 'No updates available.',
    buttons: ['OK'],
  });
});

app.on('will-quit', () => {
  // Close express server
  if (server) {
    server.close();
    console.log('Express server is closed');
  }
});
