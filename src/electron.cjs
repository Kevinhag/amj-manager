const windowStateManager = require('electron-window-state');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const contextMenu = require('electron-context-menu');
const serve = require('electron-serve');
const path = require('path');

let server;
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Cria uma instância do servidor Express
const exServer = express();
exServer.use(cors());
exServer.use(express.json());

const db = new sqlite3.Database('./data.db', (err) => {
	if (err) {
		console.error(err.message);
	}
	console.log('Connected to the database.');
});


// Habilita a criptografia no banco de dados
// db.serialize(() => {
// 	db.run("PRAGMA key" = "");
// 	db.run("PRAGMA cipher_compatibility = 4");
// })

// sqlite3.verbose();
// const sqlite3WithSEE = sqlite3.verbose();


function inserirOrdemServico(carroId, observacao, data, valorTotal, itens, callback) {
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.run(`INSERT INTO ordem_servico (carro_id, observacao, data, valor_total) 
                VALUES (?, ?, ?, ?)`,
                [carroId, observacao, data, valorTotal],
                function (err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return callback(err);
                    }
                    const ordemServicoId = this.lastID;
                    
                    const stmt = db.prepare(`INSERT INTO troca_peca (ordem_servico_id, peca_id, observacao, quantidade, preco_unitario) 
                                             VALUES (?, ?, ?, ?, ?)`);
                    for (let item of itens) {
                        stmt.run([ordemServicoId, item.pecaId, item.observacao, item.quantidade, item.precoUnitario]);
                    }
                    stmt.finalize();
                    
                    db.run('COMMIT', callback);
                });
    });
}

function inserirTrocaPeca(ordemServicoId, pecaId, observacao, quantidade, precoUnitario, callback) {
    db.run(`INSERT INTO troca_peca (ordem_servico_id, peca_id, observacao, quantidade, preco_unitario) 
            VALUES (?, ?, ?, ?, ?)`,
            [ordemServicoId, pecaId, observacao, quantidade, precoUnitario],
            function (err) {
                if (err) {
                    return callback(err);
                }
                callback(null, this.lastID); // Retorna o ID da nova troca de peça inserida
            });
}


function getAllClients() {
	return new Promise((resolve, reject) => {
		db.all('SELECT * FROM cliente', [], (err, rows) => {
			if (err) {
				reject(err);
			} else {
				resolve(rows);
			}
		});
	});
}

function getClientId() {
	return new Promise((resolve, reject) => {
		db.all('SELECT * FROM cliente WHERE id = ?', [id], (err, rows) => {
			if (err) {
				reject(err);
			} else {
				resolve(rows);
			}
		});
	});
}

function getClientName() {
	return new Promise((resolve, reject) => {
		db.all('SELECT * FROM cliente WHERE nome = ?', [nome], (err, rows) => {
			if (err) {
				reject(err);
			} else {
				resolve(rows);
			}
		});
	});
}

function getClientCPF() {
	return new Promise((resolve, reject) => {
		db.all('SELECT * FROM cliente WHERE cpf = ?', [cpf], (err, rows) => {
			if (err) {
				reject(err);
			} else {
				resolve(rows);
			}
		});
	});
}



function getAllCars() {
	return new Promise((resolve, reject) => {
		db.all('SELECT * FROM carro', [], (err, rows) => {
			if (err) {
				reject(err);
			} else {
				resolve(rows);
			}
		});
	});
}

function getAllParts(sortby) {
	return new Promise((resolve, reject) => {
		const query = `SELECT * FROM peca ORDER BY ${sortby}`;
		db.all(query, [], (err, rows) => {
			if (err) {
				reject(err);
			} else {
				resolve(rows);
			}
		});
	});
}

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


// Rota para salvar uma nova Ordem de Serviço
exServer.post('/api/save-os', async (req, res) => {
    try {
        const { carroId, observacao, data, valorTotal, itens } = req.body;

        // Inserir a Ordem de Serviço no banco de dados
        const insertOsQuery = `INSERT INTO ordem_servico (carro_id, observacao, data, valor_total) VALUES (?, ?, ?, ?)`;
        const osParams = [carroId, observacao, data, valorTotal];

        db.run(insertOsQuery, osParams, function(err) {
            if (err) {
                return res.status(500).send({ error: err.message });
            }
            const ordemServicoId = this.lastID;

            // Inserir os itens da Ordem de Serviço
            const insertItemQuery = `INSERT INTO troca_peca (ordem_servico_id, nome_peca, marca_peca, quantidade, preco_unitario) VALUES (?, ?, ?, ?, ?)`;

            itens.forEach(item => {
                db.run(insertItemQuery, [ordemServicoId, item.nome, item.marca, item.quantidade, item.preco], err => {
                    if (err) {
                        console.error('Erro ao inserir item na OS:', err.message);
                    }
                });
            });

            res.send({ message: 'Ordem de Serviço salva com sucesso!', ordemServicoId });
        });
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

	const mainWindow = new BrowserWindow({
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
			label: 'Make App 💻',
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
	db.all('SELECT * FROM Artist', (err, rows) => {
		if (err) {
			console.error(err.message);
			event.reply('fetch-data-error', err.message);
		} else {
			event.reply('fetch-data-success', rows);
		}
		db.close();
	});
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
