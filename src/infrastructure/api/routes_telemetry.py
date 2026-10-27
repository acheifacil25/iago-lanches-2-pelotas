"""Rotas de Telemetria GPS e WebSockets em Pelotas."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel
from src.infrastructure.api.dependencies import motoboy_repo, broadcaster, telemetry_use_case
from src.domain.entities import Coordenadas

router = APIRouter(tags=["Telemetria & WebSockets"])


class LocationPingRequest(BaseModel):
    motoboy_id: str
    latitude: float
    longitude: float
    bateria: int = 100


@router.post("/api/v1/telemetry/location", status_code=status.HTTP_200_OK)
async def update_motoboy_location(req: LocationPingRequest):
    """Recebe o ping de GPS enviado em segundo plano pelo app do motoboy."""
    coords = Coordenadas(latitude=req.latitude, longitude=req.longitude)
    motoboy = await telemetry_use_case.execute(req.motoboy_id, coords, req.bateria)
    return {"status": "OK", "motoboy": motoboy}


@router.get("/api/v1/motoboys", status_code=status.HTTP_200_OK)
def list_motoboys():
    """Retorna lista de todos os motoboys cadastrados e suas posições."""
    return motoboy_repo.list_active()


@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """Conexão WebSocket contínua para o Painel da Lancheria e App do Motoboy."""
    await broadcaster.connect(websocket)
    try:
        while True:
            # Mantém conexão viva aguardando pings do cliente
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        broadcaster.disconnect(websocket)
