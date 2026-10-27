/**
 * Cliente HTTP da API de Despacho e Telemetria - Iago Lanches 2
 */

// Emulador Android usa 10.0.2.2; em dispositivo físico na mesma rede Wi-Fi, substitua pelo IP da máquina
export const API_BASE_URL = 'http://10.0.2.2:8000';

export interface BeepDispatchResponse {
  status: string;
  mensagem: string;
  pedido: {
    id: string;
    codigo_barras: string;
    status: string;
    cliente: {
      nome: string;
      telefone: string;
      logradouro: string;
      numero: string;
      bairro: string;
      cidade: string;
      complemento?: string;
      coordenadas: {
        latitude: number;
        longitude: number;
      };
    };
    valor_total: number;
    taxa_entrega: number;
    forma_pagamento: string;
    troco_para?: number;
    motoboy_nome?: string;
  };
}

export async function beepDispatch(codigoBarras: string, motoboyId: string): Promise<BeepDispatchResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/orders/beep-dispatch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      codigo_barras: codigoBarras,
      motoboy_id: motoboyId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Erro ${response.status} ao despachar comanda.`);
  }

  return response.json();
}

export async function sendTelemetryPing(
  motoboyId: string,
  latitude: number,
  longitude: number,
  bateria: number = 100
) {
  try {
    await fetch(`${API_BASE_URL}/api/v1/telemetry/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        motoboy_id: motoboyId,
        latitude,
        longitude,
        bateria,
      }),
    });
  } catch (error) {
    console.warn('[Telemetry] Falha ao enviar ping GPS:', error);
  }
}

export async function fetchActiveOrders() {
  const res = await fetch(`${API_BASE_URL}/api/v1/orders`);
  if (!res.ok) return [];
  return res.json();
}
