import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

export const RUN_LOCATION_TASK = 'primal-champion-active-run-location';
const SESSION_KEY = '@primal/run-session-v1';
const MAX_ACCURACY_METERS = 40;
const MIN_POINT_INTERVAL_MS = 2500;
const MIN_MOVEMENT_METERS = 2;
const MAX_REASONABLE_SPEED_MPS = 8.5;

export type RunPoint = {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  timestamp: number;
};

export type RunSession = {
  status: 'running' | 'paused';
  startedAt: number;
  elapsedBeforePauseMs: number;
  pausedAt: number | null;
  distanceMeters: number;
  points: RunPoint[];
  lastAcceptedTimestamp: number | null;
  lastAcceptedPoint: RunPoint | null;
};

function emptySession(): RunSession {
  return {
    status: 'running',
    startedAt: Date.now(),
    elapsedBeforePauseMs: 0,
    pausedAt: null,
    distanceMeters: 0,
    points: [],
    lastAcceptedTimestamp: null,
    lastAcceptedPoint: null,
  };
}

async function readSession(): Promise<RunSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as RunSession) : null;
}

async function writeSession(session: RunSession) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}

function toPoint(location: Location.LocationObject): RunPoint {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    altitude: location.coords.altitude ?? null,
    accuracy: location.coords.accuracy ?? null,
    speed: location.coords.speed ?? null,
    timestamp: location.timestamp,
  };
}

function haversineMeters(a: RunPoint, b: RunPoint) {
  const earthRadius = 6371000;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

function shouldAccept(previous: RunPoint | null, next: RunPoint) {
  if (next.accuracy != null && next.accuracy > MAX_ACCURACY_METERS) return false;
  if (!previous) return true;

  const dt = next.timestamp - previous.timestamp;
  if (dt < MIN_POINT_INTERVAL_MS) return false;

  const distance = haversineMeters(previous, next);
  const gpsSpeed = next.speed != null && next.speed >= 0 ? next.speed : distance / (dt / 1000);
  if (gpsSpeed > MAX_REASONABLE_SPEED_MPS && distance > 30) return false;
  if (distance < MIN_MOVEMENT_METERS) return false;
  return true;
}

export async function appendLocation(location: Location.LocationObject) {
  const session = await readSession();
  if (!session || session.status !== 'running') return;

  const point = toPoint(location);
  if (!shouldAccept(session.lastAcceptedPoint, point)) return;

  if (session.lastAcceptedPoint) {
    session.distanceMeters += haversineMeters(session.lastAcceptedPoint, point);
  }

  session.points.push(point);
  session.lastAcceptedPoint = point;
  session.lastAcceptedTimestamp = point.timestamp;
  await writeSession(session);
}

if (!TaskManager.isTaskDefined(RUN_LOCATION_TASK)) {
  TaskManager.defineTask(RUN_LOCATION_TASK, async ({ data, error }) => {
    if (error) return;
    const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations ?? [];
    for (const location of locations) {
      await appendLocation(location);
    }
  });
}

export async function requestRunPermissions() {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== Location.PermissionStatus.GRANTED) {
    return { granted: false, reason: 'foreground-denied' as const };
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== Location.PermissionStatus.GRANTED) {
    return { granted: false, reason: 'background-denied' as const };
  }

  return { granted: true, reason: null };
}

export async function startRunTracking() {
  const existing = await readSession();
  if (existing) throw new Error('A run is already active on this device.');

  const session = emptySession();
  await writeSession(session);

  await Location.startLocationUpdatesAsync(RUN_LOCATION_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 3000,
    distanceInterval: 3,
    deferredUpdatesInterval: 3000,
    deferredUpdatesDistance: 3,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Primal Champion run active',
      notificationBody: 'GPS tracking is active while your run is in progress.',
      notificationColor: '#ffffff',
    },
  });
}

export async function pauseRunTracking() {
  const session = await readSession();
  if (!session || session.status !== 'running') return;

  const now = Date.now();
  session.elapsedBeforePauseMs += now - session.startedAt;
  session.startedAt = now;
  session.status = 'paused';
  session.pausedAt = now;
  await writeSession(session);
  await Location.stopLocationUpdatesAsync(RUN_LOCATION_TASK).catch(() => undefined);
}

export async function resumeRunTracking() {
  const session = await readSession();
  if (!session || session.status !== 'paused') return;

  session.status = 'running';
  session.startedAt = Date.now();
  session.pausedAt = null;
  await writeSession(session);

  await Location.startLocationUpdatesAsync(RUN_LOCATION_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 3000,
    distanceInterval: 3,
    deferredUpdatesInterval: 3000,
    deferredUpdatesDistance: 3,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Primal Champion run active',
      notificationBody: 'GPS tracking is active while your run is in progress.',
      notificationColor: '#ffffff',
    },
  });
}

export async function getRunSession() {
  return readSession();
}

export function getElapsedMs(session: RunSession, now = Date.now()) {
  if (session.status === 'paused') return session.elapsedBeforePauseMs;
  return session.elapsedBeforePauseMs + (now - session.startedAt);
}

export async function finishRunTracking() {
  const session = await readSession();
  if (!session) throw new Error('No active run found.');

  if (session.status === 'running') {
    session.elapsedBeforePauseMs += Date.now() - session.startedAt;
  }

  await Location.stopLocationUpdatesAsync(RUN_LOCATION_TASK).catch(() => undefined);
  await writeSession(session);
  return session;
}

export async function clearFinishedRun() {
  await clearSession();
}

export async function cancelRunTracking() {
  await Location.stopLocationUpdatesAsync(RUN_LOCATION_TASK).catch(() => undefined);
  await clearSession();
}

export { haversineMeters };
