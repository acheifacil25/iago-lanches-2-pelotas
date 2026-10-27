"""Caso de Uso: Ingestão de Pedidos via Cardápio Digital / Facity (Webhook & Sync)."""

import hashlib
import hmac
from datetime import datetime
from src.application.interfaces import OrderRepositoryInterface
from src.domain.entities import Pedido, Cliente, ItemPedido, Coordenadas, StatusPedido
from src.domain.exceptions import AssinaturaInvalidaException
from src.core.config import settings
from src.infrastructure.facity_client import facity_service


class IngestCardapioOrderUseCase:
    def __init__(self, order_repo: OrderRepositoryInterface):
        self.order_repo = order_repo

    def _validar_assinatura(self, payload_bytes: bytes, signature_header: str) -> bool:
        if not signature_header:
            return False
        expected_sig = hmac.new(
            settings.CARDAPIO_WEBHOOK_SECRET.encode(),
            payload_bytes,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_sig, signature_header)

    def execute(self, payload: dict, signature: str = None, raw_body: bytes = None) -> Pedido:
        # 1. Validação de segurança (Gui / DevSecOps)
        if signature and raw_body:
            if not self._validar_assinatura(raw_body, signature):
                raise AssinaturaInvalidaException("Assinatura HMAC-SHA256 do webhook inválida.")

        # 2. Mapeamento de endereço e cliente em Pelotas
        cliente_data = payload.get("cliente", {})
        coords_data = cliente_data.get("coordenadas", {})
        lat = float(coords_data.get("lat", -31.725149))
        lng = float(coords_data.get("lng", -52.346509))
        bairro = cliente_data.get("bairro", "Três Vendas")

        cliente = Cliente(
            nome=cliente_data.get("nome", "Cliente Balcão"),
            telefone=cliente_data.get("telefone", ""),
            logradouro=cliente_data.get("logradouro", "Rua"),
            numero=str(cliente_data.get("numero", "S/N")),
            bairro=bairro,
            cidade=cliente_data.get("cidade", "Pelotas"),
            uf="RS",
            coordenadas=Coordenadas(latitude=lat, longitude=lng),
            complemento=cliente_data.get("complemento")
        )

        # 3. Mapeamento de itens
        itens = [
            ItemPedido(
                nome=i.get("nome"),
                quantidade=int(i.get("quantidade", 1)),
                preco_unitario=float(i.get("preco_unitario", 0.0))
            )
            for i in payload.get("itens", [])
        ]

        # 4. Cálculo automático de Taxa por KM do Facity se não informada explicitamente
        if "taxa_entrega" in payload and payload["taxa_entrega"] is not None:
            taxa_entrega = float(payload["taxa_entrega"])
        else:
            fee_info = facity_service.calculate_fee_by_km(lat, lng, bairro)
            taxa_entrega = fee_info["taxa_entrega"]

        # 5. Geração do ID do Pedido e Código de Barras (CODE-128)
        pedido_id = payload.get("id") or f"FAC-{int(datetime.now().timestamp()) % 10000:04d}"
        codigo_barras = f"CODE128-{pedido_id}"

        novo_pedido = Pedido(
            id=pedido_id,
            codigo_barras=codigo_barras,
            cliente=cliente,
            itens=itens,
            valor_total=float(payload.get("valor_total", 0.0)),
            taxa_entrega=taxa_entrega,
            forma_pagamento=payload.get("forma_pagamento", "DINHEIRO"),
            troco_para=float(payload.get("troco_para")) if payload.get("troco_para") else None,
            status=StatusPedido.AGUARDANDO_DESPACHO,
            criado_em=datetime.now()
        )

        return self.order_repo.save(novo_pedido)
