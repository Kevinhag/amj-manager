const windowStateManager = require('electron-window-state');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const contextMenu = require('electron-context-menu');
const serve = require('electron-serve');
const path = require('path');

let server;
const express = require('express');
const sqlite3 = require('sqlite3');
const cors = require('cors');

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

	/* 	expressApp.listen(expressPort, () => {
		console.log(`Express server is running at http://localhost:${expressPort}`);
	}); */

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
	// mainWindow.webContents.send('update_available');
	dialog.showMessageBox({
		message: 'A new update is available. Do you want to download it now?',
		buttons: ['Update', 'Cancel'],
		defaultId: 0,
	}, (buttonIndex) => {
		if (buttonIndex === 0) {
			autoUpdater.downloadUpdate();
		}
	});
})

autoUpdater.on('update-downloaded', () => {
	// mainWindow.webContents.send('update_downloaded');
	dialog.showMessageBox({
		message: 'Update downloaded. It will be installed on restart. Restart now?',
		buttons: ['Yes', 'No'],
		defaultId: 0,
	}, (buttonIndex) => {
		if (buttonIndex === 0) {
			autoUpdater.quitAndInstall();
		}
	});
});

autoUpdater.on('update-not-available', () => {
	// mainWindow.webContents.send('update_not_available');
	dialog.showMessageBox({
		message: 'No updates available.',
		buttons: ['OK'],
		defaultId: 0,
	});
});


app.on('will-quit', () => {
	// Close express server
	if (server) {
        server.close();
        console.log('Express server is closed');
    }
});
