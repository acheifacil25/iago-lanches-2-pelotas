"""Injeção de Dependências da API."""

from src.infrastructure.repositories.memory_repository import InMemoryOrderRepository, InMemoryMotoboyRepository
from src.infrastructure.websockets.broadcaster import WebSocketTelemetryBroadcaster
from src.application.use_cases.dispatch_order import DispatchOrderByBarcodeUseCase
from src.application.use_cases.ingest_cardapio_order import IngestCardapioOrderUseCase
from src.application.use_cases.update_telemetry import UpdateTelemetryUseCase

# Singletons em tempo de execução
order_repo = InMemoryOrderRepository()
motoboy_repo = InMemoryMotoboyRepository()
broadcaster = WebSocketTelemetryBroadcaster()

dispatch_use_case = DispatchOrderByBarcodeUseCase(order_repo, motoboy_repo, broadcaster)
ingest_cardapio_use_case = IngestCardapioOrderUseCase(order_repo)
telemetry_use_case = UpdateTelemetryUseCase(motoboy_repo, broadcaster)
