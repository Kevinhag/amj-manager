import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors'; // Import cors module

const app = express();
app.use(cors());

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

app.get('/api/clients', async (req, res) => {
	try {
		const clients = await getAllClients();
		res.json(clients);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

app.get('/api/cars', async (req, res) => {
	try {
		const cars = await getAllCars();
		res.json(cars);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

app.get('/api/parts', async (req, res) => {
	try {
		const parts = await getAllParts('marca');
		res.json(parts);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

app.post('/api/parts', (req, res) => {
	const { nome, marca } = req.body;
	db.run(
		`INSERT INTO peca (nome, marca) VALUES (?, ?)`,
		[nome, marca],
		function (err) {
			if (err) {
				return res.status(500).json({ error: err.message });
			}
			return res.json({ id: this.lastID });
		},
	);
});

app.post('/api/data', (req, res) => {
	const { name, age, address } = req.body;
	db.run(
		`INSERT INTO cliente (name, age, address) VALUES (?, ?, ?)`,
		[name, age, address],
		function (err) {
			if (err) {
				return res.status(500).json({ error: err.message });
			}
			return res.json({ id: this.lastID });
		},
	);
});

app.listen(3000, () => {
	console.log('Server is running on port 3000');
});