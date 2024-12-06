const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const packageJson = require('../package.json');
const windowStateManager = require('electron-window-state');
const contextMenu = require('electron-context-menu');
const serve = require('electron-serve');

const userDataPath = app.getPath('userData'); // %appdata%

const dbFolderPath = path.join(userDataPath, 'userdb');
const dbPath = path.join(dbFolderPath, 'data.db');

if (!fs.existsSync(dbFolderPath)) {
  fs.mkdirSync(dbFolderPath, { recursive: true });
}

const exServer = express();
exServer.use(cors());
exServer.use(express.json());

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('checking-for-update', () => {
  console.log('Verificando atualizações...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Atualização disponível:', info);
  dialog.showMessageBox({
    type: 'info',
    title: 'Atualização disponível',
    message: 'Uma nova versão está disponível. Baixando agora...',
    buttons: ['OK'],
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog
    .showMessageBox({
      type: 'info',
      title: 'Atualização Pronta',
      message:
        'Atualização baixada. Será instalada quando reiniciar o programa. Reiniciar agora?',
      buttons: ['Sim', 'Não'],
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
    title: 'Sem Atualizações',
    message: 'Nenhuma atualização disponível.',
    buttons: ['OK'],
  });
});

const db = new Database(dbPath);

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cliente (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      cpf TEXT,
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
      placa TEXT,
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
      valor_total DECIMAL(10, 2),
      forma_pagamento TEXT
    );

    CREATE TABLE IF NOT EXISTS troca_peca (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ordem_servico_id INTEGER REFERENCES ordem_servico(id) ON DELETE CASCADE,
      nome_peca TEXT,
      marca_peca TEXT,
      quantidade INTEGER,
      preco_unitario DECIMAL(10, 2)
    );
  `);

  console.log('Tabelas criadas com sucesso.');
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
    const info = stmt.run(nome.toUpperCase(), marca.toUpperCase());
    const newPart = { id: info.lastInsertRowid, nome: nome.toUpperCase(), marca: marca.toUpperCase() };
    res.send(newPart);
  } catch (error) {
    console.error("Erro ao inserir peça:", error.message);
    res.status(500).send({ error: error.message });
  }
});

exServer.post('/api/insert-client', async (req, res) => {
  try {
    const {
      nome,
      cpf,
      endereco,
      bairro,
      cidade,
      numero_casa,
      complemento,
      tel,
      tel2,
    } = req.body;
    const insertClientQuery = `INSERT INTO cliente (nome, cpf, endereco, bairro, cidade, numero_casa, complemento, tel, tel2) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const stmt = db.prepare(insertClientQuery);
    const info = stmt.run(
      nome.toUpperCase(),
      cpf.toUpperCase(),
      endereco.toUpperCase(),
      bairro.toUpperCase(),
      cidade.toUpperCase(),
      numero_casa.toUpperCase(),
      complemento.toUpperCase(),
      tel.toUpperCase(),
      tel2.toUpperCase()
    );
    res.send({ message: 'Cliente inserido com sucesso!', clientId: info.lastInsertRowid });
  } catch (error) {
    console.error("Erro ao inserir cliente:", error.message);
    res.status(500).send({ error: error.message });
  }
});

exServer.put('/api/update-client', async (req, res) => {
  try {
    const {
      id,
      nome,
      cpf,
      endereco,
      bairro,
      cidade,
      numero_casa,
      complemento,
      tel,
      tel2,
    } = req.body;
    const updateClientQuery = `UPDATE cliente SET nome = ?, cpf = ?, endereco = ?, bairro = ?, cidade = ?, numero_casa = ?, complemento = ?, tel = ?, tel2 = ? WHERE id = ?`;
    const stmt = db.prepare(updateClientQuery);
    const info = stmt.run(
      nome.toUpperCase(),
      cpf.toUpperCase(),
      endereco.toUpperCase(),
      bairro.toUpperCase(),
      cidade.toUpperCase(),
      numero_casa.toUpperCase(),
      complemento.toUpperCase(),
      tel.toUpperCase(),
      tel2.toUpperCase(),
      id
    );

    if (info.changes === 0) {
      throw new Error('Nenhum cliente encontrado com o ID fornecido.');
    }

    res.send({ message: 'Cliente atualizado com sucesso!' });
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error.message);
    res.status(500).send({ error: error.message });
  }
});

