# Membuat Custom 2D Map Tanpa Library Eksternal

Panduan ini menjelaskan cara membuat peta geografis custom dari nol — proyeksi, rendering SVG, styling, sampai interaktivitas — pakai React + JavaScript murni, tanpa `react-simple-maps`, `d3-geo`, atau library peta lainnya.

---

## 1. Kapan Cocok Pakai Pendekatan Ini

| Cocok kalau... | Mulai berat kalau... |
|---|---|
| Wilayah regional/lokal, bukan peta dunia | Cakupan area sangat luas lintas lintang (perlu proyeksi Mercator asli) |
| Jumlah polygon puluhan–ratusan | Ribuan feature dengan geometry sangat detail |
| Mau kontrol penuh tampilan & bundle size kecil | Butuh zoom/pan yang sangat smooth (gesture, inertia) |
| Boundary dari data sendiri (PostGIS/GeoJSON) | Butuh basemap (jalan, sungai, dll) — itu butuh tile, bukan SVG murni |

---

## 2. Alur Kerja Inti

```
GeoJSON (lon/lat)
   → 1. Hitung bounding box (min/max lon & lat)
   → 2. Buat fungsi proyeksi: lon/lat → x/y pixel
   → 3. Ubah setiap polygon jadi string path SVG ("M x,y L x,y ... Z")
   → 4. Render <path> per wilayah + styling/interaktivitas
```

Tidak ada "tile" atau "basemap" di sini — peta sepenuhnya digambar dari koordinat data kamu sendiri.

---

## 3. Siapkan Data

Sama seperti pendekatan pakai library: format wajib **GeoJSON** (`FeatureCollection`), bisa dari file statis atau endpoint API yang query PostGIS:

```sql
SELECT jsonb_build_object(
  'type', 'FeatureCollection',
  'features', jsonb_agg(
    jsonb_build_object(
      'type', 'Feature',
      'geometry', ST_AsGeoJSON(ST_Simplify(geom, 0.001))::jsonb,
      'properties', jsonb_build_object('name', name, 'kepadatan', kepadatan)
    )
  )
) AS geojson
FROM wilayah;
```

`ST_Simplify` di sini penting — tanpa optimasi tile seperti library peta profesional, makin banyak titik per polygon = makin berat proses bikin path string-nya di browser.

---

## 4. Hitung Bounding Box

Cari nilai lon/lat minimum & maksimum dari seluruh feature, untuk dasar penskalaan nanti:

```js
function getBounds(featureCollection) {
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;

  const visitRing = (ring) => {
    for (const [lon, lat] of ring) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  };

  for (const f of featureCollection.features) {
    const { type, coordinates } = f.geometry;
    if (type === "Polygon") coordinates.forEach(visitRing);
    if (type === "MultiPolygon") coordinates.forEach((poly) => poly.forEach(visitRing));
  }
  return { minLon, minLat, maxLon, maxLat };
}
```

---

## 5. Buat Fungsi Proyeksi

Proyeksi = fungsi yang mengubah `[lon, lat]` jadi `[x, y]` pixel, sekaligus "fit" ke ukuran SVG-mu (mirip `fitSize` di d3).

```js
function makeProjection(bounds, width, height, padding = 24) {
  const { minLon, minLat, maxLon, maxLat } = bounds;
  const lonSpan = maxLon - minLon || 1;
  const latSpan = maxLat - minLat || 1;

  // pilih skala terkecil supaya peta tidak terdistorsi/terpotong
  const scale = Math.min(
    (width - padding * 2) / lonSpan,
    (height - padding * 2) / latSpan
  );

  const usedWidth = lonSpan * scale;
  const usedHeight = latSpan * scale;
  const offsetX = (width - usedWidth) / 2;
  const offsetY = (height - usedHeight) / 2;

  return (lon, lat) => [
    (lon - minLon) * scale + offsetX,
    (maxLat - lat) * scale + offsetY, // y dibalik: SVG y tumbuh ke bawah, lat ke atas
  ];
}
```

> **Catatan akurasi:** ini proyeksi *equirectangular* (linear sederhana) — cukup akurat untuk area regional. Untuk cakupan sangat luas lintas lintang, ganti komponen `lat` dengan rumus Mercator agar bentuk wilayah di lintang tinggi tidak gepeng:
> ```js
> function latToMercator(latDeg) {
>   const lat = (latDeg * Math.PI) / 180;
>   return Math.log(Math.tan(Math.PI / 4 + lat / 2));
> }
> ```

---

## 6. Ubah Geometry Jadi Path SVG

```js
function ringToPathSegment(ring, project) {
  return ring
    .map(([lon, lat], i) => {
      const [x, y] = project(lon, lat);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ") + " Z";
}

function geometryToPath(geometry, project) {
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
```

`ring` pertama dalam `Polygon` adalah garis luar; ring selanjutnya (kalau ada) adalah lubang di dalamnya (misal danau di tengah wilayah) — SVG otomatis menangani ini lewat fill-rule default (`nonzero`), jadi tidak perlu kode tambahan.

---

## 7. Render Komponen Dasar

