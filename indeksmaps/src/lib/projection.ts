import type { MapBounds, GeoJSONFeatureCollection } from "./types";

export function getBounds(data: GeoJSONFeatureCollection): MapBounds {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  const visitRing = (ring: number[][]) => {
    for (const [lon, lat] of ring) {
      if (typeof lon !== "number" || typeof lat !== "number" || isNaN(lon) || isNaN(lat)) {
        continue;
      }
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  };

  for (const f of data.features) {
    if (!f.geometry || !f.geometry.coordinates) continue;
    const { type, coordinates } = f.geometry;
    if (type === "Polygon") {
      coordinates.forEach(visitRing);
    } else if (type === "MultiPolygon") {
      coordinates.forEach((poly) => poly.forEach(visitRing));
    }
  }

  // Fallback if no valid points found
  if (minLon === Infinity) {
    return { minLon: 95.0, minLat: -11.0, maxLon: 141.0, maxLat: 6.0 }; // Indonesia bounds
  }

  return { minLon, minLat, maxLon, maxLat };
}

export function makeProjection(
  bounds: MapBounds,
  width: number,
  height: number,
  padding = 24
) {
  const { minLon, minLat, maxLon, maxLat } = bounds;

  // Equirectangular (Linear / Flat)
  const lonSpan = maxLon - minLon || 1;
  const latSpan = maxLat - minLat || 1;

  const scale = Math.min(
    (width - padding * 2) / lonSpan,
    (height - padding * 2) / latSpan
  );

  const usedWidth = lonSpan * scale;
  const usedHeight = latSpan * scale;
  const offsetX = (width - usedWidth) / 2;
  const offsetY = (height - usedHeight) / 2;

  return (lon: number, lat: number): [number, number] => {
    const x = (lon - minLon) * scale + offsetX;
    const y = (maxLat - lat) * scale + offsetY;
    return [x, y];
  };
}
