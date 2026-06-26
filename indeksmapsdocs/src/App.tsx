import { useState, useEffect } from "react";
import { 
  BookOpen, 
  Map, 
  Layers, 
  Terminal, 
  Check, 
  Copy,
  Info,
  Sliders,
  Code
} from "lucide-react";
import { IndeksMap } from "indeksmaps";
import type { GeoJSONFeatureCollection, GeoJSONFeature } from "indeksmaps";

type Section = "intro" | "install" | "svg-map" | "vector-map" | "api";

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>("intro");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Playground options
  const [selectedLevel, setSelectedLevel] = useState<1 | 2>(1);
  const [strokeColor, setStrokeColor] = useState("#475569");
  const [strokeWidth, setStrokeWidth] = useState(0.8);
  const [defaultFill, setDefaultFill] = useState("#1e293b");
  const [hoverFill, setHoverFill] = useState("#0ea5e9");
  const hoverStroke = "#38bdf8";
  const [selectedFill, setSelectedFill] = useState("#8b5cf6");
  const selectedStroke = "#c084fc";
  const [showLabels, setShowLabels] = useState(true);

  // Map Data
  const [geoJSONData, setGeoJSONData] = useState<GeoJSONFeatureCollection | null>(null);
  const [loadingMap, setLoadingMap] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<GeoJSONFeature[]>([]);

  useEffect(() => {
    setLoadingMap(true);
    const file = selectedLevel === 1 ? "/gadm41_IDN_1.json" : "/gadm41_IDN_2.json";
    fetch(file)
      .then((res) => res.json())
      .then((data) => {
        setGeoJSONData(data);
        setLoadingMap(false);
        setSelectedFeatures([]);
      })
      .catch((err) => {
        console.error("Error loading map:", err);
        setLoadingMap(false);
      });
  }, [selectedLevel]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleFeatureClick = (feature: GeoJSONFeature) => {
    const isSelected = selectedFeatures.some(
      (f) => (f.properties.GID_2 || f.properties.GID_1) === (feature.properties.GID_2 || feature.properties.GID_1)
    );
    if (isSelected) {
      setSelectedFeatures(
        selectedFeatures.filter(
          (f) => (f.properties.GID_2 || f.properties.GID_1) !== (feature.properties.GID_2 || feature.properties.GID_1)
        )
      );
    } else {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
  };

  const codeString = `import { IndeksMap } from 'indeksmaps';

function MyMap() {
  return (
    <IndeksMap
      data={geoJSONData}
      width={800}
      height={450}
      defaultFill="${defaultFill}"
      hoverFill="${hoverFill}"
      hoverStroke="${hoverStroke}"
      selectedFill="${selectedFill}"
      selectedStroke="${selectedStroke}"
      strokeColor="${strokeColor}"
      strokeWidth={${strokeWidth}}
      showLabels={${showLabels}}
      labelField="${selectedLevel === 1 ? 'NAME_1' : 'NAME_2'}"
      selectedFeatures={selectedFeatures}
      onFeatureClick={(feature) => handleFeatureClick(feature)}
    />
  );
}`;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="logo-icon">IM</div>
          <span className="brand-name">IndeksMaps</span>
        </div>

        <nav className="nav-links">
          <span className="nav-section-title">Dokumentasi</span>
          <a 
            className={`nav-item ${activeSection === "intro" ? "active" : ""}`}
            onClick={() => setActiveSection("intro")}
          >
            <BookOpen size={18} />
            Pengenalan
          </a>
          <a 
            className={`nav-item ${activeSection === "install" ? "active" : ""}`}
            onClick={() => setActiveSection("install")}
          >
            <Terminal size={18} />
            Instalasi
          </a>

          <span className="nav-section-title" style={{ marginTop: "16px" }}>Panduan Komponen</span>
          <a 
            className={`nav-item ${activeSection === "svg-map" ? "active" : ""}`}
            onClick={() => setActiveSection("svg-map")}
          >
            <Map size={18} />
            IndeksMap (SVG)
          </a>
          <a 
            className={`nav-item ${activeSection === "vector-map" ? "active" : ""}`}
            onClick={() => setActiveSection("vector-map")}
          >
            <Layers size={18} />
            IndeksMapPMTiles (Vector)
          </a>
          <a 
            className={`nav-item ${activeSection === "api" ? "active" : ""}`}
            onClick={() => setActiveSection("api")}
          >
            <Code size={18} />
            Referensi API
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* SECTION: INTRODUCTION */}
        {activeSection === "intro" && (
          <section className="doc-section">
            <h1>IndeksMaps</h1>
            <p>
              IndeksMaps adalah React + TypeScript Map Library modern yang dirancang khusus untuk merender peta batas administratif Indonesia (dari tingkat Negara, Provinsi, Kabupaten/Kota, Kecamatan, hingga Kelurahan/Desa) secara interaktif tanpa ketergantungan pada library GIS eksternal yang berat.
            </p>
            
            <div className="alert">
              <div className="alert-title">
                <Info size={16} /> Fitur Unggulan
              </div>
              <div className="alert-content">
                Mendukung flat projection Equirectangular (SVG Rendering) yang ringan, Multi-Select wilayah secara bawaan, serta rendering peta vektor hemat bandwidth berbasis format PMTiles.
              </div>
            </div>

            <h2>Kenapa IndeksMaps?</h2>
            <div className="card-grid">
              <div className="card">
                <div className="card-title">
                  <Map size={20} color="#0ea5e9" /> Ringan & Cepat
                </div>
                <div className="card-description">
                  SVG Rendering datar tanpa library d3-geo atau Leaflet. Ukuran bundle library hanya berkisar 10 KB (unpacked).
                </div>
              </div>
              <div className="card">
                <div className="card-title">
                  <Layers size={20} color="#8b5cf6" /> Skalabilitas PMTiles
                </div>
                <div className="card-description">
                  Mendukung data besar tingkat Desa/Kelurahan menggunakan protokol PMTiles untuk meminimalkan beban lag browser.
                </div>
              </div>
              <div className="card">
                <div className="card-title">
                  <Sliders size={20} color="#10b981" /> Reusable & Kustomisasi
                </div>
                <div className="card-description">
                  Gaya wilayah (fill, hover, stroke, label, tooltip) dan state pemilihan dapat dimanipulasi sepenuhnya via props.
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION: INSTALLATION */}
        {activeSection === "install" && (
          <section className="doc-section">
            <h1>Instalasi</h1>
            <p>
              Gunakan package manager pilihan Anda untuk meng-install package library dari NPM registry:
            </p>

            <div className="code-block">
              <div className="code-header">
                <span>TERMINAL</span>
                <button 
                  className="copy-btn"
                  onClick={() => handleCopy("npm install indeksmaps", "install-npm")}
                >
                  {copiedText === "install-npm" ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <span className="t-keyword">npm install</span> indeksmaps
            </div>

            <h2>Langkah Tambahan: Menyiapkan Geometri & Aset Peta</h2>
            <p>
              Karena peta batasan geografis Indonesia memiliki ukuran data yang besar (terutama level 3 dan 4), berkas GeoJSON/PMTiles tidak dibundel di dalam library. Anda harus menempatkannya di direktori publik server web Anda agar dapat diunduh klien:
            </p>

            <div className="alert alert-warning">
              <div className="alert-title">
                <Info size={16} /> Lokasi Berkas Peta
              </div>
              <div className="alert-content">
                Letakkan berkas GADM GeoJSON atau berkas PMTiles di dalam folder <code>public/</code> proyek React Anda (atau sajikan melalui CDN seperti jsDelivr/S3).
              </div>
            </div>

            <p>Struktur folder aset statis yang direkomendasikan:</p>
            <div className="code-block" style={{ fontSize: "12.5px" }}>
              proyek-react/<br />
              ├── public/<br />
              │   ├── gadm41_IDN_1.json     <span className="t-comment"># Batas Provinsi (SVG)</span><br />
              │   ├── gadm41_IDN_2.json     <span className="t-comment"># Batas Kota/Kabupaten (SVG)</span><br />
              │   ├── gadm41_IDN_3.json     <span className="t-comment"># Batas Kecamatan (SVG)</span><br />
              │   ├── IDN_level_1.pmtiles   <span className="t-comment"># Vector Map (PMTiles)</span><br />
              │   └── IDN_level_2.pmtiles   <span className="t-comment"># Vector Map (PMTiles)</span>
            </div>
          </section>
        )}

        {/* SECTION: SVG MAP PLAYGROUND */}
        {activeSection === "svg-map" && (
          <section className="doc-section">
            <h1>Komponen IndeksMap (SVG)</h1>
            <p>
              Komponen utama untuk merender peta berbasis elemen SVG dengan manipulasi warna penuh secara flat, hover handler, dan multi-select wilayah.
            </p>

            <div className="playground-container">
              {/* Controls */}
              <div className="playground-controls">
                <span className="nav-section-title">Konfigurasi Props</span>

                <div className="form-group">
                  <label className="form-label">Tingkat Wilayah (Level)</label>
                  <select 
                    className="form-select"
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(Number(e.target.value) as 1 | 2)}
                  >
                    <option value={1}>Level 1 (Provinsi)</option>
                    <option value={2}>Level 2 (Kota/Kabupaten)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Default Fill</label>
                  <input 
                    type="color" 
                    className="form-input" 
                    value={defaultFill} 
                    onChange={(e) => setDefaultFill(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Hover Fill</label>
                  <input 
                    type="color" 
                    className="form-input" 
                    value={hoverFill} 
                    onChange={(e) => setHoverFill(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Selected Fill</label>
                  <input 
                    type="color" 
                    className="form-input" 
                    value={selectedFill} 
                    onChange={(e) => setSelectedFill(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stroke Color</label>
                  <input 
                    type="color" 
                    className="form-input" 
                    value={strokeColor} 
                    onChange={(e) => setStrokeColor(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stroke Width ({strokeWidth}px)</label>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="3" 
                    step="0.1"
                    className="form-input" 
                    value={strokeWidth} 
                    onChange={(e) => setStrokeWidth(Number(e.target.value))} 
                  />
                </div>

                <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "10px" }}>
                  <input 
                    type="checkbox" 
                    id="showLabels"
                    checked={showLabels} 
                    onChange={(e) => setShowLabels(e.target.checked)} 
                  />
                  <label htmlFor="showLabels" className="form-label" style={{ cursor: "pointer", marginBottom: 0 }}>Tampilkan Label</label>
                </div>
              </div>

              {/* Preview */}
              <div className="playground-preview">
                {loadingMap ? (
                  <div style={{ color: "var(--text-muted)" }}>Memuat peta...</div>
                ) : geoJSONData ? (
                  <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <IndeksMap
                      data={geoJSONData}
                      width={580}
                      height={340}
                      padding={12}
                      enableZoomPan={false}
                      strokeColor={strokeColor}
                      strokeWidth={strokeWidth}
                      defaultFill={defaultFill}
                      hoverFill={hoverFill}
                      hoverStroke={hoverStroke}
                      selectedFill={selectedFill}
                      selectedStroke={selectedStroke}
                      selectedFeatures={selectedFeatures}
                      onFeatureClick={handleFeatureClick}
                      showLabels={showLabels}
                      labelField={selectedLevel === 1 ? "NAME_1" : "NAME_2"}
                      labelColor="#ffffff"
                      labelSize={8}
                    />
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", textAlign: "center" }}>
                      💡 Wilayah Terpilih ({selectedFeatures.length}): {
                        selectedFeatures.length > 0 
                          ? selectedFeatures.map((f) => f.properties[selectedLevel === 1 ? 'NAME_1' : 'NAME_2']).join(", ")
                          : "Belum ada. Klik wilayah pada peta di atas untuk memilih."
                      }
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "red" }}>Gagal memuat aset peta.</div>
                )}
              </div>
            </div>

            <h2>Kode Penggunaan Proyeksi Props di Atas:</h2>
            <div className="code-block">
              <div className="code-header">
                <span>REACT SNIPPET</span>
                <button 
                  className="copy-btn"
                  onClick={() => handleCopy(codeString, "code-snippet")}
                >
                  {copiedText === "code-snippet" ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <pre style={{ overflowX: "auto", whiteSpace: "pre-wrap" }}>
                <code>
                  {codeString}
                </code>
              </pre>
            </div>
          </section>
        )}

        {/* SECTION: VECTOR MAP (PMTILES) */}
        {activeSection === "vector-map" && (
          <section className="doc-section">
            <h1>IndeksMapPMTiles (Vector Map)</h1>
            <p>
              Untuk merender tingkat peta yang sangat detail (seperti Kecamatan (Level 3) atau Kelurahan/Desa (Level 4)) tanpa membuat lag browser pengguna, gunakan peta vektor. Komponen <code>IndeksMapPMTiles</code> membungkus <code>MapLibre GL</code> dan protokol <code>PMTiles</code> untuk rendering peta berkinerja tinggi.
            </p>

            <h2>Contoh Penggunaan</h2>
            <p>
              Instal dependensi tambahan yang diperlukan oleh komponen peta vektor:
            </p>
            <div className="code-block">
              <span className="t-keyword">npm install</span> maplibre-gl pmtiles
            </div>

            <p>Gunakan komponen <code>IndeksMapPMTiles</code> di dalam aplikasi Anda:</p>
            
            <div className="code-block">
              <div className="code-header">
                <span>REACT TS</span>
              </div>
              <pre style={{ overflowX: "auto" }}>
                <code>
{`import { IndeksMapPMTiles } from 'indeksmaps';

function PetaKelurahan() {
  return (
    <div style={{ width: '100%', height: '500px' }}>
      <IndeksMapPMTiles
        pmtilesUrl="/IDN_level_4.pmtiles"
        styleUrl="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        zoom={11}
        center={[106.8456, -6.2088]} // Jakarta
        fillColor="#38bdf8"
        fillOpacity={0.4}
        strokeColor="#ffffff"
        strokeWidth={1}
      />
    </div>
  );
}`}
                </code>
              </pre>
            </div>
          </section>
        )}

        {/* SECTION: API REFERENCE */}
        {activeSection === "api" && (
          <section className="doc-section">
            <h1>Referensi API</h1>
            <p>
              Berikut adalah daftar properti (props) lengkap yang didukung oleh komponen utama <code>IndeksMap</code>:
            </p>

            <h2>IndeksMap Props</h2>
            <table className="prop-table">
              <thead>
                <tr>
                  <th>Prop</th>
                  <th>Tipe</th>
                  <th>Default</th>
                  <th>Deskripsi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>data</code></td>
                  <td><code>GeoJSONFeatureCollection</code></td>
                  <td><em>wajib</em></td>
                  <td>Objek data geografis GeoJSON wilayah.</td>
                </tr>
                <tr>
                  <td><code>width</code></td>
                  <td><code>number</code></td>
                  <td><code>800</code></td>
                  <td>Lebar area kanvas peta dalam piksel.</td>
                </tr>
                <tr>
                  <td><code>height</code></td>
                  <td><code>number</code></td>
                  <td><code>450</code></td>
                  <td>Tinggi area kanvas peta dalam piksel.</td>
                </tr>
                <tr>
                  <td><code>defaultFill</code></td>
                  <td><code>string</code></td>
                  <td><code>"#1e293b"</code></td>
                  <td>Warna isi default wilayah.</td>
                </tr>
                <tr>
                  <td><code>hoverFill</code></td>
                  <td><code>string</code></td>
                  <td><code>"#0ea5e9"</code></td>
                  <td>Warna isi wilayah ketika di-hover kursor mouse.</td>
                </tr>
                <tr>
                  <td><code>strokeColor</code></td>
                  <td><code>string</code></td>
                  <td><code>"#475569"</code></td>
                  <td>Warna garis batas antar wilayah.</td>
                </tr>
                <tr>
                  <td><code>strokeWidth</code></td>
                  <td><code>number</code></td>
                  <td><code>0.8</code></td>
                  <td>Ketebalan garis batas antar wilayah.</td>
                </tr>
                <tr>
                  <td><code>selectedFeatures</code></td>
                  <td><code>GeoJSONFeature[]</code></td>
                  <td><code>[]</code></td>
                  <td>Kumpulan data fitur wilayah yang sedang terpilih (multi-select).</td>
                </tr>
                <tr>
                  <td><code>showLabels</code></td>
                  <td><code>boolean</code></td>
                  <td><code>true</code></td>
                  <td>Menampilkan label nama wilayah di tengah masing-masing area.</td>
                </tr>
                <tr>
                  <td><code>onFeatureClick</code></td>
                  <td><code>(f: GeoJSONFeature) =&gt; void</code></td>
                  <td><code>undefined</code></td>
                  <td>Callback event handler yang terpanggil saat wilayah di-klik.</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}
