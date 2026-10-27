"""Interfaces (Portas) da camada de Aplicação."""

from abc import ABC, abstractmethod
from typing import Optional
from src.domain.entities import Pedido, Motoboy, Coordenadas


class OrderRepositoryInterface(ABC):
    @abstractmethod
    def save(self, pedido: Pedido) -> Pedido:
        pass

    @abstractmethod
    def find_by_id(self, pedido_id: str) -> Optional[Pedido]:
        pass

    @abstractmethod
    def find_by_codigo_barras(self, codigo_barras: str) -> Optional[Pedido]:
        pass

    @abstractmethod
    def list_all(self) -> list[Pedido]:
        pass

    @abstractmethod
    def lock_and_dispatch(self, codigo_barras: str, motoboy: Motoboy) -> Pedido:
        """Executa lock atômico evitando bip duplo simultâneo."""
        pass


class MotoboyRepositoryInterface(ABC):
    @abstractmethod
    def save(self, motoboy: Motoboy) -> Motoboy:
        pass

    @abstractmethod
    def find_by_id(self, motoboy_id: str) -> Optional[Motoboy]:
        pass

    @abstractmethod
    def list_active(self) -> list[Motoboy]:
        pass

    @abstractmethod
    def update_location(self, motoboy_id: str, coords: Coordenadas, bateria: int) -> Motoboy:
        pass


class TelemetryBroadcasterInterface(ABC):
    @abstractmethod
    async def broadcast_order_dispatched(self, pedido: Pedido) -> None:
        pass

    @abstractmethod
    async def broadcast_gps_update(self, motoboy: Motoboy) -> None:
        pass
