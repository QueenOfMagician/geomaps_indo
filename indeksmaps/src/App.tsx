import { useState, useEffect } from "react";
import { IndeksMap } from "./lib/IndeksMap";
import type { GeoJSONFeatureCollection, GeoJSONFeature } from "./lib/types";
import "./App.css";

interface RegionItem {
  code: string;
  name: string;
}

// Map GADM NAME_1 to Kemendagri Province Code (for initial load / fallback)
const GADM_TO_KEMENDAGRI_CODE: Record<string, string> = {
  "Aceh": "11",
  "Sumatera Utara": "12",
  "Sumatera Barat": "13",
  "Riau": "14",
  "Jambi": "15",
  "Sumatera Selatan": "16",
  "Bengkulu": "17",
  "Lampung": "18",
  "Kepulauan Bangka Belitung": "19",
  "Kepulauan Riau": "21",
  "Jakarta Raya": "31",
  "Jawa Barat": "32",
  "Jawa Tengah": "33",
  "Yogyakarta": "34",
  "Jawa Timur": "35",
  "Banten": "36",
  "Bali": "51",
  "Nusa Tenggara Barat": "52",
  "Nusa Tenggara Timur": "53",
  "Kalimantan Barat": "61",
  "Kalimantan Tengah": "62",
  "Kalimantan Selatan": "63",
  "Kalimantan Timur": "64",
  "Kalimantan Utara": "65",
  "Sulawesi Utara": "71",
  "Sulawesi Tengah": "72",
  "Sulawesi Selatan": "73",
  "Sulawesi Tenggara": "74",
  "Gorontalo": "75",
  "Sulawesi Barat": "76",
  "Maluku": "81",
  "Maluku Utara": "82",
  "Papua Barat": "92",
  "Papua": "91"
};

// Helper to normalize geographical names for matching GADM <-> Kemendagri
function normalizeName(name: string): string {
  if (!name) return "";
  return name.toLowerCase()
    .replace(/\s+/g, "") // Strip all whitespace
    .replace(/kabupaten/g, "")
    .replace(/kota/g, "")
    .replace(/raya/g, "")
    .replace(/daerahistimewa/g, "")
    .replace(/daerahkhususibukota/g, "")
    .replace(/specialregionof/g, "")
    .replace(/province/g, "")
    .replace(/kepulauan/g, "")
    .replace(/d\.i\./g, "")
    .replace(/d\.k\.i\./g, "")
    .trim();
}

