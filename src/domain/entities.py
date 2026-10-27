"""Entidades de Domínio puras (Clean Architecture)."""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class StatusPedido(str, Enum):
    AGUARDANDO_DESPACHO = "AGUARDANDO_DESPACHO"
    EM_ROTA = "EM_ROTA"
    ENTREGUE = "ENTREGUE"
    CANCELADO = "CANCELADO"


class StatusMotoboy(str, Enum):
    DISPONIVEL_BALCAO = "DISPONIVEL_BALCAO"
    EM_ROTA = "EM_ROTA"
    EM_PAUSA = "EM_PAUSA"
    OFFLINE = "OFFLINE"


class Coordenadas(BaseModel):
    latitude: float
    longitude: float


class Cliente(BaseModel):
    nome: str
    telefone: str
    logradouro: str
    numero: str
    bairro: str  # Fragata, Centro, Areal, Três Vendas, Laranjal
    cidade: str = "Pelotas"
    uf: str = "RS"
    coordenadas: Coordenadas
    complemento: Optional[str] = None


class ItemPedido(BaseModel):
    nome: str
    quantidade: int
    preco_unitario: float


class Pedido(BaseModel):
    id: str = Field(description="Identificador único (ex: PEL-0042)")
    codigo_barras: str = Field(description="Código gerado para leitura do bip (CODE-128 / QR)")
    cliente: Cliente
    itens: list[ItemPedido]
    valor_total: float
    taxa_entrega: float
    forma_pagamento: str  # DINHEIRO, PIX, CARTAO_CREDITO
    troco_para: Optional[float] = None
    status: StatusPedido = StatusPedido.AGUARDANDO_DESPACHO
    motoboy_id: Optional[str] = None
    motoboy_nome: Optional[str] = None
    criado_em: datetime = Field(default_factory=datetime.now)
    despachado_em: Optional[datetime] = None
    entregue_em: Optional[datetime] = None
    versao_lock: int = 0  # Lock otimista para concorrência no bip


class Motoboy(BaseModel):
    id: str
    nome: str
    veiculo: str  # ex: CG 160 Fan
    placa: str
    telefone: str
    status: StatusMotoboy = StatusMotoboy.DISPONIVEL_BALCAO
    coordenadas_atuais: Coordenadas
    bateria_porcentagem: int = 100
    ultimo_ping_gps: datetime = Field(default_factory=datetime.now)
