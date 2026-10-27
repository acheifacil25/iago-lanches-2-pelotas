"""Rota de Integração Webhook com o Cardápio Digital."""

from fastapi import APIRouter, Request, Header, HTTPException, status
from src.infrastructure.api.dependencies import ingest_cardapio_use_case
from src.domain.exceptions import AssinaturaInvalidaException

router = APIRouter(prefix="/api/v1/integrations/cardapio", tags=["Integração Cardápio Digital"])


@router.post("/orders", status_code=status.HTTP_201_CREATED)
async def receive_cardapio_order(
    request: Request,
    x_signature: str = Header(None, alias="X-Signature")
):
    """Recebe o pedido enviado pelo Cardápio Digital, valida e gera o código de barras para a comanda."""
    raw_body = await request.body()
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Corpo JSON inválido.")

    try:
        pedido = ingest_cardapio_use_case.execute(
            payload=payload,
            signature=x_signature,
            raw_body=raw_body
        )
        return {
            "status": "CRIADO",
            "pedido_id": pedido.id,
            "codigo_barras": pedido.codigo_barras,
            "status_entrega": pedido.status.value,
            "mensagem": "Comanda pronta para impressão e bip na lancheria."
        }
    except AssinaturaInvalidaException as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
