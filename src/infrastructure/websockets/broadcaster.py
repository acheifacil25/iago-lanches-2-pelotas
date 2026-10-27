"""Broadcaster de Eventos em Tempo Real via WebSockets."""

import json
from typing import Set
from fastapi import WebSocket
from src.application.interfaces import TelemetryBroadcasterInterface
from src.domain.entities import Pedido, Motoboy


class WebSocketTelemetryBroadcaster(TelemetryBroadcasterInterface):
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast_order_dispatched(self, pedido: Pedido) -> None:
        payload = {
            "event": "ORDER_DISPATCHED",
            "pedido_id": pedido.id,
            "status": pedido.status.value,
            "motoboy_id": pedido.motoboy_id,
            "motoboy_nome": pedido.motoboy_nome,
            "cliente_bairro": pedido.cliente.bairro,
            "cliente_coordenadas": pedido.cliente.coordenadas.model_dump()
        }
        await self._broadcast_json(payload)

    async def broadcast_gps_update(self, motoboy: Motoboy) -> None:
        payload = {
            "event": "GPS_TELEMETRY_UPDATE",
            "motoboy_id": motoboy.id,
            "motoboy_nome": motoboy.nome,
            "coordenadas": motoboy.coordenadas_atuais.model_dump(),
            "bateria": motoboy.bateria_porcentagem,
            "status": motoboy.status.value
        }
        await self._broadcast_json(payload)

    async def _broadcast_json(self, data: dict):
        dead_connections = set()
        for conn in self.active_connections:
            try:
                await conn.send_json(data)
            except Exception:
                dead_connections.add(conn)
        for dead in dead_connections:
            self.disconnect(dead)
