"""Suite de Testes Automatizados (TDD) - Validações do Ícaro (QA) para Iago Lanches 2 + Facity."""

import asyncio
import sys
from pathlib import Path
import pytest

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from src.infrastructure.repositories.memory_repository import InMemoryOrderRepository, InMemoryMotoboyRepository
from src.infrastructure.websockets.broadcaster import WebSocketTelemetryBroadcaster
from src.infrastructure.facity_client import facity_service, classify_wait_time
from src.application.use_cases.dispatch_order import DispatchOrderByBarcodeUseCase
from src.application.use_cases.ingest_cardapio_order import IngestCardapioOrderUseCase
from src.domain.entities import StatusPedido, StatusMotoboy
from src.domain.exceptions import BipDuplicadoException, PedidoNaoEncontradoException


@pytest.fixture
def repos():
    order_repo = InMemoryOrderRepository()
    motoboy_repo = InMemoryMotoboyRepository()
    broadcaster = WebSocketTelemetryBroadcaster()
    return order_repo, motoboy_repo, broadcaster


def test_real_facity_motoboys_loaded(repos):
    """Garante que os 7 motoboys reais cadastrados no Facity da empresa estão ativos."""
    _, motoboy_repo, _ = repos
    ativos = [m.nome for m in motoboy_repo.list_active()]
    assert ativos == ["Junior", "Adrian", "Naldo", "David", "Alvaro", "Diego", "Christofer"]


def test_facity_km_delivery_fee_table():
    """Valida a cobrança por KM idêntica à tabela /distances do Facity (Iago Lanches 2)."""
    # 1. Próximo à loja na Av. Fernando Osório (< 3 km) -> Taxa R$ 0.00
    res_close = facity_service.calculate_fee_by_km(-31.725149, -52.346509, "Três Vendas")
    assert res_close["distancia_km"] <= 3.0
    assert res_close["taxa_entrega"] == 0.0

    # 2. Entre 3 e 4 km -> Taxa R$ 3.00
    res_4km = facity_service.calculate_fee_by_km(-31.701297, -52.322211, "Areal")
    assert 3.0 < res_4km["distancia_km"] <= 5.0
    assert res_4km["taxa_entrega"] in (3.0, 6.0)

    # 3. Bairro Germani (~6 km) -> Taxa R$ 8.00
    res_6km = facity_service.calculate_fee_by_km(-31.683099, -52.337178, "Germani")
    assert 5.0 < res_6km["distancia_km"] <= 7.0
    assert res_6km["taxa_entrega"] in (8.0, 10.0)


def test_wait_time_traffic_light_colors():
    """Valida o semáforo de tempo de espera: <15m Verde, >15m Laranja, >30m Laranja Forte, >45m Vermelho."""
    assert classify_wait_time(5)["nivel"] == "VERDE"
    assert classify_wait_time(5)["cor_hex"] == "#10b981"

    assert classify_wait_time(18)["nivel"] == "LARANJA_15"
    assert classify_wait_time(18)["cor_hex"] == "#f59e0b"

    assert classify_wait_time(35)["nivel"] == "LARANJA_30"
    assert classify_wait_time(35)["cor_hex"] == "#f97316"

    assert classify_wait_time(48)["nivel"] == "VERMELHO_45"
    assert classify_wait_time(48)["cor_hex"] == "#ef4444"


