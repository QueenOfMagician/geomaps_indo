# Panduan Pembuatan Project Custom Maps (React + TypeScript)

Panduan ini mendetailkan cara membangun aplikasi peta interaktif Indonesia menggunakan **React**, **TypeScript**, **MapLibre GL JS**, dan data **PMTiles** serta **JSON Kode Wilayah** yang ada di repositori ini.

---

## 1. Setup Project dengan Vite

Inisialisasi project React + TypeScript baru menggunakan Vite:

```bash
# Membuat project baru
npm create vite@latest indonesia-custom-maps -- --template react-ts

# Masuk ke folder project
cd indonesia-custom-maps

# Menginstal dependensi dasar
npm install
```

---

## 2. Instalasi Dependensi Peta

Instal pustaka MapLibre GL JS, plugin PMTiles, dan tipe TypeScript pendukungnya:

```bash
npm install maplibre-gl pmtiles
npm install -D @types/geojson
```

---

## 3. Struktur Project React yang Direkomendasikan

```
src/
├── components/
│   ├── MapContainer.tsx               # Komponen Peta Utama
│   └── RegionSelector.tsx             # Cascading Dropdowns
├── types/
│   └── region.ts                      # Tipe data TypeScript
├── App.tsx
├── index.css
└── main.tsx
```

---

## 4. Implementasi Kode

### A. Definisi Type (`src/types/region.ts`)

Buat tipe data untuk wilayah administrasi:

```typescript
export interface Region {
  code: string;
  name: string;
}

export type RegionLevel = 'province' | 'regency' | 'district' | 'village';
```

### B. Komponen Selektor Cascading (`src/components/RegionSelector.tsx`)

Komponen dropdown bertingkat untuk memilih Provinsi -> Kabupaten/Kota -> Kecamatan -> Desa:

```typescript
import React, { useEffect, useState } from 'react';
import { Region } from '../types/region';

interface RegionSelectorProps {
  onRegionChange: (level: string, code: string | null) => void;
}

const BASE_URL = "https://QueenOfMagician.github.io/geomaps_indo/data-static-indonesia/kode-wilayah";

export const RegionSelector: React.FC<RegionSelectorProps> = ({ onRegionChange }) => {
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [regencies, setRegencies] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [villages, setVillages] = useState<Region[]>([]);

  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedRegency, setSelectedRegency] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');

  // Load Provinces
  useEffect(() => {
    fetch(`${BASE_URL}/provinces.json`)
      .then((res) => res.json())
      .then((data) => setProvinces(data));
  }, []);

  // Load Regencies when Province changes
  useEffect(() => {
    if (!selectedProvince) {
      setRegencies([]);
      return;
    }
    fetch(`${BASE_URL}/provinces/${selectedProvince}.json`)
      .then((res) => res.json())
      .then((data) => setRegencies(data));
  }, [selectedProvince]);

  // Load Districts when Regency changes
  useEffect(() => {
    if (!selectedRegency) {
      setDistricts([]);
      return;
    }
    const provCode = selectedProvince;
    fetch(`${BASE_URL}/regencies/${provCode}/${selectedRegency}.json`)
      .then((res) => res.json())
      .then((data) => setDistricts(data));
  }, [selectedRegency, selectedProvince]);

  // Load Villages when District changes
  useEffect(() => {
    if (!selectedDistrict) {
      setVillages([]);
      return;
    }
    const provCode = selectedProvince;
    const regCode = selectedRegency;
    fetch(`${BASE_URL}/districts/${provCode}/${regCode}/${selectedDistrict}.json`)
      .then((res) => res.json())
      .then((data) => setVillages(data));
  }, [selectedDistrict, selectedRegency, selectedProvince]);

  return (
    <div style={{ display: 'flex', gap: '10px', padding: '15px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
      {/* Dropdown Provinsi */}
      <select value={selectedProvince} onChange={(e) => {
        const val = e.target.value;
        setSelectedProvince(val);
        setSelectedRegency('');
        setSelectedDistrict('');
        setSelectedVillage('');
        onRegionChange('province', val || null);
      }}>
        <option value="">Pilih Provinsi</option>
        {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
      </select>

      {/* Dropdown Kabupaten */}
      <select value={selectedRegency} disabled={!selectedProvince} onChange={(e) => {
        const val = e.target.value;
        setSelectedRegency(val);
        setSelectedDistrict('');
        setSelectedVillage('');
        onRegionChange('regency', val || null);
      }}>
        <option value="">Pilih Kabupaten/Kota</option>
        {regencies.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
      </select>

      {/* Dropdown Kecamatan */}
      <select value={selectedDistrict} disabled={!selectedRegency} onChange={(e) => {
        const val = e.target.value;
        setSelectedDistrict(val);
        setSelectedVillage('');
        onRegionChange('district', val || null);
      }}>
        <option value="">Pilih Kecamatan</option>
        {districts.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
      </select>

      {/* Dropdown Desa */}
      <select value={selectedVillage} disabled={!selectedDistrict} onChange={(e) => {
        const val = e.target.value;
        setSelectedVillage(val);
        onRegionChange('village', val || null);
      }}>
        <option value="">Pilih Desa/Kelurahan</option>
        {villages.map((v) => <option key={v.code} value={v.code}>{v.name}</option>)}
      </select>
    </div>
  );
};
```