function App() {
  // Target Level: 1 = Provinsi, 2 = Kota/Kabupaten, 3 = Kecamatan, 4 = Kelurahan/Desa
  const [targetLevel, setTargetLevel] = useState<number>(1);
  
  const [loadingMap, setLoadingMap] = useState(false);
  const [rawGeoJSON, setRawGeoJSON] = useState<GeoJSONFeatureCollection | null>(null);
  const [filteredGeoJSON, setFilteredGeoJSON] = useState<GeoJSONFeatureCollection | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null);

  // Cascading lists data states
  const [provincesList, setProvincesList] = useState<RegionItem[]>([]);
  const [regenciesList, setRegenciesList] = useState<RegionItem[]>([]);
  const [districtsList, setDistrictsList] = useState<RegionItem[]>([]);

  // Selected values states
  const [selectedProvCode, setSelectedProvCode] = useState<string>("");
  const [selectedRegCode, setSelectedRegCode] = useState<string>("");
  const [selectedDistCode, setSelectedDistCode] = useState<string>("");

  const [loadingReg, setLoadingReg] = useState(false);
  const [loadingDist, setLoadingDist] = useState(false);

  // Automatically determine the Render Scope based on selected filters and target level
  const scope = (() => {
    if (targetLevel === 1) return "indonesia";
    if (targetLevel === 2) {
      return selectedProvCode ? "provinsi" : "indonesia";
    }
    if (targetLevel === 3) {
      if (selectedRegCode) return "regency";
      if (selectedProvCode) return "provinsi";
      return "indonesia";
    }
    if (targetLevel === 4) {
      if (selectedDistCode) return "district";
      if (selectedRegCode) return "regency";
      if (selectedProvCode) return "provinsi";
      return "indonesia";
    }
    return "indonesia";
  })();

  // 1. Load Provinces list on mount
  useEffect(() => {
    fetch("/kode-wilayah/provinces.json")
      .then((res) => res.json())
      .then((data) => setProvincesList(data))
      .catch((err) => console.error("Error loading provinces:", err));
  }, []);

  // Reset dependent selections when parent selection changes
  useEffect(() => {
    setSelectedRegCode("");
    setSelectedDistCode("");
  }, [selectedProvCode]);

  useEffect(() => {
    setSelectedDistCode("");
  }, [selectedRegCode]);

  // 2. Fetch Regencies when province changes
  useEffect(() => {
    if (!selectedProvCode) {
      setRegenciesList([]);
      return;
    }
    setLoadingReg(true);
    fetch(`/kode-wilayah/provinces/${selectedProvCode}.json`)
      .then((res) => res.json())
      .then((data) => {
        setRegenciesList(data);
        setLoadingReg(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingReg(false);
      });
  }, [selectedProvCode]);

  // 3. Fetch Districts when regency changes
  useEffect(() => {
    if (!selectedRegCode || !selectedProvCode) {
      setDistrictsList([]);
      return;
    }
    setLoadingDist(true);
    fetch(`/kode-wilayah/regencies/${selectedProvCode}/${selectedRegCode}.json`)
      .then((res) => res.json())
      .then((data) => {
        setDistrictsList(data);
        setLoadingDist(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingDist(false);
      });
  }, [selectedRegCode, selectedProvCode]);

  // 4. Load GeoJSON file based on targetLevel
  useEffect(() => {
    setLoadingMap(true);
    let mapFile = "/gadm41_IDN_1.json";
    if (targetLevel === 2) mapFile = "/gadm41_IDN_2.json";
    if (targetLevel === 3) mapFile = "/gadm41_IDN_3.json";
    if (targetLevel === 4) mapFile = "/gadm41_IDN_4.json";

    fetch(mapFile)
      .then((res) => res.json())
      .then((data) => {
        setRawGeoJSON(data);
        setLoadingMap(false);
      })
      .catch((err) => {
        console.error("Error loading map GeoJSON:", err);
        setLoadingMap(false);
      });
  }, [targetLevel, scope]);

  // 5. Filter GeoJSON based on scope and selected dropdown values
  useEffect(() => {
    if (!rawGeoJSON) {
      setFilteredGeoJSON(null);
      return;
    }

    let filteredFeatures = [...rawGeoJSON.features];

    const provName = provincesList.find((p) => p.code === selectedProvCode)?.name || "";
    const regName = regenciesList.find((r) => r.code === selectedRegCode)?.name || "";
    const distName = districtsList.find((d) => d.code === selectedDistCode)?.name || "";

    if (scope === "provinsi" && selectedProvCode) {
      filteredFeatures = filteredFeatures.filter((f: any) => {
        return normalizeName(f.properties.NAME_1) === normalizeName(provName);
      });
    } else if (scope === "regency" && selectedRegCode) {
      filteredFeatures = filteredFeatures.filter((f: any) => {
        return (
          normalizeName(f.properties.NAME_1) === normalizeName(provName) &&
          normalizeName(f.properties.NAME_2) === normalizeName(regName)
        );
      });
    } else if (scope === "district" && selectedDistCode) {
      filteredFeatures = filteredFeatures.filter((f: any) => {
        return (
          normalizeName(f.properties.NAME_1) === normalizeName(provName) &&
          normalizeName(f.properties.NAME_2) === normalizeName(regName) &&
          normalizeName(f.properties.NAME_3) === normalizeName(distName)
        );
      });
    }

    setFilteredGeoJSON({
      ...rawGeoJSON,
      features: filteredFeatures
    });
    setSelectedFeature(null);
  }, [rawGeoJSON, scope, selectedProvCode, selectedRegCode, selectedDistCode, provincesList, regenciesList, districtsList]);

  // Sync click on map with dropdown selections
  const handleFeatureClick = (f: GeoJSONFeature) => {
    setSelectedFeature(f);

    if (targetLevel === 1) {
      const code = f.properties.code || GADM_TO_KEMENDAGRI_CODE[f.properties.NAME_1 || ""] || "";
      setSelectedProvCode(code);
    } else if (targetLevel === 2) {
      const provName = f.properties.NAME_1 || "";
      const regName = f.properties.NAME_2 || "";
      const provCode = GADM_TO_KEMENDAGRI_CODE[provName] || "";
      
      if (provCode) {
        setSelectedProvCode(provCode);
        fetch(`/kode-wilayah/provinces/${provCode}.json`)
          .then((res) => res.json())
          .then((list: RegionItem[]) => {
            setRegenciesList(list);
            const matchedReg = list.find((r) => normalizeName(r.name) === normalizeName(regName));
            if (matchedReg) setSelectedRegCode(matchedReg.code);
          })
          .catch(console.error);
      }
    }
  };

  // Determine current label field name in GADM GeoJSON
  const getLabelField = () => {
    if (targetLevel === 1) return "NAME_1";
    if (targetLevel === 2) return "NAME_2";
    if (targetLevel === 3) return "NAME_3";
    return "NAME_4";
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-title-group">
          <h1>IndeksMaps Filter 🗺️🎛️</h1>
          <p>Cascading Dropdown & Peta Vektor Kemendagri</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <span className="badge">Safe Load Flow</span>
          <span className="badge" style={{ backgroundColor: "#0284c7" }}>Level 1 - 4</span>
        </div>
      </header>

      <div className="main-content">
        <aside className="sidebar">
          {/* 1. Cascading Filter Dropdowns (Parent Selectors) */}
          <section className="card">
            <h2>1. Filter Wilayah</h2>

            {/* Provinsi Selector */}
            <div className="form-group">
              <label>Provinsi</label>
              <select
                value={selectedProvCode}
                onChange={(e) => setSelectedProvCode(e.target.value)}
              >
                <option value="">-- Pilih Provinsi --</option>
                {provincesList.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Kabupaten Selector */}
            <div className="form-group">
              <label>
                Kota / Kabupaten {loadingReg && <span style={{ color: "#38bdf8" }}>(Memuat...)</span>}
              </label>
              <select
                value={selectedRegCode}
                onChange={(e) => setSelectedRegCode(e.target.value)}
                disabled={!selectedProvCode || loadingReg}
              >
                <option value="">-- Pilih Kota/Kab --</option>
                {regenciesList.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Kecamatan Selector */}
            <div className="form-group">
              <label>
                Kecamatan {loadingDist && <span style={{ color: "#38bdf8" }}>(Memuat...)</span>}
              </label>
              <select
                value={selectedDistCode}
                onChange={(e) => setSelectedDistCode(e.target.value)}
                disabled={!selectedRegCode || loadingDist}
              >
                <option value="">-- Pilih Kecamatan --</option>
                {districtsList.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* 2. Target Level Selection (Moved to the end) */}
          <section className="card">
            <h2>2. Tingkat Wilayah (Level)</h2>
            <div className="form-group">
              <label>Tampilkan Geometri Peta Level:</label>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(Number(e.target.value))}
              >
                <option value={1}>Provinsi (Level 1)</option>
                <option value={2}>Kota / Kabupaten (Level 2)</option>
                <option value={3}>Kecamatan (Level 3)</option>
                <option value={4}>Kelurahan / Desa (Level 4)</option>
              </select>
            </div>
          </section>

          {/* 3. Summary / Selected details */}
          <section className="card">
            <h2>Detail Wilayah Terpilih</h2>
            {selectedFeature ? (
              <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                <strong style={{ color: "#38bdf8", display: "block", marginBottom: "8px" }}>
                  {selectedFeature.properties[getLabelField()] || "Wilayah Terpilih"}
                </strong>
                <div>Provinsi: {selectedFeature.properties.NAME_1}</div>
                {selectedFeature.properties.NAME_2 && <div>Kota/Kab: {selectedFeature.properties.NAME_2}</div>}
                {selectedFeature.properties.NAME_3 && <div>Kecamatan: {selectedFeature.properties.NAME_3}</div>}
                {selectedFeature.properties.NAME_4 && <div>Kelurahan/Desa: {selectedFeature.properties.NAME_4}</div>}
              </div>
            ) : (
              <div className="empty-state">
                Pilih filter di atas atau klik wilayah pada peta untuk melihat detail administrasi.
              </div>
            )}
          </section>
        </aside>

        {/* Map Panel */}
        <main className="map-container">
          {loadingMap ? (
            <div style={{ color: "#94a3b8" }}>Memuat geometri peta level {targetLevel}...</div>
          ) : filteredGeoJSON && filteredGeoJSON.features.length > 0 ? (
            <IndeksMap
              data={filteredGeoJSON}
              width={900}
              height={500}
              padding={16}
              enableZoomPan={false}
              showLabels={filteredGeoJSON.features.length <= 150} // Auto-hide labels if too many features to prevent lag
              labelField={getLabelField()}
              labelColor="#ffffff"
              labelSize={9.5}
              strokeColor="#475569"
              strokeWidth={0.8}
              defaultFill="#1e293b"
              hoverFill="#0ea5e9"
              hoverStroke="#38bdf8"
              selectedFill="#0284c7"
              selectedStroke="#bae6fd"
              selectedFeature={selectedFeature}
              onFeatureClick={handleFeatureClick}
              renderTooltip={(f) => (
                <div>
                  <strong style={{ display: "block", fontSize: "13px" }}>
                    {f.properties[getLabelField()]}
                  </strong>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                    {f.properties.NAME_1}
                    {f.properties.NAME_2 && ` > ${f.properties.NAME_2}`}
                  </span>
                </div>
              )}
            />
          ) : (
            <div style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>
              Silakan pilih wilayah induk di sidebar kiri untuk menampilkan peta wilayah level ini.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
