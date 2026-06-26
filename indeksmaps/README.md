# IndeksMaps 🗺️

`indeksmaps` adalah library React + TypeScript untuk merender peta vektor interaktif Indonesia secara kustom menggunakan SVG murni. 

Library ini dirancang dengan **zero-external GIS dependencies** (tanpa Leaflet, OpenLayers, D3, atau Mapbox), menjadikannya sangat ringan (hanya berukuran ~9 KB setelah di-build), responsif, dan mudah dikustomisasi secara visual maupun interaktif.

---

## Fitur Utama

- ⚡ **Ringan & Cepat:** Merender peta langsung dari GeoJSON Anda menggunakan path SVG asli.
- 📐 **Flat Linear Projection:** Konversi koordinat bumi (Longitude/Latitude) ke piksel layar secara otomatis tanpa library matematika rumit.
- 🎛️ **Zooming & Panning:** Navigasi geser (drag) dan scroll-wheel zoom yang presisi terpusat ke arah kursor kursor (opsional).
- 🏷️ **Labels Centroid Layer:** Menampilkan nama wilayah secara otomatis di titik tengah wilayah dengan bayangan kontras tinggi.
- 🎨 **Kustomisasi Pewarnaan:**
  - **Gradasi Otomatis (Choropleth):** Mewarnai wilayah berdasarkan rentang statistik numerik.
  - **Custom Inline Color:** Mewarnai provinsi/kota tertentu secara manual melalui properti `fill` atau `color` langsung dari berkas GeoJSON.
* 🔗 **Dua Arah & Multi-Select:** Mendukung event click/hover callback dan seleksi banyak wilayah sekaligus (`selectedFeatures`).
* 💬 **Kustom Tooltip:** Pop-up info melayang yang posisinya mengikuti kursor mouse.

---

## Pemasangan (Installation)

### 1. Instalasi Lokal (Development)
Di dalam direktori library ini:
```bash
npm link
```
Di dalam direktori proyek React Anda yang lain:
```bash
npm link indeksmaps
```

### 2. Instalasi via NPM (Setelah Dipublikasikan)
```bash
npm install indeksmaps
```

---

## Cara Penggunaan

### 1. Single-Select & Tooltip Dasar
```tsx
import { useState } from "react";
import { IndeksMap, GeoJSONFeature } from "indeksmaps";

function BasicMap({ geojsonData }) {
  const [selected, setSelected] = useState<GeoJSONFeature | null>(null);

  return (
    <div style={{ width: "800px", height: "500px" }}>
      <IndeksMap
        data={geojsonData}
        selectedFeature={selected}
        onFeatureClick={(f) => setSelected(f)}
        showLabels={true}
        labelField="NAME_1"
        labelColor="#ffffff"
        renderTooltip={(f) => (
          <div>
            <strong>{f.properties.NAME_1}</strong>
            <span>Kode Pos: {f.properties.postalCode}</span>
          </div>
        )}
      />
    </div>
  );
}
```

### 2. Multi-Select (Memilih Lebih dari Satu Wilayah)
```tsx
import { useState } from "react";
import { IndeksMap, GeoJSONFeature } from "indeksmaps";

function MultiSelectMap({ geojsonData }) {
  const [selectedList, setSelectedList] = useState<GeoJSONFeature[]>([]);

  const handleFeatureClick = (clicked: GeoJSONFeature) => {
    const clickedId = clicked.properties.GID_1 || clicked.properties.code;
    setSelectedList((prev) => {
      const exists = prev.some((f) => (f.properties.GID_1 || f.properties.code) === clickedId);
      if (exists) {
        return prev.filter((f) => (f.properties.GID_1 || f.properties.code) !== clickedId);
      } else {
        return [...prev, clicked];
      }
    });
  };

  return (
    <IndeksMap
      data={geojsonData}
      selectedFeatures={selectedList}
      onFeatureClick={handleFeatureClick}
    />
  );
}
```

---

## API Reference (Props)

| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `data` | `GeoJSONFeatureCollection` | *Required* | Data spasial berformat GeoJSON. |
| `width` | `number` | `800` | Lebar referensi SVG viewBox. |
| `height` | `number` | `500` | Tinggi referensi SVG viewBox. |
| `padding` | `number` | `24` | Margin dalam tepi peta. |
| `defaultFill` | `string` | `"#f1f5f9"` | Warna dasar wilayah jika tidak ada data warna. |
| `strokeColor` | `string` | `"#cbd5e1"` | Warna garis pembatas antar wilayah. |
| `strokeWidth` | `number` | `1` | Ketebalan garis pembatas wilayah. |
| `hoverFill` | `string` | `"#bae6fd"` | Warna isi wilayah saat di-hover kursor mouse. |
| `hoverStroke` | `string` | `"#0284c7"` | Warna garis wilayah saat di-hover kursor mouse. |
| `selectedFill` | `string` | `"#7dd3fc"` | Warna isi wilayah saat terpilih (Selected). |
| `selectedStroke` | `string` | `"#0369a1"` | Warna garis wilayah saat terpilih (Selected). |
| `selectedFeature` | `GeoJSONFeature \| null` | `null` | Target wilayah terpilih tunggal (Single-select). |
| `selectedFeatures` | `GeoJSONFeature[] \| null` | `null` | Daftar wilayah terpilih banyak (Multi-select). |
| `onFeatureClick` | `(f: GeoJSONFeature) => void` | `undefined` | Callback saat wilayah diklik. |
| `onFeatureHover` | `(f: GeoJSONFeature \| null) => void` | `undefined` | Callback saat kursor masuk/keluar wilayah. |
| `choroplethField` | `string` | `undefined` | Nama properti statistik numerik untuk gradasi warna otomatis. |
| `choroplethColorFrom`| `string` | `"#dbeafe"` | Hex warna gradasi terendah. |
| `choroplethColorTo` | `string` | `"#1e3a8b"` | Hex warna gradasi tertinggi. |
| `enableZoomPan` | `boolean` | `true` | Aktifkan fitur geser dan perbesar peta. |
| `showLabels` | `boolean` | `false` | Menampilkan teks label di atas peta. |
| `labelField` | `string \| function` | `"NAME_1"` | Kunci properti penentu nama label teks. |
| `labelColor` | `string` | `"#475569"` | Warna huruf teks label. |
| `labelSize` | `number` | `10` | Ukuran dasar font teks label. |
| `renderTooltip` | `(f: GeoJSONFeature) => ReactNode` | `undefined` | Pengatur UI box tooltip melayang. |

