"""Configurações Centrais do Sistema de Entregas - Pelotas RS."""

from pydantic import BaseModel


class AppSettings(BaseModel):
    # Endereço Oficial da Base da Lancheria (Três Vendas, Pelotas - RS)
    STORE_NAME: str = "Iago Lanches 2"
    STORE_ADDRESS: str = "Avenida Fernando Osório, 2870 - Três Vendas, Pelotas - RS"
    STORE_LATITUDE: float = -31.73142
    STORE_LONGITUDE: float = -52.34821

    # Chave Secreta para assinatura HMAC do Webhook do Cardápio Digital
    CARDAPIO_WEBHOOK_SECRET: str = "secret-cardapio-pelotas-2026"

    # Raio de entrega máximo atendido (km)
    MAX_DELIVERY_RADIUS_KM: float = 12.0


settings = AppSettings()
