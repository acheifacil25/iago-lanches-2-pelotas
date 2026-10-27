"""Caso de Uso: Despacho de Pedido via Bip de Código de Barras."""

from datetime import datetime
from src.application.interfaces import OrderRepositoryInterface, MotoboyRepositoryInterface, TelemetryBroadcasterInterface
from src.domain.entities import Pedido, StatusPedido, StatusMotoboy
from src.domain.exceptions import BipDuplicadoException, PedidoNaoEncontradoException, MotoboyIndisponivelException


class DispatchOrderByBarcodeUseCase:
    def __init__(
        self,
        order_repo: OrderRepositoryInterface,
        motoboy_repo: MotoboyRepositoryInterface,
        broadcaster: TelemetryBroadcasterInterface,
    ):
        self.order_repo = order_repo
        self.motoboy_repo = motoboy_repo
        self.broadcaster = broadcaster

    async def execute(self, codigo_barras: str, motoboy_id: str) -> Pedido:
        # 1. Validação do Motoboy
        motoboy = self.motoboy_repo.find_by_id(motoboy_id)
        if not motoboy:
            raise MotoboyIndisponivelException(f"Motoboy com ID '{motoboy_id}' não está cadastrado ou ativo.")

        # 2. Busca do Pedido pelo Código de Barras bipado
        pedido = self.order_repo.find_by_codigo_barras(codigo_barras)
        if not pedido:
            raise PedidoNaoEncontradoException(f"Nenhum pedido encontrado para o código de barras '{codigo_barras}'.")

        # 3. Proteção contra Bip Duplicado (Locking)
        if pedido.status != StatusPedido.AGUARDANDO_DESPACHO:
            raise BipDuplicadoException(
                f"Pedido '{pedido.id}' já foi despachado anteriormente por '{pedido.motoboy_nome}'!"
            )

        # 4. Vinculação atômica
        pedido_atualizado = self.order_repo.lock_and_dispatch(codigo_barras, motoboy)

        # 5. Atualização de status do Motoboy para EM_ROTA
        motoboy.status = StatusMotoboy.EM_ROTA
        self.motoboy_repo.save(motoboy)

        # 6. Notificação via WebSockets (Telemetria em tempo real)
        await self.broadcaster.broadcast_order_dispatched(pedido_atualizado)

        return pedido_atualizado