def test_ingest_order_from_cardapio_and_dispatch_with_beep(repos):
    """Testa o ciclo completo: Facity envia pedido -> calcula KM -> gera código de barras -> Adrian bipa -> vai para EM_ROTA."""
    order_repo, motoboy_repo, broadcaster = repos
    ingest_use_case = IngestCardapioOrderUseCase(order_repo)
    dispatch_use_case = DispatchOrderByBarcodeUseCase(order_repo, motoboy_repo, broadcaster)

    payload_cardapio = {
        "id": "FAC-0048",
        "cliente": {
            "nome": "Wendel",
            "telefone": "(53) 98111-2233",
            "logradouro": "Rua São Miguel",
            "numero": "120",
            "bairro": "Três Vendas",
            "coordenadas": {"lat": -31.723736, "lng": -52.348246}
        },
        "itens": [
            {"nome": "Bauru Completo com Bacon", "quantidade": 1, "preco_unitario": 34.00}
        ],
        "valor_total": 34.00,
        "forma_pagamento": "PIX"
    }

    pedido = ingest_use_case.execute(payload_cardapio)
    assert pedido.id == "FAC-0048"
    assert pedido.status == StatusPedido.AGUARDANDO_DESPACHO
    assert pedido.codigo_barras == "CODE128-FAC-0048"
    assert pedido.taxa_entrega == 0.0  # < 3km da Av. Fernando Osório 2870

    # Motoboy MOTO-02 (Adrian) bipa a comanda no balcão da Fernando Osório, 2870
    pedido_despachado = asyncio.run(dispatch_use_case.execute(
        codigo_barras="CODE128-FAC-0048",
        motoboy_id="MOTO-02"
    ))

    assert pedido_despachado.status == StatusPedido.EM_ROTA
    assert pedido_despachado.motoboy_id == "MOTO-02"
    assert pedido_despachado.motoboy_nome == "Adrian"

    motoboy = motoboy_repo.find_by_id("MOTO-02")
    assert motoboy.status == StatusMotoboy.EM_ROTA


def test_rejeita_bip_duplicado_concorrencia(repos):
    """Testa a trava de concorrência: se outro motoboy tentar bipar a mesma comanda, deve rejeitar."""
    order_repo, motoboy_repo, broadcaster = repos
    ingest_use_case = IngestCardapioOrderUseCase(order_repo)
    dispatch_use_case = DispatchOrderByBarcodeUseCase(order_repo, motoboy_repo, broadcaster)

    payload = {
        "id": "FAC-0046",
        "cliente": {
            "nome": "Tainá",
            "logradouro": "Rua Jardim de Allah",
            "numero": "411",
            "bairro": "Germani",
            "coordenadas": {"lat": -31.683099, "lng": -52.337178}
        },
        "itens": [],
        "valor_total": 94.00
    }
    pedido = ingest_use_case.execute(payload)

    # Primeiro motoboy (Junior - MOTO-01) bipa com sucesso
    asyncio.run(dispatch_use_case.execute(pedido.codigo_barras, "MOTO-01"))

    # Segundo motoboy (Naldo - MOTO-03) tenta bipar a mesma comanda
    with pytest.raises(BipDuplicadoException):
        asyncio.run(dispatch_use_case.execute(pedido.codigo_barras, "MOTO-03"))


def test_bip_codigo_barras_inexistente(repos):
    """Testa erro amigável ao bipar um código que não existe no sistema."""
    order_repo, motoboy_repo, broadcaster = repos
    dispatch_use_case = DispatchOrderByBarcodeUseCase(order_repo, motoboy_repo, broadcaster)

    with pytest.raises(PedidoNaoEncontradoException):
        asyncio.run(dispatch_use_case.execute("CODE-INVALIDO-9999", "MOTO-01"))


def test_facity_live_orders_includes_ifood_and_exact_total():
    """Garante que os pedidos vindos do Facity (incluindo origin='ifood') mantêm o valor total exato do Facity sem soma paralela."""
    orders = facity_service.get_live_orders(fetch_remote=False)
    assert len(orders) >= 5
    origins = {o["origin"] for o in orders}
    assert "ifood" in origins

    # Verifica que o pedido #47 (Vitor Munhóz - iFood no Facity) preserva o total exato 25.89 do Facity sem somar taxa por fora
    order_47 = next((o for o in orders if o["ticket"] == 47), None)
    assert order_47 is not None
    assert order_47["origin"] == "ifood"
    assert order_47["total"] == 25.89

