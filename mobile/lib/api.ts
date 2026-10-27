/**
 * Cliente HTTP para o backend FastAPI (porta 8000).
 * Todas as chamadas passam por este módulo para manter um único ponto de configuração.
 */
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

/** Tipos de domínio */

export interface LoginPayload {
  cpf: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  motoboy_id: string;
  name: string;
}

export type MotoboyStatus = 'available' | 'en_route' | 'paused';

export interface MotoboyProfile {
  id: string;
  name: string;
  cpf: string;
  status: MotoboyStatus;
}

export interface OrderAddress {
  street: string;
  number: string;
  neighborhood: string;
  complement?: string;
  city: string;
  lat: number;
  lng: number;
}

export interface PaymentInfo {
  method: 'cash' | 'credit' | 'debit' | 'pix';
  change_for?: number;
  total: number;
}

export interface ActiveDelivery {
  id: string;
  order_number: string;
  customer_name: string;
  address: OrderAddress;
  payment: PaymentInfo;
  status: 'pending' | 'dispatched' | 'en_route' | 'delivered';
  created_at: string;
  delivery_fee: number;
}

export interface BeepDispatchResponse {
  delivery: ActiveDelivery;
  message: string;
}

export interface DeliveryHistoryItem {
  id: string;
  order_number: string;
  customer_name: string;
  address: OrderAddress;
  delivered_at: string;
  delivery_fee: number;
}

export interface DailySummary {
  total_deliveries: number;
  total_earnings: number;
  deliveries: DeliveryHistoryItem[];
}

export interface LocationPayload {
  motoboy_id: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

/** Instância do Axios */

const BASE_URL = __DEV__
  ? 'http://10.0.2.2:8000/api/v1'   // Android Emulator → host
  : 'https://api.iagolanches2.com.br/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: injeta token em todas as requests autenticadas
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Funções de autenticação */

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  await SecureStore.setItemAsync(TOKEN_KEY, data.access_token);
  return data;
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

/** Perfil e status */

export async function getProfile(): Promise<MotoboyProfile> {
  const { data } = await api.get<MotoboyProfile>('/motoboys/me');
  return data;
}

export async function updateStatus(status: MotoboyStatus): Promise<void> {
  await api.patch('/motoboys/me/status', { status });
}

/** Entregas */

export async function getActiveDeliveries(): Promise<ActiveDelivery[]> {
  const { data } = await api.get<ActiveDelivery[]>('/orders/active');
  return data;
}

export async function beepDispatch(barcode: string): Promise<BeepDispatchResponse> {
  const { data } = await api.post<BeepDispatchResponse>('/orders/beep-dispatch', { barcode });
  return data;
}

export async function finalizeDelivery(deliveryId: string): Promise<void> {
  await api.post(`/orders/${deliveryId}/finalize`);
}

export async function getDeliveryById(deliveryId: string): Promise<ActiveDelivery> {
  const { data } = await api.get<ActiveDelivery>(`/orders/${deliveryId}`);
  return data;
}

/** Histórico */

export async function getDailySummary(): Promise<DailySummary> {
  const { data } = await api.get<DailySummary>('/orders/daily-summary');
  return data;
}

/** Localização */

export async function sendLocation(payload: LocationPayload): Promise<void> {
  await api.post('/tracking/location', payload);
}

export default api;
