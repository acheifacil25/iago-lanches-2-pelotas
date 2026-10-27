"""Caso de Uso: Atualização de Telemetria GPS do Motoboy em Pelotas."""

import math
from src.application.interfaces import MotoboyRepositoryInterface, TelemetryBroadcasterInterface
from src.domain.entities import Coordenadas, Motoboy
from src.core.config import settings


class UpdateTelemetryUseCase:
    def __init__(self, motoboy_repo: MotoboyRepositoryInterface, broadcaster: TelemetryBroadcasterInterface):
        self.motoboy_repo = motoboy_repo
        self.broadcaster = broadcaster

    @staticmethod
    def calcular_distancia_km(c1: Coordenadas, c2: Coordenadas) -> float:
        """Cálculo Haversine de distância geodésica em Pelotas."""
        R = 6371.0  # Raio da Terra em km
        dlat = math.radians(c2.latitude - c1.latitude)
        dlon = math.radians(c2.longitude - c1.longitude)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(c1.latitude))
            * math.cos(math.radians(c2.latitude))
            * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    async def execute(self, motoboy_id: str, coords: Coordenadas, bateria: int) -> Motoboy:
        motoboy = self.motoboy_repo.update_location(motoboy_id, coords, bateria)
        if motoboy:
            await self.broadcaster.broadcast_gps_update(motoboy)
        return motoboy
