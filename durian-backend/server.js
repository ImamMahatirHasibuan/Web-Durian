const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 5000;

// --- 1. MIDDLEWARE ---
app.use(cors()); // Mengizinkan Frontend React mengakses API
app.use(express.json()); // Mengizinkan Server membaca data JSON dari body request

// --- 2. KONEKSI DATABASE (MONGODB ATLAS) ---
// Menggunakan akun dan password yang telah kamu buat
const mongoURI = 'mongodb+srv://imamahatir:hasibuan123@cluster0.d48rhfa.mongodb.net/kebun_durian?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI)
    .then(() => console.log('Terhubung ke MongoDB Atlas Cloud ✅'))
    .catch(err => console.error('Gagal koneksi ke MongoDB Atlas ❌:', err));

// --- 3. SKEMA DATA (SCHEMA) ---
// Mendefinisikan struktur data durian agar seragam di database
const produkSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, default: 'Buah Segar' },
    image: { type: String, required: true },
    desc: { type: String, default: '' },
    rasa: { type: String, default: '' },
    warna: { type: String, default: '' },
    tekstur: { type: String, default: '' }
}, { timestamps: true }); // Menambahkan catatan waktu otomatis (createdAt)

const Produk = mongoose.model('Produk', produkSchema);

// --- 4. ROUTES (API ENDPOINTS) ---

// Jalur Utama (Untuk cek apakah server hidup)
app.get('/', (req, res) => {
    res.send('<h1>Server Kebun Durian Aktif dan Terkoneksi ke Cloud!</h1>');
});

// Jalur AMBIL DATA (GET) - Digunakan oleh halaman Katalog
app.get('/api/produk', async (req, res) => {
    try {
        const semuaProduk = await Produk.find().sort({ createdAt: -1 }); // Tampilkan yang terbaru di atas
        res.json(semuaProduk);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Gagal mengambil data dari database" });
    }
});

// Jalur TAMBAH DATA (POST) - Digunakan oleh halaman Admin
app.post('/api/produk', async (req, res) => {
    try {
        const produkBaru = new Produk(req.body);
        const hasilSimpan = await produkBaru.save();
        console.log("Berhasil simpan ke cloud:", hasilSimpan.name);
        res.status(201).json(hasilSimpan);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: "Gagal menyimpan produk. Cek kelengkapan data." });
    }
});

// Jalur HAPUS DATA (DELETE) - Tambahan fitur hapus berdasarkan ID
app.delete('/api/produk/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await Produk.findByIdAndDelete(id);
        res.json({ message: `Produk dengan ID ${id} berhasil dihapus.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Gagal menghapus produk." });
    }
});

// --- 5. MENJALANKAN SERVER ---
app.listen(PORT, () => {
    console.log(`Server Backend berjalan di: http://localhost:${PORT}`);
    console.log(`Endpoint Katalog: http://localhost:${PORT}/api/produk`);
});