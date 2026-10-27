"""Ponto de Entrada Principal da API FastAPI (Iago Lanches 2 - Pelotas RS)."""

import json
import ssl
import urllib.parse
import urllib.request
from pathlib import Path
from pydantic import BaseModel
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from src.core.config import settings
from src.infrastructure.api.routes_orders import router as orders_router
from src.infrastructure.api.routes_webhook import router as webhook_router
from src.infrastructure.api.routes_telemetry import router as telemetry_router
from src.infrastructure.facity_client import facity_service

BASE_DIR = Path(__file__).resolve().parent.parent


class FeeCalculationRequest(BaseModel):
    lat: float
    lng: float
    bairro: str = ""


class ScannerWhatsAppDispatchRequest(BaseModel):
    comanda: str
    motoboy_id: str
    motoboy_nome: str
    motoboy_whatsapp: str
    cliente_nome: str
    endereco: str
    bairro: str
    itens: list[str]
    total_cobrar: float
    taxa_km: float = 0.0
    distancia_km: float = 0.0
    forma_pagamento: str = "Facity"


app = FastAPI(
    title="Iago Lanches 2 - Sistema Integrado Facity, Google Maps & Maquininha Leitora (Pelotas - RS)",
    description="Backend oficial integrado ao Facity (apiv2.facity.com.br) na Av. Fernando Osório, 2870 com Google Maps Real, cobrança por KM, semáforo de espera (15m/30m/45m) e despacho via maquininha leitora direto para o WhatsApp do motoboy.",
    version="4.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orders_router)
app.include_router(webhook_router)
app.include_router(telemetry_router)


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
def serve_dashboard():
    """Serve o Painel Visual & Central da Maquininha Leitora na raiz http://localhost:8000/"""
    html_file = BASE_DIR / "src" / "static" / "index.html"
    if html_file.exists():
        return HTMLResponse(content=html_file.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Iago Lanches 2 API Online</h1>")


@app.get("/api/v1/map/google-tile/{lyrs}/{z}/{x}/{y}", tags=["Google Maps Cartography"])
def proxy_google_maps_tile(lyrs: str, z: int, x: int, y: int):
    """Proxy de alta velocidade para tiles oficiais do Google Maps (m=Ruas, y=Satélite Híbrido, p=Terreno)."""
    allowed_lyrs = {"m", "y", "s", "p", "h"}
    layer = lyrs if lyrs in allowed_lyrs else "m"
    sub = (x + y) % 4
    url = f"https://mt{sub}.google.com/vt/lyrs={layer}&x={x}&y={y}&z={z}&hl=pt-BR&gl=br&apistyle=s.t%3A2%7Cp.v%3Aoff%2Cs.t%3A4%7Cp.v%3Aoff"
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, context=ctx, timeout=6) as resp:
            content = resp.read()
            return Response(content=content, media_type="image/png", headers={"Cache-Control": "public, max-age=86400"})
    except Exception:
        return Response(status_code=404)


@app.get("/api/v1/map/real-routes", tags=["Google Maps Cartography"])
def get_real_pelotas_routes():
    """Retorna as geometrias reais rua-a-rua (OSRM/Google Maps) das entregas em Pelotas."""
    routes_file = BASE_DIR / "database" / "real_routes_pelotas.json"
    if routes_file.exists():
        return json.loads(routes_file.read_text(encoding="utf-8"))
    return {}


@app.post("/api/v1/facity/scanner-dispatch", tags=["Maquininha Leitora & WhatsApp"])
def scanner_whatsapp_dispatch(req: ScannerWhatsAppDispatchRequest):
    """
    Recebe o bip da maquininha leitora (ou número da comanda), vincula o pedido ao motoboy no sistema/Facity
    e gera o disparo instantâneo para o WhatsApp do entregador com o link direto do Google Maps.
    """
    clean_phone = "".join(ch for ch in req.motoboy_whatsapp if ch.isdigit())
    if not clean_phone.startswith("55"):
        clean_phone = f"55{clean_phone}"

    origin_q = urllib.parse.quote("Avenida Fernando Osorio, 2870, Pelotas - RS")
    dest_q = urllib.parse.quote(f"{req.endereco}, {req.bairro}, Pelotas - RS")
    gmaps_link = f"https://www.google.com/maps/dir/?api=1&origin={origin_q}&destination={dest_q}&travelmode=driving"

    msg_lines = [
        f"🍔 *IAGO LANCHES 2 — ENTREGA DESPACHADA*",
        f"📋 *Comanda:* #{req.comanda}",
        f"🏍️ *Motoboy:* {req.motoboy_nome}",
        f"👤 *Cliente:* {req.cliente_nome}",
        f"📍 *Endereço:* {req.endereco} ({req.bairro})",
        f"🍟 *Itens:* {', '.join(req.itens)}",
        f"💳 *Pagamento:* {req.forma_pagamento}",
        f"💰 *TOTAL FACITY:* R$ {req.total_cobrar:.2f}",
        f"",
        f"🗺️ *ABRIR ROTA NO GOOGLE MAPS:*",
        gmaps_link
    ]
    full_text = "\n".join(msg_lines)
    wa_url = f"https://wa.me/{clean_phone}?text={urllib.parse.quote(full_text)}"

    return {
        "status": "DISPATCHED_TO_FACITY_AND_WHATSAPP",
        "comanda": req.comanda,
        "motoboy_id": req.motoboy_id,
        "motoboy_nome": req.motoboy_nome,
        "whatsapp_destino": clean_phone,
        "google_maps_url": gmaps_link,
        "whatsapp_url": wa_url,
        "mensagem_formatada": full_text,
    }


@app.get("/api/v1/catalog/facity", tags=["Integração Facity"])
def get_facity_catalog():
    """Retorna produtos, categorias, motoboys reais, tabela de KM e últimos pedidos do Facity."""
    facity_file = BASE_DIR / "database" / "facity_data.json"
    if facity_file.exists():
        data = json.loads(facity_file.read_text(encoding="utf-8"))
        return {
            "loja": settings.STORE_NAME,
            "base": settings.STORE_ADDRESS,
            "modo_taxa_entrega": "kilometer",
            "motoboys_reais": facity_service.get_real_motoboys(),
            "tabela_km_facity": facity_service.get_distances_table(),
            "total_produtos": len(data.get("/products", [])),
            "total_bairros": len(data.get("/neighborhoods", [])),
            "secoes": data.get("/sections", []),
            "produtos": data.get("/products", []),
            "bairros_taxas": data.get("/neighborhoods", []),
            "pedidos_recentes_facity": data.get("/outwards/detailed", []),
        }
    return {"erro": "Arquivo facity_data.json não encontrado."}


@app.get("/api/v1/facity/live-orders", tags=["Integração Facity"])
def get_facity_live_orders(live: bool = False):
    """Retorna todos os pedidos do Facity (incluindo pedidos do iFood que caem no Facity) com o valor total fiel ao Facity."""
    orders = facity_service.get_live_orders(fetch_remote=live)
    return {
        "status": "OK",
        "fidelidade_total_facity": True,
        "inclui_ifood": True,
        "total_orders": len(orders),
        "orders": orders,
    }


@app.post("/api/v1/facity/sync", tags=["Integração Facity"])
def sync_facity_live():
    """Sincroniza em tempo real com https://apiv2.facity.com.br usando as credenciais do Iago Lanches 2."""
    try:
        result = facity_service.sync_live_from_facity()
        return {"status": "SYNC_OK", **result}
    except Exception as exc:
        return {"status": "CACHE_LOCAL", "detalhe": str(exc), "motoboys": facity_service.get_real_motoboys()}


@app.post("/api/v1/facity/calculate-fee", tags=["Integração Facity"])
def calculate_facity_fee(req: FeeCalculationRequest):
    """Calcula a taxa de entrega por KM exata da tabela /distances do Facity a partir da Av. Fernando Osório, 2870."""
    return facity_service.calculate_fee_by_km(req.lat, req.lng, req.bairro)


@app.get("/api/v1/map/streets", tags=["Google Maps Cartography"])
def get_pelotas_streets():
    """Retorna as 682+ vias geocodificadas de Pelotas - RS extraídas do Facity e OSM."""
    streets_file = BASE_DIR / "database" / "pelotas_streets.json"
    if streets_file.exists():
        return json.loads(streets_file.read_text(encoding="utf-8"))
    return []


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ONLINE",
        "loja": settings.STORE_NAME,
        "facity_integrado": True,
        "google_maps_fiel": True,
        "maquininha_leitora_hid": True,
        "whatsapp_auto_dispatch": True,
        "modo_cobranca_entrega": "kilometer",
        "motoboys_empresa": [m["nome"] for m in facity_service.get_real_motoboys()],
        "cidade": "Pelotas - RS",
        "base_lancheria": settings.STORE_ADDRESS,
        "coordenadas_base": {
            "lat": settings.STORE_LATITUDE,
            "lng": settings.STORE_LONGITUDE
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
