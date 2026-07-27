/**
 * ipGeo.ts — Server-side IP geolocation utility
 * Uses ip-api.com (free tier: 45 req/min, no API key needed).
 * Returns city, region, country, zip, ISP, coordinates, and a formatted full address.
 * Returns null for private/loopback addresses or on lookup failure.
 */

export interface GeoInfo {
  city: string;
  region: string;
  country: string;
  zip: string;
  isp: string;
  lat: number;
  lon: number;
  /** Formatted full address e.g. "Mumbai, Maharashtra, 400001, India" */
  fullAddress: string;
}

/** Private/loopback IP ranges that should not be looked up */
const PRIVATE_IP_REGEX =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|localhost)/i;

/**
 * Extract the real client IP from Next.js request headers.
 * Handles proxies / load balancers via x-forwarded-for.
 */
export function extractIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; first entry is the client IP
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? null;
}

/**
 * Look up approximate geo-location for a given IP address.
 * Returns null if the IP is private, empty, or the lookup fails.
 */
export async function lookupIpGeo(ip: string | null | undefined): Promise<GeoInfo | null> {
  let lookupIp = ip;
  let isSimulated = false;

  if (!ip || PRIVATE_IP_REGEX.test(ip)) {
    // Fallback to a custom public IP from .env or Google DNS for local testing
    lookupIp = process.env.MOCK_GEO_IP || '8.8.8.8';
    isSimulated = true;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4 s timeout

    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(lookupIp as string)}?fields=status,message,country,regionName,city,zip,isp,lat,lon`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();

    if (data.status !== 'success') {
      console.warn(`[ipGeo] Lookup failed for ${lookupIp}: ${data.message}`);
      return null;
    }

    const city: string    = data.city ?? '';
    const region: string  = data.regionName ?? '';
    const country: string = data.country ?? '';
    const zip: string     = data.zip ?? '';

    // Build a readable full address, skipping empty parts
    const parts = [city, region, zip, country].filter(Boolean);
    const fullAddress = parts.join(', ');

    return {
      city,
      region,
      country,
      zip,
      isp: isSimulated ? `${data.isp ?? ''} (Simulated)` : (data.isp ?? ''),
      lat: data.lat ?? 0,
      lon: data.lon ?? 0,
      fullAddress: isSimulated ? `${fullAddress} (Simulated)` : fullAddress,
    };
  } catch (err: any) {
    console.warn(`[ipGeo] Could not fetch geo for ${lookupIp}:`, err?.message ?? err);
    return null;
  }
}