```tsx
function Map({ data, width = 640, height = 440 }) {
  const project = useMemo(() => {
    const bounds = getBounds(data);
    return makeProjection(bounds, width, height);
  }, [data, width, height]);

  return (
    <svg width={width} height={height}>
      {data.features.map((f) => (
        <path
          key={f.properties.name}
          d={geometryToPath(f.geometry, project)}
          fill="#D6D6DA"
          stroke="#fff"
          strokeWidth={1}
        />
      ))}
    </svg>
  );
}
```

---

## 8. Choropleth — Warna Manual Berdasarkan Data

Interpolasi linear antar dua warna, tanpa `d3-scale`:

```js
function colorFor(value, min, max, from = [219, 234, 254], to = [30, 58, 138]) {
  const t = (value - min) / (max - min || 1);
  const r = Math.round(from[0] + (to[0] - from[0]) * t);
  const g = Math.round(from[1] + (to[1] - from[1]) * t);
  const b = Math.round(from[2] + (to[2] - from[2]) * t);
  return `rgb(${r},${g},${b})`;
}
```

```tsx
fill={colorFor(f.properties.kepadatan, min, max)}
```

---

## 9. Interaktivitas — Hover & Klik

```tsx
const [hoveredId, setHoveredId] = useState(null);
const [selected, setSelected] = useState(null);

<path
  d={geometryToPath(f.geometry, project)}
  fill={colorFor(f.properties.kepadatan, min, max)}
  stroke={selected?.properties.name === f.properties.name ? "#0f172a" : "#fff"}
  strokeWidth={hoveredId === f.properties.name ? 2 : 1}
  onMouseEnter={() => setHoveredId(f.properties.name)}
  onMouseLeave={() => setHoveredId(null)}
  onClick={() => setSelected(f)}
  style={{ cursor: "pointer" }}
/>
```

Tampilkan detail `selected` di panel samping (lebih simpel & stabil daripada tooltip yang mengikuti kursor).

---

## 10. Label / Centroid Sederhana

Rata-rata semua titik di ring luar — cukup akurat untuk polygon yang tidak terlalu cekung:

```js
function simpleCentroid(geometry) {
  const ring = geometry.type === "Polygon" ? geometry.coordinates[0] : geometry.coordinates[0][0];
  const sum = ring.reduce(([sx, sy], [lon, lat]) => [sx + lon, sy + lat], [0, 0]);
  return [sum[0] / ring.length, sum[1] / ring.length];
}
```

---

## 11. Zoom & Pan Manual (Opsional)

Tanpa library, cara paling sederhana: bungkus isi `<svg>` dalam `<g>` dan ubah `transform` berdasarkan state.

```tsx
const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });

const handleWheel = (e) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  setTransform((t) => ({ ...t, k: Math.min(8, Math.max(1, t.k * delta)) }));
};

<svg width={width} height={height} onWheel={handleWheel}>
  <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
    {/* path-path wilayah di sini */}
  </g>
</svg>
```

Untuk pan (drag), tambahkan `onMouseDown`/`onMouseMove`/`onMouseUp` yang mengubah `transform.x`/`transform.y` berdasarkan delta posisi mouse. Ini versi dasar — belum ada inertia/touch gesture seperti library mapping profesional.

---

## 12. Performa — Simplifikasi Tanpa Library

Kalau geometry terlalu detail dan tidak bisa di-`ST_Simplify` di database, versi sederhana algoritma pengurangan titik (ambil 1 dari setiap N titik — bukan Douglas-Peucker asli, tapi cukup untuk kasus ringan):

```js
function naiveSimplify(ring, everyN = 2) {
  return ring.filter((_, i) => i % everyN === 0 || i === ring.length - 1);
}
```

Untuk hasil simplifikasi yang lebih baik secara bentuk (bukan cuma buang titik acak), tetap disarankan proses di backend (`ST_Simplify`) atau sekali saja saat build-time, bukan di runtime browser.

---

## 13. Struktur Project yang Disarankan

```
src/
  map/
    projection.js     ← getBounds, makeProjection, latToMercator (opsional)
    geometry.js        ← geometryToPath, simpleCentroid
    color.js           ← colorFor
  components/
    Map.tsx             ← komponen utama, render <svg>
    MapDetailPanel.tsx  ← panel info wilayah terpilih
  hooks/
    useRegionsData.ts   ← fetch GeoJSON dari API/PostGIS
```

---

## 14. Kapan Sebaiknya Pindah ke Library

Pertimbangkan kembali ke `react-simple-maps`/`d3-geo` kalau salah satu ini mulai jadi masalah nyata:

- Zoom/pan butuh terasa "natural" (inertia, multi-touch)
- Data makin besar dan render mulai lag walau sudah disimplify
- Butuh proyeksi yang akurat secara kartografis (bukan cuma `fit ke kotak`)
- Tim makin besar — kode custom butuh didokumentasikan & dirawat sendiri

Tidak ada salahnya mulai dari custom dulu (lebih ringan, lebih kamu pahami luar-dalam), lalu pindah ke library kalau kebutuhannya memang melebihi yang masuk akal untuk di-maintain sendiri.

---

## Referensi

- [MDN — SVG Path data](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d)
- [PostGIS — ST_Simplify](https://postgis.net/docs/ST_Simplify.html)
- [Map Projections (penjelasan visual)](https://www.geo-projections.com/)