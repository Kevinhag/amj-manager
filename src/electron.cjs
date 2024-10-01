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
        'Atualização baixada. Será instalado quando reiniciar o programa. Reiniciar agora?',
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

  // Verificar se a coluna 'forma_pagamento' já existe
  const result = db.prepare(`
    PRAGMA table_info(ordem_servico);
  `).all();

  const columnExists = result.some(column => column.name === 'forma_pagamento');

  if (!columnExists) {
    db.exec(`
      ALTER TABLE ordem_servico
      ADD COLUMN forma_pagamento TEXT;
    `);
    console.log("A coluna 'forma_pagamento' foi adicionada com sucesso.");
  }
  console.log("A coluna 'forma_pagamento' já existe.");

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
    const info = stmt.run(nome, marca);
    const newPart = { id: info.lastInsertRowid, nome, marca }; // Retorna a nova peça com id, nome e marca
    res.send(newPart);
  } catch (error) {
    console.error("Erro ao inserir peça:", error.message);
    res.status(500).send({ error: error.message });
  }
});

exServer.post('/api/insert-client', async (req, res) => {
  try {
    const { nome, cpf, endereco, bairro, cidade, numero_casa, complemento, tel, tel2 } = req.body;
    const insertClientQuery = `INSERT INTO cliente (nome, cpf, endereco, bairro, cidade, numero_casa, complemento, tel, tel2) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const stmt = db.prepare(insertClientQuery);
    const info = stmt.run(nome, cpf, endereco, bairro, cidade, numero_casa, complemento, tel, tel2);
    res.send({ message: 'Cliente inserido com sucesso!', clientId: info.lastInsertRowid });
  } catch (error) {
    console.error("Erro ao inserir cliente:", error.message);
    res.status(500).send({ error: error.message });
  }
});

exServer.put('/api/update-client', async (req, res) => {
  try {
    const { id, nome, cpf, endereco, bairro, cidade, numero_casa, complemento, tel, tel2 } = req.body;
    const updateClientQuery = `UPDATE cliente SET nome = ?, cpf = ?, endereco = ?, bairro = ?, cidade = ?, numero_casa = ?, complemento = ?, tel = ?, tel2 = ? WHERE id = ?`;
    const stmt = db.prepare(updateClientQuery);
    const info = stmt.run(nome, cpf, endereco, bairro, cidade, numero_casa, complemento, tel, tel2, id);
    
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
    const { cliente_id, modelo, marca, placa, ano, km, potencia, observacao, obsretifica } = req.body;
    const insertCarQuery = `INSERT INTO carro (cliente_id, modelo, marca, placa, ano, km, potencia, observacao, obsretifica) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const stmt = db.prepare(insertCarQuery);
    const info = stmt.run(cliente_id, modelo, marca, placa, ano, km, potencia, observacao, obsretifica);
    res.send({ message: 'Carro inserido com sucesso!', carId: info.lastInsertRowid });
  } catch (error) {
    console.error("Erro ao inserir carro:", error.message);
    res.status(500).send({ error: error.message });
  }
});

