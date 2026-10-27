/**
 * Serviço de rastreamento GPS em background.
 * Usa expo-location + expo-task-manager para enviar coordenadas
 * a cada ~10 segundos enquanto o motoboy estiver ativo.
 */
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { sendLocation } from './api';
import { useAuthStore } from './store';

const LOCATION_TASK_NAME = 'IAGO_MOTOBOY_BG_LOCATION';

/** Tipo do evento de background do expo-location */
interface LocationTaskData {
  locations: Location.LocationObject[];
}

/**
 * Define a task de background que será executada pelo OS.
 * DEVE ser chamada no escopo global (fora de componentes).
 */
TaskManager.defineTask<LocationTaskData>(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[LocationTask] Erro:', error.message);
    return;
  }

  if (!data?.locations?.length) return;

  const motoboyId = useAuthStore.getState().motoboyId;
  if (!motoboyId) return;

  const location = data.locations[0];
  if (!location) return;

  try {
    await sendLocation({
      motoboy_id: motoboyId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
    });
  } catch (err) {
    console.warn('[LocationTask] Falha ao enviar localização:', err);
  }
});

/**
 * Solicita permissões de localização (foreground + background).
 * Retorna true se todas as permissões foram concedidas.
 */
export async function requestLocationPermissions(): Promise<boolean> {
  const { status: foreground } = await Location.requestForegroundPermissionsAsync();
  if (foreground !== 'granted') return false;

  const { status: background } = await Location.requestBackgroundPermissionsAsync();
  return background === 'granted';
}

/**
 * Inicia o rastreamento em background.
 * O GPS é enviado a cada ~10 segundos com precisão balanceada.
 */
export async function startTracking(): Promise<void> {
  const isTracking = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  if (isTracking) return; // Já está rodando

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 10_000,         // 10 segundos
    distanceInterval: 15,         // ou 15 metros
    deferredUpdatesInterval: 10_000,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Iago Lanches 2',
      notificationBody: 'Rastreamento de entrega ativo',
      notificationColor: '#d4af37',
    },
  });

  console.log('[Location] Rastreamento em background iniciado.');
}

/**
 * Para o rastreamento em background.
 */
export async function stopTracking(): Promise<void> {
  const isTracking = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  if (!isTracking) return;

  await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  console.log('[Location] Rastreamento em background parado.');
}

/**
 * Obtém a localização atual uma única vez (foreground).
 */
export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
  } catch {
    console.warn('[Location] Não foi possível obter localização atual.');
    return null;
  }
}