---

## 3. Komponen PMTiles (Vector Tiles) - `IndeksMapPMTiles`

Jika Anda ingin menampilkan peta berukuran sangat besar (misalnya seluruh Indonesia sampai tingkat Kelurahan/Desa) tanpa membuat browser lambat, gunakan komponen `IndeksMapPMTiles`. Komponen ini berbasis WebGL menggunakan **MapLibre GL JS** dan memuat bagian peta yang diperlukan saja secara dinamis via CDN.

### Cara Penggunaan PMTiles:
```tsx
import { useState } from "react";
import { IndeksMapPMTiles } from "indeksmaps";
import "indeksmaps/dist/indeksmaps.css"; // Impor stylesheet maplibre

function WebGLMap() {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <IndeksMapPMTiles
        pmtilesUrl="https://QueenOfMagician.github.io/geomaps_indo/data-static-indonesia/geo-indonesia/IDN_level_1.pmtiles"
        sourceLayer="IDN_level_1"
        selectedCode={selectedCode}
        onRegionClick={(properties) => {
          setSelectedCode(properties.code);
          console.log("Wilayah diklik:", properties);
        }}
      />
    </div>
  );
}
```

### API Reference `IndeksMapPMTiles` Props:

| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `pmtilesUrl` | `string` | *Required* | URL CDN menuju berkas `.pmtiles` (misal link jsDelivr). |
| `sourceLayer` | `string` | *Required* | Layer sumber di dalam PMTiles (e.g. `"IDN_level_1"`, `"IDN_level_2"`). |
| `selectedCode` | `string \| null` | `null` | Kode wilayah terpilih tunggal (Single-select). |
| `selectedCodes` | `string[] \| null` | `null` | Daftar banyak kode wilayah terpilih (Multi-select). |
| `onRegionClick` | `(properties: any) => void` | `undefined` | Callback ketika wilayah diklik. |
| `onRegionHover` | `(properties: any \| null) => void` | `undefined` | Callback ketika wilayah di-hover kursor mouse. |
| `defaultFillColor`| `string` | `"#1e293b"` | Warna isi poligon peta default. |
| `selectedFillColor`| `string` | `"#0284c7"` | Warna isi poligon peta saat terpilih. |
| `strokeColor` | `string` | `"#475569"` | Warna garis batas wilayah. |
| `strokeWidth` | `number` | `1` | Ketebalan garis batas wilayah. |
| `center` | `[number, number]` | `[118.0, -2.5]` | Koordinat pusat peta `[longitude, latitude]`. |
| `zoom` | `number` | `4.5` | Tingkat zoom awal. |

---

---

## Integrasi CDN jsDelivr

**jsDelivr** adalah CDN publik gratis yang secara otomatis mencerminkan (*mirror*) berkas dari **NPM registry** dan **GitHub**. Anda tidak perlu melakukan "push" langsung ke server jsDelivr.

### Metode A: Pencerminan via NPM (Direkomendasikan)
Setelah Anda mempublikasikan library ke NPM menggunakan `npm publish`, berkas build Anda otomatis tersedia di jsDelivr.

Format URL jsDelivr untuk NPM:
```
https://cdn.jsdelivr.net/npm/{nama_package}@{versi}/{path_berkas}
```
*Contoh memuat script modul ES:*
```
https://cdn.jsdelivr.net/npm/indeksmaps@1.0.0/dist/indeksmaps.es.js
```

### Metode B: Pencerminan via GitHub
Jika Anda ingin menyajikan data statis (seperti berkas GeoJSON atau berkas PMTiles peta Indonesia) langsung dari repositori GitHub tanpa mempublikasikannya ke NPM:

Format URL jsDelivr untuk GitHub:
```
https://cdn.jsdelivr.net/gh/{username}/{nama_repo}@{branch_atau_tag}/{path_berkas}
```
*Contoh memuat berkas PMTiles Level 1:*
```
https://cdn.jsdelivr.net/gh/QueenOfMagician/geomaps_indo@main/data-static-indonesia/geo-indonesia/IDN_level_1.pmtiles
```
*Contoh memuat kode wilayah Kemendagri provinces.json:*
```
https://cdn.jsdelivr.net/gh/QueenOfMagician/geomaps_indo@main/data-static-indonesia/kode-wilayah/provinces.json
```