// Atualizar carro
exServer.put('/api/update-car', async (req, res) => {
  try {
    const { id, cliente_id, modelo, marca, placa, ano, km, potencia, observacao, obsretifica } = req.body;
    const updateCarQuery = `UPDATE carro SET cliente_id = ?, modelo = ?, marca = ?, placa = ?, ano = ?, km = ?, potencia = ?, observacao = ?, obsretifica = ? WHERE id = ?`;
    const stmt = db.prepare(updateCarQuery);
    const info = stmt.run(cliente_id, modelo, marca, placa, ano, km, potencia, observacao, obsretifica, id);
    
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

    // Adicionando a forma de pagamento na query de inserção
    const insertOsQuery = `
      INSERT INTO ordem_servico (carro_id, observacao, data, valor_total, forma_pagamento) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const osParams = [carroId, observacao, data, valorTotal, formaPagamento];

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
        itemStmt.run(ordemServicoId, item.nome, item.marca, item.quantidade, item.preco);
      }
    });

    insertMany(itens);

    res.send({ message: 'Ordem de Serviço salva com sucesso!', ordemServicoId });
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
})

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


  ipcMain.handle('fetch-report-data', async (event, reportType, params) => {
    try {
      let query = '';
      let queryParams = [];
  
      if (reportType === 'daily') {
        query = `
          SELECT 
            cliente.id AS clientId,
            cliente.nome AS nome_cliente,
            cliente.cpf AS cpf,
            cliente.tel AS telefone,
            ordem_servico.id AS osId,
            ordem_servico.data AS data,
            ordem_servico.valor_total AS valorTotal,
            ordem_servico.forma_pagamento AS formaPagamento,
            ordem_servico.observacao AS observacao,
            carro.modelo AS carro_modelo,
            carro.marca AS carro_marca,
            carro.placa AS carro_placa,
            troca_peca.id AS itemId,
            troca_peca.nome_peca AS item_nome,
            troca_peca.quantidade AS quantidade,
            troca_peca.preco_unitario AS preco
          FROM ordem_servico
          JOIN carro ON ordem_servico.carro_id = carro.id
          JOIN cliente ON carro.cliente_id = cliente.id
          LEFT JOIN troca_peca ON troca_peca.ordem_servico_id = ordem_servico.id
          WHERE DATE(ordem_servico.data) = DATE(?)
          ORDER BY cliente.nome, ordem_servico.data
        `;
        queryParams = [params.date];
      } else if (reportType === 'monthly') {
        query = `
          SELECT 
            cliente.id AS clientId,
            cliente.nome AS nome_cliente,
            cliente.cpf AS cpf,
            cliente.tel AS telefone,
            ordem_servico.id AS osId,
            ordem_servico.data AS data,
            ordem_servico.valor_total AS valorTotal,
            ordem_servico.forma_pagamento AS formaPagamento,
            ordem_servico.observacao AS observacao,
            carro.modelo AS carro_modelo,
            carro.marca AS carro_marca,
            carro.placa AS carro_placa,
            troca_peca.id AS itemId,
            troca_peca.nome_peca AS item_nome,
            troca_peca.quantidade AS quantidade,
            troca_peca.preco_unitario AS preco
          FROM ordem_servico
          JOIN carro ON ordem_servico.carro_id = carro.id
          JOIN cliente ON carro.cliente_id = cliente.id
          LEFT JOIN troca_peca ON troca_peca.ordem_servico_id = ordem_servico.id
          WHERE strftime('%Y-%m', ordem_servico.data) = ?
          ORDER BY cliente.nome, ordem_servico.data
        `;
        queryParams = [params.month];
      } else if (reportType === 'annual') {
        query = `
          SELECT 
            cliente.id AS clientId,
            cliente.nome AS nome_cliente,
            cliente.cpf AS cpf,
            cliente.tel AS telefone,
            ordem_servico.id AS osId,
            ordem_servico.data AS data,
            ordem_servico.valor_total AS valorTotal,
            ordem_servico.forma_pagamento AS formaPagamento,
            ordem_servico.observacao AS observacao,
            carro.modelo AS carro_modelo,
            carro.marca AS carro_marca,
            carro.placa AS carro_placa,
            troca_peca.id AS itemId,
            troca_peca.nome_peca AS item_nome,
            troca_peca.quantidade AS quantidade,
            troca_peca.preco_unitario AS preco
          FROM ordem_servico
          JOIN carro ON ordem_servico.carro_id = carro.id
          JOIN cliente ON carro.cliente_id = cliente.id
          LEFT JOIN troca_peca ON troca_peca.ordem_servico_id = ordem_servico.id
          WHERE strftime('%Y', ordem_servico.data) = ?
          ORDER BY cliente.nome, ordem_servico.data
        `;
        queryParams = [params.year.toString()];
      } else if (reportType === 'custom') {
        query = `
          SELECT 
            cliente.id AS clientId,
            cliente.nome AS nome_cliente,
            cliente.cpf AS cpf,
            cliente.tel AS telefone,
            ordem_servico.id AS osId,
            ordem_servico.data AS data,
            ordem_servico.valor_total AS valorTotal,
            ordem_servico.forma_pagamento AS formaPagamento,
            ordem_servico.observacao AS observacao,
            carro.modelo AS carro_modelo,
            carro.marca AS carro_marca,
            carro.placa AS carro_placa,
            troca_peca.id AS itemId,
            troca_peca.nome_peca AS item_nome,
            troca_peca.quantidade AS quantidade,
            troca_peca.preco_unitario AS preco
          FROM ordem_servico
          JOIN carro ON ordem_servico.carro_id = carro.id
          JOIN cliente ON carro.cliente_id = cliente.id
          LEFT JOIN troca_peca ON troca_peca.ordem_servico_id = ordem_servico.id
          WHERE ordem_servico.data BETWEEN ? AND ?
          ORDER BY cliente.nome, ordem_servico.data
        `;
        queryParams = [params.startDate, params.endDate];
      } else {
        throw new Error('Invalid report type');
      }
  
      const stmt = db.prepare(query);
      const data = stmt.all(...queryParams);
      return data;
    } catch (error) {
      console.error('Error fetching report data:', error);
      throw error;
    }
  });
  
  

  // autoUpdater.checkForUpdatesAndNotify();

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
        message: `PDF Foi salvo em ${filePath}`,
        buttons: ['OK']
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

server = exServer.listen(3000, () => {
  console.log('O Express Server está sendo executado na porta 3000');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/* ipcMain.on('to-main', (event, count) => {
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
}); */

app.on('will-quit', () => {
  if (server) {
    server.close();
    console.log('O Express Server foi fechado');
  }
});
