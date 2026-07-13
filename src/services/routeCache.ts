import { LRUCache } from 'lru-cache';
import { prisma } from '../config';
import { config } from '../config';

export interface RouteInfo {
  distanceKm: number;
  etaMinutes: number;
  polyline: string;
  fromCache: boolean;
  cachedAt?: Date;
}

const memoryCache = new LRUCache<string, RouteInfo>({
  max: 500,
  ttl: config.routeCacheTtlSeconds * 1000,
});

export function makeRouteKey(pickup: string, destination: string): string {
  return `${pickup}||${destination}`;
}

/**
 * Mock geocoding / routing provider.
 * In production this would call a third-party maps API (Google Maps, Mapbox, etc.).
 * Here we deterministically derive distance + ETA from the address strings so
 * repeated calls with the same input return the same values.
 */
export function mockRouteLookup(pickup: string, destination: string): RouteInfo {
  const pickupHash = hashString(pickup);
  const destHash = hashString(destination);
  const combined = (pickupHash + destHash) % 10000;
  const distanceKm = Math.round(((combined % 200) / 10 + 0.5) * 10) / 10;
  const etaMinutes = Math.max(1, Math.round(distanceKm * 3 + (combined % 10)));
  const polyline = `mock_polyline_${pickupHash}_${destHash}`;
  return { distanceKm, etaMinutes, polyline, fromCache: false };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Get route info. First checks the in-memory LRU cache, then the persistent
 * RouteCache table (if not expired), then calls the (mock) geocoding provider
 * and stores the result in both cache layers.
 */
export async function getRoute(pickup: string, destination: string): Promise<RouteInfo> {
  const key = makeRouteKey(pickup, destination);

  // 1. Hot path: in-memory LRU
  const memHit = memoryCache.get(key);
  if (memHit) {
    return { ...memHit, fromCache: true, cachedAt: undefined };
  }

  // 2. Warm path: persistent RouteCache table (if still fresh)
  const now = new Date();
  const dbHit = await prisma.routeCache.findUnique({ where: { key } });
  if (dbHit && dbHit.expiresAt > now) {
    const info: RouteInfo = {
      distanceKm: dbHit.distanceKm,
      etaMinutes: dbHit.etaMinutes,
      polyline: dbHit.polyline,
      fromCache: true,
      cachedAt: dbHit.cachedAt,
    };
    memoryCache.set(key, info);
    return info;
  }

  // 3. Cold path: call the provider
  const fresh = mockRouteLookup(pickup, destination);
  const expiresAt = new Date(now.getTime() + config.routeCacheTtlSeconds * 1000);

  await prisma.routeCache.upsert({
    where: { key },
    create: {
      key,
      distanceKm: fresh.distanceKm,
      etaMinutes: fresh.etaMinutes,
      polyline: fresh.polyline,
      cachedAt: now,
      expiresAt,
    },
    update: {
      distanceKm: fresh.distanceKm,
      etaMinutes: fresh.etaMinutes,
      polyline: fresh.polyline,
      cachedAt: now,
      expiresAt,
    },
  });

  memoryCache.set(key, fresh);
  return fresh;
}

export function clearRouteCache(): void {
  memoryCache.clear();
}

export function getCacheStats() {
  return {
    size: memoryCache.size,
    ttlMs: config.routeCacheTtlSeconds * 1000,
  };
}
