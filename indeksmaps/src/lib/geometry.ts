import type { GeoJSONGeometry } from "./types";

function ringToPathSegment(ring: number[][], project: (lon: number, lat: number) => [number, number]): string {
  if (!ring || ring.length === 0) return "";
  
  return ring
    .map(([lon, lat], i) => {
      const [x, y] = project(lon, lat);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ") + " Z";
}

export function geometryToPath(
  geometry: GeoJSONGeometry,
  project: (lon: number, lat: number) => [number, number]
): string {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.map((ring) => ringToPathSegment(ring, project)).join(" ");
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .map((poly) => poly.map((ring) => ringToPathSegment(ring, project)).join(" "))
      .join(" ");
  }
  return "";
}

export function simpleCentroid(geometry: GeoJSONGeometry): [number, number] {
  const ring = geometry.type === "Polygon" 
    ? geometry.coordinates[0] 
    : geometry.coordinates[0][0];
    
  if (!ring || ring.length === 0) return [0, 0];
  
  const sum = ring.reduce(([sx, sy], [lon, lat]) => [sx + lon, sy + lat], [0, 0]);
  return [sum[0] / ring.length, sum[1] / ring.length];
}
