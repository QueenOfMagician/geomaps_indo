# Panduan Integrasi Data Wilayah & Peta Indonesia

Dokumen ini menjelaskan struktur data wilayah Indonesia (format JSON) dan panduan penggunaan peta vektor (format PMTiles) dalam proyek ini.

---

## Daftar Isi
1. [Kode Wilayah Indonesia (JSON)](#1-kode-wilayah-indonesia-json)
   - [Struktur Folder](#struktur-folder)
   - [Format Kode Wilayah](#format-kode-wilayah)
   - [Cara Penggunaan (Cascading Dropdown)](#cara-penggunaan-cascading-dropdown)
2. [Peta Vektor Indonesia (PMTiles)](#2-peta-vektor-indonesia-pmtiles)
   - [Struktur Berkas Peta](#struktur-berkas-peta)
   - [Apa itu PMTiles?](#apa-itu-pmtiles)
   - [Cara Menggunakan PMTiles di Sisi Client (MapLibre GL JS)](#cara-menggunakan-pmtiles-di-sisi-client-maplibre-gl-js)

---

# 1. Kode Wilayah Indonesia (JSON)

Dataset kode wilayah administrasi Indonesia berdasarkan kode wilayah Kemendagri disusun secara hierarkis untuk memudahkan pencarian cascading dropdown, validasi alamat, maupun sinkronisasi offline.

## Struktur Folder

```
data-static-indonesia/kode-wilayah/
│
├── provinces.json                     # Seluruh provinsi
│
├── provinces/
│   ├── 11.json                        # Kabupaten/Kota Provinsi 11
│   ├── 12.json
│   └── ...
│
├── regencies/
│   ├── 11/
│   │   ├── 11.01.json                 # Kecamatan Kabupaten 11.01
│   │   ├── 11.02.json
│   │   └── ...
│   └── ...
│
└── districts/
    ├── 11/
    │   ├── 11.01/
    │   │   ├── 11.01.01.json          # Desa Kecamatan 11.01.01
    │   │   ├── 11.01.02.json
    │   │   └── ...
    │   └── ...
    └── ...
```

---

## Hirarki Wilayah

```
Indonesia
    └── Provinsi (2 digit)
            └── Kabupaten / Kota (2.2 digit)
                    └── Kecamatan (2.2.2 digit)
                            └── Desa / Kelurahan (2.2.2.4 digit)
```

Contoh:
* **Provinsi:** `32` (Jawa Barat)
* **Kabupaten/Kota:** `32.73` (Kota Bandung)
* **Kecamatan:** `32.73.09` (Cicendo)
* **Desa/Kelurahan:** `32.73.09.1004` (Pajajaran)

---

## Format Kode Wilayah

### Provinsi (2 digit)
```json
{
    "code": "32",
    "name": "Jawa Barat"
}
```

### Kabupaten/Kota (2 + "." + 2 digit)
```json
{
    "code": "32.73",
    "name": "Kota Bandung"
}
```

### Kecamatan (2 + "." + 2 + "." + 2 digit)
```json
{
    "code": "32.73.09",
    "name": "Cicendo"
}
```

### Desa/Kelurahan (2 + "." + 2 + "." + 2 + "." + 4 digit)
```json
{
    "code": "32.73.09.1004",
    "name": "Pajajaran"
}
```

---

## Cara Penggunaan (Cascading Dropdown)

### 1. Mengambil daftar provinsi
Baca berkas:
```
data-static-indonesia/kode-wilayah/provinces.json
```

### 2. Mengambil daftar kabupaten/kota
Misal memilih Provinsi Jawa Barat (`province_code = "32"`). Baca berkas:
```
data-static-indonesia/kode-wilayah/provinces/32.json
```

### 3. Mengambil daftar kecamatan
Misal memilih Kota Bandung (`regency_code = "32.73"`). Baca berkas:
```
data-static-indonesia/kode-wilayah/regencies/32/32.73.json
```

### 4. Mengambil daftar desa/kelurahan
Misal memilih Kecamatan Cicendo (`district_code = "32.73.09"`). Baca berkas:
```
data-static-indonesia/kode-wilayah/districts/32/32.73/32.73.09.json
```

---

# 2. Peta Vektor Indonesia (PMTiles)

Selain data tekstual, repositori ini menyertakan peta batas wilayah Indonesia dalam format **PMTiles** (Peta Vektor).

## Struktur Berkas Peta

Berkas peta terletak di:
```
data-static-indonesia/geojson-indonesia/
├── IDN_level_0.pmtiles                # Peta batas Negara Indonesia (Level 0)
├── IDN_level_1.pmtiles                # Peta batas Provinsi (Level 1)
├── IDN_level_2.pmtiles                # Peta batas Kabupaten/Kota (Level 2)
├── IDN_level_3.pmtiles                # Peta batas Kecamatan (Level 3)
└── IDN_level_4.pmtiles                # Peta batas Desa/Kelurahan (Level 4)
```

---

## Apa itu PMTiles?

**PMTiles** adalah format arsip berkas tunggal (*single-file archive*) untuk data piranti ubin peta (map tiles) seperti MVT (Mapbox Vector Tiles). 

**Kelebihan utama PMTiles:**
* **Tanpa Server Khusus:** Peta dapat disajikan langsung melalui static file server/hosting biasa (seperti GitHub Pages, Netlify, Cloudflare Pages, S3, dll.) karena mendukung pemanggilan data spasial secara parsial menggunakan **HTTP Range Requests**.
* **Sangat Cepat:** Browser hanya akan meminta bagian potongan peta (tiles) yang saat itu sedang dilihat di layar.
* **Ukuran Efisien:** Ukuran berkas sangat ringkas karena data vektor dikompresi dengan sangat baik.

---

## Cara Menggunakan PMTiles di Sisi Client (MapLibre GL JS)

Gunakan pustaka client **MapLibre GL JS** bersama dengan **pmtiles helper library** untuk mengintegrasikan peta langsung ke aplikasi web tanpa server GIS tambahan.

### Contoh Implementasi HTML/JavaScript:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Peta Indonesia PMTiles</title>
    <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
    
    <!-- MapLibre CSS & JS -->
    <link href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" rel="stylesheet" />
    <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
    
    <!-- PMTiles Plugin -->
    <script src="https://unpkg.com/pmtiles@2.11.0/dist/index.js"></script>
    
    <style>
        body { margin: 0; padding: 0; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; }
    </style>
</head>
<body>

<div id="map"></div>

<script>
    // 1. Inisialisasi protokol pmtiles
    let protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    // 2. URL ke berkas pmtiles (bisa dari localhost atau static hosting Anda di GitHub Pages)
    // Ubah URL di bawah sesuai domain hosting Anda
    const PMTILES_URL = "https://QueenOfMagician.github.io/geomaps_indo/data-static-indonesia/geojson-indonesia/IDN_level_1.pmtiles";

    // 3. Buat peta MapLibre
    const map = new maplibregl.Map({
        container: 'map',
        style: {
            version: 8,
            sources: {
                "indonesia-provinces": {
                    type: "vector",
                    url: "pmtiles://" + PMTILES_URL,
                    attribution: '© Protomaps © Kemendagri'
                }
            },
            layers: [
                // Layer Background
                {
                    "id": "background",
                    "type": "background",
                    "paint": {
                        "background-color": "#f8f9fa"
                    }
                },
                // Layer Poligon Wilayah (Fill)
                {
                    "id": "province-fill",
                    "source": "indonesia-provinces",
                    "source-layer": "IDN_level_1", // Sesuaikan dengan nama source-layer di berkas pmtiles
                    "type": "fill",
                    "paint": {
                        "fill-color": "#4dabf7",
                        "fill-opacity": 0.4
                    }
                },
                // Layer Garis Batas Wilayah (Line/Stroke)
                {
                    "id": "province-border",
                    "source": "indonesia-provinces",
                    "source-layer": "IDN_level_1",
                    "type": "line",
                    "paint": {
                        "line-color": "#1c7ed6",
                        "line-width": 1.5
                    }
                }
            ]
        },
        center: [118.0, -2.5], // Center coordinates Indonesia
        zoom: 4.5
    });

    // Menambahkan navigasi zoom dan rotasi
    map.addControl(new maplibregl.NavigationControl());
</script>
</body>
</html>
```