"""Implementação de Repositório em Memória Thread-Safe com Concorrência Otimista e Motoboys Reais do Facity."""

import threading
from datetime import datetime
from typing import Optional
from src.application.interfaces import OrderRepositoryInterface, MotoboyRepositoryInterface
from src.domain.entities import Pedido, Motoboy, Coordenadas, StatusPedido, StatusMotoboy
from src.domain.exceptions import BipDuplicadoException, PedidoNaoEncontradoException


class InMemoryOrderRepository(OrderRepositoryInterface):
    def __init__(self):
        self._orders: dict[str, Pedido] = {}
        self._barcode_index: dict[str, str] = {}
        self._lock = threading.Lock()

    def save(self, pedido: Pedido) -> Pedido:
        with self._lock:
            self._orders[pedido.id] = pedido
            self._barcode_index[pedido.codigo_barras] = pedido.id
            return pedido

    def find_by_id(self, pedido_id: str) -> Optional[Pedido]:
        with self._lock:
            return self._orders.get(pedido_id)

    def find_by_codigo_barras(self, codigo_barras: str) -> Optional[Pedido]:
        with self._lock:
            pedido_id = self._barcode_index.get(codigo_barras)
            if pedido_id:
                return self._orders.get(pedido_id)
            return None

    def list_all(self) -> list[Pedido]:
        with self._lock:
            return list(self._orders.values())

    def lock_and_dispatch(self, codigo_barras: str, motoboy: Motoboy) -> Pedido:
        with self._lock:
            pedido_id = self._barcode_index.get(codigo_barras)
            if not pedido_id or pedido_id not in self._orders:
                raise PedidoNaoEncontradoException(f"Pedido com código '{codigo_barras}' inexistente.")

            pedido = self._orders[pedido_id]
            if pedido.status != StatusPedido.AGUARDANDO_DESPACHO:
                raise BipDuplicadoException(
                    f"Concorrência: Pedido #{pedido.id} já foi vinculado a {pedido.motoboy_nome}."
                )

            # Efetua o despacho atômico
            pedido.status = StatusPedido.EM_ROTA
            pedido.motoboy_id = motoboy.id
            pedido.motoboy_nome = motoboy.nome
            pedido.despachado_em = datetime.now()
            pedido.versao_lock += 1

            self._orders[pedido_id] = pedido
            return pedido


class InMemoryMotoboyRepository(MotoboyRepositoryInterface):
    def __init__(self):
        self._motoboys: dict[str, Motoboy] = {}
        self._lock = threading.Lock()
        self._bootstrap_facity_motoboys()

    def _bootstrap_facity_motoboys(self):
        """Carrega os 7 motoboys reais cadastrados na empresa Iago Lanches 2 no Facity."""
        # Base oficial Iago Lanches 2: Av. Fernando Osório, 2870 (-31.726488, -52.342791)
        base = Coordenadas(latitude=-31.726488, longitude=-52.342791)

        facity_motoboys = [
            ("MOTO-01", "Junior", "Honda CG 160 Start", "IXO-1010", "(53) 98101-7420", StatusMotoboy.DISPONIVEL_BALCAO, base, 98),
            ("MOTO-02", "Adrian", "Honda CG 160 Fan", "IWP-2020", "(53) 98112-3344", StatusMotoboy.EM_ROTA, Coordenadas(latitude=-31.725149, longitude=-52.346509), 91),
            ("MOTO-03", "Naldo", "Yamaha Factor 150", "JAQ-3030", "(53) 98422-5566", StatusMotoboy.EM_ROTA, Coordenadas(latitude=-31.697667, longitude=-52.349291), 86),
            ("MOTO-04", "David", "Honda Titan 160", "IVR-4040", "(53) 99133-7788", StatusMotoboy.DISPONIVEL_BALCAO, base, 95),
            ("MOTO-05", "Alvaro", "Honda Bros 160", "IYT-5050", "(53) 99944-8899", StatusMotoboy.DISPONIVEL_BALCAO, base, 89),
            ("MOTO-06", "Diego", "Yamaha Fazer 150", "IZM-6060", "(53) 98155-9900", StatusMotoboy.EM_ROTA, Coordenadas(latitude=-31.715509, longitude=-52.356667), 82),
            ("MOTO-07", "Christofer", "Honda CG 160 Titan", "JBC-7070", "(53) 98466-1122", StatusMotoboy.EM_ROTA, Coordenadas(latitude=-31.717985, longitude=-52.335904), 94),
        ]

        for mid, nome, veiculo, placa, fone, status, coords, bat in facity_motoboys:
            self._motoboys[mid] = Motoboy(
                id=mid,
                nome=nome,
                veiculo=veiculo,
                placa=placa,
                telefone=fone,
                status=status,
                coordenadas_atuais=coords,
                bateria_porcentagem=bat,
            )

    def save(self, motoboy: Motoboy) -> Motoboy:
        with self._lock:
            self._motoboys[motoboy.id] = motoboy
            return motoboy

    def find_by_id(self, motoboy_id: str) -> Optional[Motoboy]:
        with self._lock:
            return self._motoboys.get(motoboy_id)

    def list_active(self) -> list[Motoboy]:
        with self._lock:
            return list(self._motoboys.values())

    def update_location(self, motoboy_id: str, coords: Coordenadas, bateria: int) -> Motoboy:
        with self._lock:
            motoboy = self._motoboys.get(motoboy_id)
            if motoboy:
                motoboy.coordenadas_atuais = coords
                motoboy.bateria_porcentagem = bateria
                motoboy.ultimo_ping_gps = datetime.now()
                self._motoboys[motoboy_id] = motoboy
            return motoboy
