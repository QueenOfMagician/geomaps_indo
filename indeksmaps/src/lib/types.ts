export interface GeoJSONGeometry {
  type: "Polygon" | "MultiPolygon";
  coordinates: any[][][];
}

export interface GeoJSONFeature {
  type: "Feature";
  geometry: GeoJSONGeometry;
  properties: {
    name?: string;
    NAME_0?: string;
    NAME_1?: string;
    NAME_2?: string;
    NAME_3?: string;
    NAME_4?: string;
    [key: string]: any;
  };
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export interface MapBounds {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}
