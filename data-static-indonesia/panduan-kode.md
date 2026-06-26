# Kode Wilayah Indonesia (JSON)

Dataset kode wilayah administrasi Indonesia berdasarkan kode wilayah Kemendagri.

Data disusun secara hierarkis sehingga memudahkan proses cascading dropdown, pencarian wilayah, validasi alamat, maupun sinkronisasi ke database.

---

## Struktur Folder

```
data/
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
├── districts/
│   ├── 11/
│   │   ├── 11.01/
│   │   │   ├── 11.01.01.json          # Desa Kecamatan 11.01.01
│   │   │   ├── 11.01.02.json
│   │   │   └── ...
│   │   └── ...
│   └── ...
│
└── villages/
    ├── 11/
    │   ├── 11.01/
    │   │   ├── 11.01.01/
    │   │   │   ├── 11.01.01.2001.json
    │   │   │   ├── 11.01.01.2002.json
    │   │   │   └── ...
    │   │   └── ...
    │   └── ...
    └── ...
```

---

# Hirarki Wilayah

```
Indonesia
    └── Provinsi
            └── Kabupaten / Kota
                    └── Kecamatan
                            └── Desa / Kelurahan
```

Contoh:

```
32
└── Jawa Barat

32.73
└── Kota Bandung

32.73.09
└── Kecamatan Cicendo

32.73.09.1004
└── Kelurahan Pajajaran
```

---

# Format Kode Wilayah

## Provinsi

```
32
```

Panjang kode:

```
2 digit
```

Contoh

```json
{
    "code": "32",
    "name": "Jawa Barat"
}
```

---

## Kabupaten/Kota

```
32.73
```

Panjang kode

```
2 + "." + 2 digit
```

Contoh

```json
{
    "code": "32.73",
    "name": "Kota Bandung"
}
```

---

## Kecamatan

```
32.73.09
```

Panjang kode

```
2 + "." + 2 + "." + 2 digit
```

Contoh

```json
{
    "code": "32.73.09",
    "name": "Cicendo"
}
```

---

## Desa/Kelurahan

```
32.73.09.1004
```

Panjang kode

```
2 + "." + 2 + "." + 2 + "." + 4 digit
```

Contoh

```json
{
    "code": "32.73.09.1004",
    "name": "Pajajaran"
}
```

---

# Cara Penggunaan

## Mengambil daftar provinsi

```
data/provinces.json
```

Hasil

```json
[
    {
        "code": "11",
        "name": "Aceh"
    },
    {
        "code": "12",
        "name": "Sumatera Utara"
    }
]
```

---

## Mengambil daftar kabupaten

Misal memilih Provinsi Jawa Barat

```
province_code = "32"
```

Buka file

```
data/provinces/32.json
```

---

## Mengambil daftar kecamatan

Misal memilih Kota Bandung

```
regency_code = "32.73"
```

Buka

```
data/regencies/32/32.73.json
```

---

## Mengambil daftar desa

Misal memilih Kecamatan Cicendo

```
district_code = "32.73.09"
```

Buka

```
data/districts/32/32.73/32.73.09.json
```

---

# Cascading Dropdown

Urutan penggunaan

```
Provinsi
        ↓
Kabupaten/Kota
        ↓
Kecamatan
        ↓
Desa/Kelurahan
```

Flow

```
provinces.json
        │
        ▼
provinces/{province}.json
        │
        ▼
regencies/{province}/{regency}.json
        │
        ▼
districts/{province}/{regency}/{district}.json
```

---

# Contoh 

User memilih

```
Provinsi : 32
```

Backend membaca

```
data/provinces/32.json
```

Kemudian user memilih

```
Kabupaten : 32.73
```

Backend membaca

```
data/regencies/32/32.73.json
```

Kemudian user memilih

```
Kecamatan : 32.73.09
```

Backend membaca

```
data/districts/32/32.73/32.73.09.json
```

---

# Kelebihan Struktur

- Tidak memerlukan database untuk lookup sederhana.
- File yang dibaca hanya sesuai kebutuhan.
- Sangat cepat karena tidak perlu memuat seluruh data Indonesia.
- Mudah di-cache menggunakan CDN seperti jsDelivr atau Cloudflare.
- Mudah dipublikasikan melalui GitHub Pages.
- Dapat digunakan secara offline.