---

### C. Komponen Peta Utama (`src/components/MapContainer.tsx`)

Komponen utama yang memuat peta vektor **PMTiles** dan menerapkan filter visual berdasarkan pilihan wilayah:

```typescript
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import * as pmtiles from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapContainerProps {
  selectedLevel: string;
  selectedCode: string | null;
}

const REPO_URL = "https://QueenOfMagician.github.io/geomaps_indo/data-static-indonesia/geo-indonesia";

export const MapContainer: React.FC<MapContainerProps> = ({ selectedLevel, selectedCode }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Inisialisasi Protokol PMTiles sekali saja saat component dimuat
  useEffect(() => {
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    return () => {
      // Membersihkan protokol jika komponen di-unmount
      maplibregl.removeProtocol("pmtiles");
    };
  }, []);

  // Inisialisasi Map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Load level 2 (Kabupaten) secara default untuk demo
    const defaultPmtilesUrl = `pmtiles://${REPO_URL}/IDN_level_2.pmtiles`;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "idn-boundaries": {
            type: "vector",
            url: defaultPmtilesUrl,
            attribution: '© Protomaps © Kemendagri'
          }
        },
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#eef2f7" }
          },
          {
            id: "boundary-fill",
            source: "idn-boundaries",
            "source-layer": "IDN_level_2",
            type: "fill",
            paint: {
              "fill-color": "#4dabf7",
              "fill-opacity": 0.4,
              "fill-outline-color": "#1c7ed6"
            }
          },
          {
            id: "boundary-line",
            source: "idn-boundaries",
            "source-layer": "IDN_level_2",
            type: "line",
            paint: {
              "line-color": "#1c7ed6",
              "line-width": 1.2
            }
          }
        ]
      },
      center: [118.0, -2.5],
      zoom: 4.5
    });

    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Tangani perubahan filter / zoom ketika region dipilih
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (!selectedCode) {
      // Jika tidak ada region terpilih, hapus filter / kembalikan filter default
      map.setFilter("boundary-fill", null);
      return;
    }

    // Terapkan filter berdasarkan level
    // Kode wilayah terstruktur, misal:
    // Jawa Barat -> "32"
    // Kota Bandung -> "32.73"
    // Kode dicocokkan dengan properti dari GeoJSON PMTiles
    let filterExpression: any[] = [];
    
    if (selectedLevel === 'province') {
      // Filter wilayah di bawah provinsi terpilih (misal kode diawali "32")
      filterExpression = ["parse-number", ["slice", ["get", "CC_1"], 0, 2]] ;
      // Di Mapbox/Maplibre Vector Tiles, properti dependensi kode wilayah biasanya disimpan di properti metadata
      map.setFilter("boundary-fill", ["==", ["slice", ["get", "code"], 0, 2], selectedCode]);
    } else if (selectedLevel === 'regency') {
      map.setFilter("boundary-fill", ["==", ["slice", ["get", "code"], 0, 5], selectedCode]);
    } else if (selectedLevel === 'district') {
      map.setFilter("boundary-fill", ["==", ["slice", ["get", "code"], 0, 8], selectedCode]);
    }

  }, [selectedLevel, selectedCode]);

  return <div ref={mapContainer} style={{ width: '100vw', height: '100vh' }} />;
};
```

### D. Main Application Entry (`src/App.tsx`)

Gabungkan selektor wilayah dengan peta:

```typescript
import React, { useState } from 'react';
import { MapContainer } from './components/MapContainer';
import { RegionSelector } from './components/RegionSelector';

function App() {
  const [selectedLevel, setSelectedLevel] = useState<string>('province');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const handleRegionChange = (level: string, code: string | null) => {
    setSelectedLevel(level);
    setSelectedCode(code);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <RegionSelector onRegionChange={handleRegionChange} />
      <MapContainer selectedLevel={selectedLevel} selectedCode={selectedCode} />
    </div>
  );
}

export default App;
```

---

## 5. Menjalankan Aplikasi Secara Lokal

Jalankan perintah berikut untuk menguji aplikasi secara lokal:

```bash
npm run dev
```

Buka peramban di alamat `http://localhost:5173` untuk melihat hasilnya.

---

## 6. Publikasi ke GitHub Pages / Vercel

Aplikasi web statis ini dapat di-deploy dengan mudah karena semua aset peta dan JSON-nya sudah di-host di GitHub Pages QueenOfMagician secara cloudless.

Untuk deploy aplikasi React ke GitHub Pages:
1. Instal dependensi gh-pages: `npm install -D gh-pages`
2. Tambahkan `"homepage": "https://username.github.io/repository-name"` di `package.json`.
3. Tambahkan script `"deploy": "npm run build && gh-pages -d dist"` di `package.json`.
4. Jalankan `npm run deploy` untuk mempublikasikan dashboard peta Anda!
