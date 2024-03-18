CREATE DATABASE IF NOT EXISTS jma;
ATTACH DATABASE 'data.db' AS jma;

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
    cliente_id INTEGER REFERENCES cliente(id),
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
    -- preco DECIMAL(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS troca_peca (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carro_id INTEGER REFERENCES carro(id),
    peca_id INTEGER REFERENCES peca(id),
    data_troca DATE NOT NULL,
    quantidade INTEGER NOT NULL
);

-- Buscar cliente por nome
SELECT * FROM cliente WHERE nome LIKE 'Kevin';

-- Buscar cliente por CPF
SELECT * FROM cliente WHERE cpf = '123.456.789-00';

-- Buscar carro por placa
SELECT * FROM carro WHERE placa = 'ABC123';

-- Buscar trocas de peças por carro
SELECT troca_peca.*, peca.nome AS nome_peca
FROM troca_peca
JOIN peca ON troca_peca.peca_id = peca.id
WHERE troca_peca.carro_id = <id_do_carro_desejado>;

-- Relatório diário para um cliente específico
SELECT cliente.nome AS nome_cliente, SUM(peca.preco * troca_peca.quantidade) AS total_gasto
FROM troca_peca
JOIN carro ON troca_peca.carro_id = carro.id
JOIN cliente ON carro.cliente_id = cliente.id
JOIN peca ON troca_peca.peca_id = peca.id
WHERE cliente.id = <id_do_cliente>
  AND troca_peca.data_troca = '2024-01-30' -- Substitua com a data desejada
GROUP BY cliente.id;

-- Relatório mensal para todos os clientes
SELECT cliente.nome AS nome_cliente, strftime('%m', troca_peca.data_troca) AS mes,
       SUM(peca.preco * troca_peca.quantidade) AS total_gasto
FROM troca_peca
JOIN carro ON troca_peca.carro_id = carro.id
JOIN cliente ON carro.cliente_id = cliente.id
JOIN peca ON troca_peca.peca_id = peca.id
WHERE strftime('%Y', troca_peca.data_troca) = '2024' -- Substitua com o ano desejado
GROUP BY cliente.id, mes;