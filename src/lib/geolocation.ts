import type { Product } from "@/lib/marketplace";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function getCurrentCoordinates(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location is not available in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error("Location access was blocked. Allow it in your browser to find nearby listings."));
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          reject(new Error("Your current location could not be determined."));
        } else {
          reject(new Error("Location lookup timed out. Please try again."));
        }
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 15_000 },
    );
  });
}

export function roundCoordinates(coordinates: Coordinates): Coordinates {
  return {
    latitude: Number(coordinates.latitude.toFixed(3)),
    longitude: Number(coordinates.longitude.toFixed(3)),
  };
}

export function distanceKm(from: Coordinates, to: Coordinates): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function distanceToProductKm(origin: Coordinates, product: Product): number | null {
  if (product.location_latitude == null || product.location_longitude == null) return null;
  return distanceKm(origin, {
    latitude: product.location_latitude,
    longitude: product.location_longitude,
  });
}

export function sortProductsByDistance(products: Product[], origin: Coordinates): Product[] {
  return products
    .map((product, index) => ({ product, index, distance: distanceToProductKm(origin, product) }))
    .sort((a, b) => {
      if (a.distance == null && b.distance == null) return a.index - b.index;
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance || a.index - b.index;
    })
    .map(({ product }) => product);
}