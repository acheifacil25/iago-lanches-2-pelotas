-- ====================================================================
-- SCHEMA DE BANCO DE DADOS: IAGO LANCHES 2 (PELOTAS - RS)
-- Arquitetura: Anderson (Arquiteto de Software)
-- SGBD: PostgreSQL 15+ com Extensão PostGIS
-- ====================================================================

-- 1. Habilitação de extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Tipos Enumerados (ENUMs)
DO $$ BEGIN
    CREATE TYPE status_pedido_enum AS ENUM (
        'AGUARDANDO_DESPACHO',
        'EM_ROTA',
        'ENTREGUE',
        'CANCELADO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_motoboy_enum AS ENUM (
        'DISPONIVEL_BALCAO',
        'EM_ROTA',
        'EM_PAUSA',
        'OFFLINE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE forma_pagamento_enum AS ENUM (
        'DINHEIRO',
        'PIX',
        'CARTAO_CREDITO',
        'CARTAO_DEBITO',
        'VALE_REFEICAO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ====================================================================
-- TABELA: MOTOBOYS
-- ====================================================================
CREATE TABLE IF NOT EXISTS motoboys (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    veiculo VARCHAR(50) NOT NULL, -- Ex: Honda CG 160 Fan
    placa VARCHAR(10) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    status status_motoboy_enum NOT NULL DEFAULT 'DISPONIVEL_BALCAO',
    posicao_atual GEOGRAPHY(POINT, 4326) NOT NULL,
    bateria_porcentagem INT NOT NULL DEFAULT 100 CHECK (bateria_porcentagem BETWEEN 0 AND 100),
    ultimo_ping_gps TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice espacial para queries de proximidade dos motoboys em Pelotas
CREATE INDEX IF NOT EXISTS idx_motoboys_posicao_gist ON motoboys USING GIST (posicao_atual);
CREATE INDEX IF NOT EXISTS idx_motoboys_status ON motoboys(status);

-- ====================================================================
-- TABELA: PEDIDOS
-- ====================================================================
CREATE TABLE IF NOT EXISTS pedidos (
    id VARCHAR(50) PRIMARY KEY, -- Ex: PEL-0042
    codigo_barras VARCHAR(100) UNIQUE NOT NULL, -- CODE128 gerado para o Bip
    origem_integracao VARCHAR(50) DEFAULT 'FACITY', -- Facity, iFood, Manual
    id_externo VARCHAR(100),
    
    -- Dados do Cliente em Pelotas
    cliente_nome VARCHAR(100) NOT NULL,
    cliente_telefone VARCHAR(20) NOT NULL,
    cliente_logradouro VARCHAR(150) NOT NULL,
    cliente_numero VARCHAR(20) NOT NULL,
    cliente_bairro VARCHAR(80) NOT NULL, -- Fragata, Centro, Três Vendas, Areal, Laranjal
    cliente_cidade VARCHAR(50) DEFAULT 'Pelotas',
    cliente_uf VARCHAR(2) DEFAULT 'RS',
    cliente_complemento VARCHAR(100),
    destino_geografia GEOGRAPHY(POINT, 4326) NOT NULL, -- Posição no mapa de Pelotas
    
    -- Valores Financeiros
    valor_produtos NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    taxa_entrega NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    valor_total NUMERIC(10, 2) NOT NULL,
    forma_pagamento forma_pagamento_enum NOT NULL,
    troco_para NUMERIC(10, 2),
    
    -- Estado e Despacho
    status status_pedido_enum NOT NULL DEFAULT 'AGUARDANDO_DESPACHO',
    motoboy_id VARCHAR(50) REFERENCES motoboys(id) ON DELETE SET NULL,
    motoboy_nome VARCHAR(100),
    
    -- Trava de Concorrência Otimista (Anti-Bip Duplo)
    versao_lock INT NOT NULL DEFAULT 0,
    
    -- Timestamps de Auditoria
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    despachado_em TIMESTAMP WITH TIME ZONE,
    entregue_em TIMESTAMP WITH TIME ZONE
);

-- Índices essenciais para performance e integridade
CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_codigo_barras ON pedidos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_motoboy_id ON pedidos(motoboy_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_destino_gist ON pedidos USING GIST (destino_geografia);

-- ====================================================================
-- TABELA: ITENS_PEDIDO
-- ====================================================================
CREATE TABLE IF NOT EXISTS itens_pedido (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id VARCHAR(50) NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    nome_produto VARCHAR(120) NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    preco_unitario NUMERIC(10, 2) NOT NULL,
    observacoes TEXT
);

CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido_id ON itens_pedido(pedido_id);

-- ====================================================================
-- TABELA: TELEMETRIA_HISTORICO (REPLAY DE ROTAS DO MOTOBOY)
-- ====================================================================
CREATE TABLE IF NOT EXISTS telemetria_historico (
    id BIGSERIAL PRIMARY KEY,
    motoboy_id VARCHAR(50) NOT NULL REFERENCES motoboys(id) ON DELETE CASCADE,
    pedido_id VARCHAR(50) REFERENCES pedidos(id) ON DELETE SET NULL,
    posicao GEOGRAPHY(POINT, 4326) NOT NULL,
    velocidade_kmh NUMERIC(5, 2),
    bateria_porcentagem INT,
    registrado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telemetria_motoboy_tempo ON telemetria_historico(motoboy_id, registrado_em DESC);
CREATE INDEX IF NOT EXISTS idx_telemetria_posicao_gist ON telemetria_historico USING GIST (posicao);

-- ====================================================================
-- TABELA: FECHAMENTO_CAIXA (ACERTO NOTURNO)
-- ====================================================================
CREATE TABLE IF NOT EXISTS fechamento_caixa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    motoboy_id VARCHAR(50) NOT NULL REFERENCES motoboys(id),
    data_operacao DATE NOT NULL DEFAULT CURRENT_DATE,
    total_entregas INT NOT NULL DEFAULT 0,
    total_taxas_motoboy NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_dinheiro_retido NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    saldo_acerto NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- (total_dinheiro_retido - total_taxas_motoboy)
    fechado_por VARCHAR(100),
    fechado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_motoboy_data UNIQUE (motoboy_id, data_operacao)
);

-- ====================================================================
-- SEED INICIAL: BASE OFICIAL EM PELOTAS & MOTOBOYS
-- ====================================================================
-- Base Oficial: Av. Fernando Osório, 2870 - Três Vendas, Pelotas - RS (-31.73142, -52.34821)
INSERT INTO motoboys (id, nome, cpf, veiculo, placa, telefone, status, posicao_atual, bateria_porcentagem)
VALUES
    ('MOTO-01', 'Marcos Costa', '111.222.333-44', 'CG 160 Fan', 'IXO-4421', '(53) 99123-4567', 'DISPONIVEL_BALCAO', ST_SetSRID(ST_MakePoint(-52.34821, -31.73142), 4326), 92),
    ('MOTO-02', 'Lucas Silveira', '222.333.444-55', 'Titan 160', 'IWP-8890', '(53) 99876-5432', 'DISPONIVEL_BALCAO', ST_SetSRID(ST_MakePoint(-52.34821, -31.73142), 4326), 98),
    ('MOTO-03', 'Rafael Lima', '333.444.555-66', 'Fazer 250', 'JAQ-1200', '(53) 98455-1122', 'DISPONIVEL_BALCAO', ST_SetSRID(ST_MakePoint(-52.34821, -31.73142), 4326), 84)
ON CONFLICT (id) DO NOTHING;
