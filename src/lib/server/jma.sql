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

CREATE INDEX IF NOT EXISTS idx_cliente_nome ON cliente (nome);
CREATE INDEX IF NOT EXISTS idx_cliente_cpf ON cliente (cpf);

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

CREATE INDEX IF NOT EXISTS idx_carro_cliente_id ON carro (cliente_id);
CREATE INDEX IF NOT EXISTS idx_carro_placa ON carro (placa);

CREATE TABLE IF NOT EXISTS peca (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    marca TEXT
);

CREATE INDEX IF NOT EXISTS idx_peca_nome ON peca (nome);
CREATE INDEX IF NOT EXISTS idx_peca_marca ON peca (marca);

CREATE TABLE IF NOT EXISTS ordem_servico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carro_id INTEGER REFERENCES carro(id) ON DELETE CASCADE,
    observacao TEXT,
    data DATE NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ordem_servico_carro_id ON ordem_servico (carro_id);
CREATE INDEX IF NOT EXISTS idx_ordem_servico_data ON ordem_servico (data);

DROP TABLE IF EXISTS troca_peca;

CREATE TABLE IF NOT EXISTS troca_peca (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ordem_servico_id INTEGER REFERENCES ordem_servico(id) ON DELETE CASCADE,
    nome_peca TEXT NOT NULL,
    marca_peca TEXT NOT NULL,
    observacao TEXT,
    quantidade INTEGER NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_troca_peca_ordem_servico_id ON troca_peca (ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_troca_peca_peca_id ON troca_peca (peca_id);


-- Buscar cliente por nome
SELECT * FROM cliente WHERE nome LIKE '%Kevin%';

-- Buscar cliente por CPF
SELECT * FROM cliente WHERE cpf = '123.456.789-00';

-- Buscar carro por placa
SELECT * FROM carro WHERE placa = 'ABC123';

-- Buscar trocas de peças por carro
SELECT troca_peca.*, peca.nome AS nome_peca
FROM troca_peca
JOIN peca ON troca_peca.peca_id = peca.id
JOIN ordem_servico ON troca_peca.ordem_servico_id = ordem_servico.id
WHERE ordem_servico.carro_id = <id_do_carro_desejado>;

-- Relatório diário para um cliente específico
SELECT cliente.nome AS nome_cliente, SUM(troca_peca.preco_unitario * troca_peca.quantidade) AS total_gasto
FROM troca_peca
JOIN ordem_servico ON troca_peca.ordem_servico_id = ordem_servico.id
JOIN carro ON ordem_servico.carro_id = carro.id
JOIN cliente ON carro.cliente_id = cliente.id
WHERE cliente.id = <id_do_cliente>
  AND ordem_servico.data = '2024-01-30' -- Substitua com a data desejada
GROUP BY cliente.id;

-- Relatório mensal para todos os clientes
SELECT cliente.nome AS nome_cliente, strftime('%m', ordem_servico.data) AS mes,
       SUM(troca_peca.preco_unitario * troca_peca.quantidade) AS total_gasto
FROM troca_peca
JOIN ordem_servico ON troca_peca.ordem_servico_id = ordem_servico.id
JOIN carro ON ordem_servico.carro_id = carro.id
JOIN cliente ON carro.cliente_id = cliente.id
WHERE strftime('%Y', ordem_servico.data) = '2024' -- Substitua com o ano desejado
GROUP BY cliente.id, mes;


