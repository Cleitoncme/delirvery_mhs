import { ApiError } from "@/lib/api";

export type Coordinates = { latitude: number; longitude: number };

/** Geocoding is intentionally server-only. Configure a provider in production. */
export async function geocodeAddress(address: { zipCode: string }): Promise<Coordinates> {
  const url = process.env.GEOCODING_API_URL;
  const key = process.env.GEOCODING_API_KEY;
  if (url && key) {
    const response = await fetch(`${url}?postalCode=${encodeURIComponent(address.zipCode)}`, {
      headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(4000), cache: "no-store",
    });
    if (response.ok) {
      const value = (await response.json()) as { latitude?: number; longitude?: number };
      if (Number.isFinite(value.latitude) && Number.isFinite(value.longitude)) return { latitude: value.latitude!, longitude: value.longitude! };
    }
  }
  if (process.env.NODE_ENV !== "production" && address.zipCode === "89801000") return { latitude: -27.1007, longitude: -52.6152 };
  throw new ApiError(503, "Não foi possível localizar o endereço para calcular a entrega.");
}

export function distanceMeters(a: Coordinates, b: Coordinates) {
  const rad = (v: number) => (v * Math.PI) / 180;
  const x = rad(b.latitude - a.latitude) * 6371000;
  const y = rad(b.longitude - a.longitude) * 6371000 * Math.cos(rad((a.latitude + b.latitude) / 2));
  return Math.round(Math.sqrt(x * x + y * y));
}
