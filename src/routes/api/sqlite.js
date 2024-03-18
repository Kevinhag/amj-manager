import sqlite3 from 'sqlite3';

const dbPath = './data.db';
const db = new sqlite3.Database(dbPath);

export const createClientsTable = () => {
    return new Promise((resolve, reject) => {
       db.run('CREATE TABLE IF NOT EXISTS clientes (id INT, nome TEXT)', (err) => {
          if (err) {
             reject(err);
          } else {
             resolve();
          }
       });
    });
 };
 
 export const getClients = () => {
    return new Promise((resolve, reject) => {
       db.all('SELECT * FROM clientes', (err, rows) => {
          if (err) {
             reject(err);
          } else {
             resolve(rows);
          }
       });
    });
 };