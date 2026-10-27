/**
 * Store global com Zustand.
 * Gerencia autenticação, status do motoboy e entregas ativas.
 */
import { create } from 'zustand';
import type { ActiveDelivery, MotoboyStatus, AuthResponse } from './api';

/** Auth Store */

interface AuthState {
  token: string | null;
  motoboyId: string | null;
  motoboyName: string | null;
  isAuthenticated: boolean;
  setAuth: (auth: AuthResponse) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  motoboyId: null,
  motoboyName: null,
  isAuthenticated: false,
  setAuth: (auth) =>
    set({
      token: auth.access_token,
      motoboyId: auth.motoboy_id,
      motoboyName: auth.name,
      isAuthenticated: true,
    }),
  clearAuth: () =>
    set({
      token: null,
      motoboyId: null,
      motoboyName: null,
      isAuthenticated: false,
    }),
}));

/** Delivery Store */

interface DeliveryState {
  status: MotoboyStatus;
  activeDeliveries: ActiveDelivery[];
  setStatus: (status: MotoboyStatus) => void;
  setActiveDeliveries: (deliveries: ActiveDelivery[]) => void;
  removeDelivery: (id: string) => void;
  addDelivery: (delivery: ActiveDelivery) => void;
}

export const useDeliveryStore = create<DeliveryState>((set) => ({
  status: 'available',
  activeDeliveries: [],
  setStatus: (status) => set({ status }),
  setActiveDeliveries: (deliveries) => set({ activeDeliveries: deliveries }),
  removeDelivery: (id) =>
    set((state) => ({
      activeDeliveries: state.activeDeliveries.filter((d) => d.id !== id),
    })),
  addDelivery: (delivery) =>
    set((state) => ({
      activeDeliveries: [delivery, ...state.activeDeliveries],
    })),
}));
