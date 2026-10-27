"""Rotas REST de Pedidos e Despacho via Bip."""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from src.infrastructure.api.dependencies import dispatch_use_case, order_repo
from src.domain.exceptions import BipDuplicadoException, PedidoNaoEncontradoException, MotoboyIndisponivelException

router = APIRouter(prefix="/api/v1/orders", tags=["Pedidos & Despacho"])


class BeepDispatchRequest(BaseModel):
    codigo_barras: str
    motoboy_id: str


@router.post("/beep-dispatch", status_code=status.HTTP_200_OK)
async def beep_dispatch_order(request: BeepDispatchRequest):
    """Endpoint chamado pelo App do Motoboy ao apontar a câmera e bipar a comanda impressa."""
    try:
        pedido = await dispatch_use_case.execute(
            codigo_barras=request.codigo_barras,
            motoboy_id=request.motoboy_id
        )
        return {
            "status": "SUCESSO",
            "mensagem": f"Pedido #{pedido.id} despachado com sucesso!",
            "pedido": pedido.model_dump()
        }
    except BipDuplicadoException as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except PedidoNaoEncontradoException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except MotoboyIndisponivelException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", status_code=status.HTTP_200_OK)
def list_orders():
    """Retorna todos os pedidos para o painel da lancheria."""
    return order_repo.list_all()