exServer.delete('/api/delete-client/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleteClientQuery = `DELETE FROM cliente WHERE id = ?`;
    const stmt = db.prepare(deleteClientQuery);
    const info = stmt.run(id);

    if (info.changes === 0) {
      throw new Error('Nenhum cliente encontrado com o ID fornecido.');
    }

    res.send({ message: 'Cliente deletado com sucesso!' });
  } catch (error) {
    console.error("Erro ao deletar cliente:", error.message);
    res.status(500).send({ error: error.message });
  }
});

// Inserir carro
exServer.post('/api/insert-car', async (req, res) => {
  try {
    const {
      cliente_id,
      modelo,
      marca,
      placa,
      ano,
      km,
      potencia,
      observacao,
      obsretifica,
    } = req.body;
    const insertCarQuery = `INSERT INTO carro (cliente_id, modelo, marca, placa, ano, km, potencia, observacao, obsretifica) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const stmt = db.prepare(insertCarQuery);
    const info = stmt.run(
      cliente_id,
      modelo.toUpperCase(),
      marca.toUpperCase(),
      placa.toUpperCase(),
      ano,
      km,
      potencia,
      observacao.toUpperCase(),
      obsretifica.toUpperCase()
    );
    res.send({ message: 'Carro inserido com sucesso!', carId: info.lastInsertRowid });
  } catch (error) {
    console.error("Erro ao inserir carro:", error.message);
    res.status(500).send({ error: error.message });
  }
});

// Atualizar carro
exServer.put('/api/update-car', async (req, res) => {
  try {
    const {
      id,
      cliente_id,
      modelo,
      marca,
      placa,
      ano,
      km,
      potencia,
      observacao,
      obsretifica,
    } = req.body;
    const updateCarQuery = `UPDATE carro SET cliente_id = ?, modelo = ?, marca = ?, placa = ?, ano = ?, km = ?, potencia = ?, observacao = ?, obsretifica = ? WHERE id = ?`;
    const stmt = db.prepare(updateCarQuery);
    const info = stmt.run(
      cliente_id,
      modelo.toUpperCase(),
      marca.toUpperCase(),
      placa.toUpperCase(),
      ano,
      km,
      potencia,
      observacao.toUpperCase(),
      obsretifica.toUpperCase(),
      id
    );

    if (info.changes === 0) {
      throw new Error('Nenhum carro encontrado com o ID fornecido.');
    }

    res.send({ message: 'Carro atualizado com sucesso!' });
  } catch (error) {
    console.error("Erro ao atualizar carro:", error.message);
    res.status(500).send({ error: error.message });
  }
});

exServer.put('/api/update-parts', async (req, res) => {
  try {
    const { id, nome, marca } = req.body;
    const updatePartQuery = `UPDATE peca SET nome = ?, marca = ? WHERE id = ?`;
    const stmt = db.prepare(updatePartQuery);
    const info = stmt.run(nome.toUpperCase(), marca.toUpperCase(), id);

    if (info.changes === 0) {
      throw new Error('Nenhuma peça encontrada com o ID fornecido.');
    }

    res.send({ message: 'Peça atualizada com sucesso!' });
  } catch (error) {
    console.error("Erro ao atualizar peça:", error.message);
    res.status(500).send({ error: error.message });
  }
});

exServer.delete('/api/delete-car/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleteCarQuery = `DELETE FROM carro WHERE id = ?`;
    const stmt = db.prepare(deleteCarQuery);
    const info = stmt.run(id);

    if (info.changes === 0) {
      throw new Error('Nenhum carro encontrado com o ID fornecido.');
    }

    res.send({ message: 'Carro deletado com sucesso!' });
  } catch (error) {
    console.error("Erro ao deletar carro:", error.message);
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
    const { carroId, observacao, data, valorTotal, itens, formaPagamento } = req.body;

    const insertOsQuery = `
      INSERT INTO ordem_servico (carro_id, observacao, data, valor_total, forma_pagamento) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const osParams = [carroId, observacao.toUpperCase(), data, valorTotal, formaPagamento.toUpperCase()];

    const stmt = db.prepare(insertOsQuery);
    const info = stmt.run(...osParams);
    const ordemServicoId = info.lastInsertRowid;

    const insertItemQuery = `
      INSERT INTO troca_peca (ordem_servico_id, nome_peca, marca_peca, quantidade, preco_unitario) 
      VALUES (?, ?, ?, ?, ?)
    `;

    const itemStmt = db.prepare(insertItemQuery);
    const insertMany = db.transaction((itens) => {
      for (const item of itens) {
        itemStmt.run(
          ordemServicoId,
          item.nome.toUpperCase(),
          item.marca.toUpperCase(),
          item.quantidade,
          item.preco
        );
      }
    });

    insertMany(itens);

    res.send({ message: 'Ordem de Serviço salva com sucesso!', ordemServicoId });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Rota para atualizar uma ordem de serviço existente
exServer.put('/api/update-os', async (req, res) => {
  try {
    const {
      id,
      carro_id,
      observacao,
      data,
      valor_total,
      itens,
      forma_pagamento,
    } = req.body;

    // Atualizar a ordem de serviço
    const updateOsQuery = `
      UPDATE ordem_servico
      SET carro_id = ?, observacao = ?, data = ?, valor_total = ?, forma_pagamento = ?
      WHERE id = ?
    `;
    const osParams = [
      carro_id,
      observacao.toUpperCase(),
      data,
      valor_total,
      forma_pagamento.toUpperCase(),
      id,
    ];

    const stmt = db.prepare(updateOsQuery);
    const info = stmt.run(...osParams);

    if (info.changes === 0) {
      throw new Error('Nenhuma Ordem de Serviço encontrada com o ID fornecido.');
    }

    // Excluir itens antigos
    const deleteItemsQuery = `DELETE FROM troca_peca WHERE ordem_servico_id = ?`;
    db.prepare(deleteItemsQuery).run(id);

    // Inserir itens atualizados
    const insertItemQuery = `
      INSERT INTO troca_peca (ordem_servico_id, nome_peca, marca_peca, quantidade, preco_unitario) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const itemStmt = db.prepare(insertItemQuery);
    const insertMany = db.transaction((itens) => {
      for (const item of itens) {
        itemStmt.run(
          id,
          item.nome_peca.toUpperCase(),
          item.marca_peca.toUpperCase(),
          item.quantidade,
          item.preco_unitario
        );
      }
    });

    insertMany(itens);

    res.send({ message: 'Ordem de Serviço atualizada com sucesso!' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

exServer.get('/api/get-os', async (req, res) => {
  try {
    const os = db.prepare('SELECT * FROM ordem_servico').all();
    res.json(os);
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

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('app_version', { version: packageJson.version });
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
      },
    },
  ],
});

function loadVite(port) {
  mainWindow
    .loadURL(`http://localhost:${port}`)
    .catch((e) => {
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

  ipcMain.handle('fetch-clients', async () => {
    try {
      const clients = db.prepare('SELECT * FROM cliente').all();
      return clients;
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  });

  ipcMain.handle('fetch-service-orders-by-client', async (event, clientId) => {
    try {
      const serviceOrders = db
        .prepare(
          `
          SELECT os.*, carro.modelo, carro.marca, carro.placa
          FROM ordem_servico os
          JOIN carro ON os.carro_id = carro.id
          WHERE carro.cliente_id = ?
        `
        )
        .all(clientId);

      // Fetch items for each OS
      for (const os of serviceOrders) {
        const items = db
          .prepare('SELECT * FROM troca_peca WHERE ordem_servico_id = ?')
          .all(os.id);
        os.itens = items;
      }

      return serviceOrders;
    } catch (error) {
      console.error('Error fetching service orders:', error);
      throw error;
    }
  });

  ipcMain.handle('update-service-order', async (event, osData) => {
    try {
      const response = await fetch('http://localhost:3000/api/update-os', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json',},
        body: JSON.stringify(osData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating service order:', error);
      throw error;
    }
  });

  ipcMain.handle('fetch-report-data', async (event, reportType, params) => {
    try {
      // Código existente para fetch-report-data
      // ...
    } catch (error) {
      console.error('Error fetching report data:', error);
      throw error;
    }
  });

  ipcMain.on('getAppVersion', (event) => {
    event.reply('getAppVersion', { version: packageJson.version });
  });

  ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.on('close_app', () => {
    app.quit();
  });

  ipcMain.handle('getAppVersion', () => {
    return packageJson.version;
  });

  ipcMain.on('print-to-pdf', async (event, content) => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save PDF',
      defaultPath: 'OrdemDeServico.pdf',
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
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
        message: `PDF Foi salvo em ${filePath}`,
        buttons: ['OK'],
      });
    } catch (error) {
      console.error('Erro Gerando PDF:', error);
      event.reply('pdf-error', error.message);
    }
  });
}

app.once('ready', () => {
  createMainWindow();
  autoUpdater.checkForUpdatesAndNotify();
});

const server = exServer.listen(3000, () => {
  console.log('O Express Server está sendo executado na porta 3000');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  if (server) {
    server.close();
    console.log('O Express Server foi fechado');
  }
});
