/**
 * Serviço de Rastreamento de GPS do Motoboy - Pelotas RS
 * Utiliza expo-location para monitoramento e envio periódico de telemetria.
 */

import * as Location from 'expo-location';
import { sendTelemetryPing } from './api';

let locationSubscription: Location.LocationSubscription | null = null;

export async function requestLocationPermissions(): Promise<boolean> {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') {
    return false;
  }
  return true;
}

export async function startTelemetryTracking(motoboyId: string) {
  const hasPermission = await requestLocationPermissions();
  if (!hasPermission) {
    console.warn('Permissão de GPS negada.');
    return;
  }

  if (locationSubscription) {
    locationSubscription.remove();
  }

  // Monitora localização com precisão alta durante rota em Pelotas
  locationSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 8000, // 8 segundos
      distanceInterval: 10, // 10 metros
    },
    (location) => {
      const { latitude, longitude } = location.coords;
      sendTelemetryPing(motoboyId, latitude, longitude, 90);
    }
  );
}

export function stopTelemetryTracking() {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
}
