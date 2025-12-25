import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [halaman, setHalaman] = useState('home');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [produkPilihan, setProdukPilihan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('admin') === '1' || localStorage.getItem('isAdmin') === 'true';
  });
  const [customer, setCustomer] = useState({ nama: '', telepon: '', alamat: '', catatan: '' });

  // State Form Admin
  const [formProduk, setFormProduk] = useState({
    name: '', price: '', category: 'Buah Segar', image: '', desc: '', rasa: '', warna: '', tekstur: ''
  });

  // --- 1. AMBIL DATA DARI BACKEND ---
  const ambilData = () => {
    setLoading(true);
    fetch('http://localhost:5000/api/produk')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Gagal ambil data:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    ambilData();
  }, []);

  // Simpan admin flag jika datang via query
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === '1') {
      localStorage.setItem('isAdmin', 'true');
      setIsAdmin(true);
    }
  }, []);

  // --- 2. FUNGSI SIMPAN (ADMIN) ---
  const simpanProduk = (e) => {
    e.preventDefault();
    fetch('http://localhost:5000/api/produk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formProduk)
    })
    .then(res => res.json())
    .then(data => {
      setProducts([...products, data]); 
      alert("Produk Berhasil Ditambahkan!");
      setFormProduk({ name: '', price: '', category: 'Buah Segar', image: '', desc: '', rasa: '', warna: '', tekstur: '' });
      setHalaman('katalog');
    })
    .catch(err => alert("Gagal simpan: " + err));
  };

  // --- 3. LOGIKA KERANJANG ---
  const addToCart = (p) => {
    const exist = cart.find(x => x._id === p._id);
    if (exist) {
      setCart(cart.map(x => x._id === p._id ? { ...exist, qty: exist.qty + 1 } : x));
    } else {
      setCart([...cart, { ...p, qty: 1 }]);
    }
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item._id !== id));

  // --- 3.1 KIRIM PESAN VIA WHATSAPP ---
  const WA_NUMBER = '6281276845406'; // +62 812-7684-5406 in wa.me format
  const pesanViaWhatsApp = () => {
    // Validasi data pelanggan
    if (!customer.nama || !customer.telepon || !customer.alamat) {
      alert('Mohon lengkapi Nama, Telepon, dan Alamat sebelum mengirim.');
      return;
    }
    const total = cart.reduce((a, b) => a + (b.price * b.qty), 0);
    const customerLines = [
      'Data Pemesan:',
      `Nama   : ${customer.nama}`,
      `Telepon: ${customer.telepon}`,
      `Alamat : ${customer.alamat}`,
      customer.catatan ? `Catatan: ${customer.catatan}` : null,
    ].filter(Boolean);

    const lines = [
      'Halo, saya ingin pesan durian.',
      '',
      ...customerLines,
      '',
      'Rincian Pesanan:',
      ...cart.map(item => `- ${item.name} x${item.qty} = Rp ${(item.price * item.qty).toLocaleString()}`),
      '',
      `Total: Rp ${total.toLocaleString()}`,
      '',
      'Mohon konfirmasi ketersediaan dan proses pembayaran.'
    ];
    const msg = encodeURIComponent(lines.join('\n'));
    const url = `https://wa.me/${WA_NUMBER}?text=${msg}`;
    window.open(url, '_blank');
  };

  // --- 4. KOMPONEN NAVBAR ---
  const Nav = () => (
    <nav className="navbar">
      <div className="navbar-container">
        <h2 onClick={() => setHalaman('home')} className="navbar-logo">
          🌳 KEBUN DURIAN
        </h2>
        <div className="navbar-menu">
          <button className="nav-link" onClick={() => setHalaman('home')}>Home</button>
          <button className="nav-link" onClick={() => setHalaman('katalog')}>Katalog</button>
          {isAdmin && (
            <button className="nav-link admin-link" onClick={() => setHalaman('admin')}>Admin</button>
          )}
          <button className="cart-btn" onClick={() => setHalaman('checkout')}>
            🛒 {cart.reduce((a, b) => a + b.qty, 0)}
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="app-container">
      <Nav />
      
      {loading ? <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Memuat kebun durian...</p>
      </div> : (
        <main>
          {/* HALAMAN HOME */}
          {halaman === 'home' && (
            <section className="hero-section">
              <div className="hero-content">
                <h1>Kebun Durian Asli</h1>
                <p>Durian berkualitas premium langsung dari kebun sendiri.</p>
                <button className="cta-button" onClick={() => setHalaman('katalog')}>
                  Lihat Katalog
                </button>
              </div>
            </section>
          )}
          {/* HALAMAN KATALOG */}
          {halaman === 'katalog' && (
            <section className="catalog-section">
              <div className="section-header">
                <h2>Katalog Durian</h2>
                <input 
                  type="text" 
                  className="search-input"
                  placeholder="Cari durian..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="products-grid">
                {products.map(p => (
                  <div key={p._id} className="product-card">
                    <img 
                      src={p.image} 
                      alt={p.name}
                      onError={(e) => e.target.src = 'https://via.placeholder.com/300?text=Foto+Durian'}
                      className="product-image"
                      onClick={() => { setProdukPilihan(p); setHalaman('detail'); }} 
                    />
                    <div className="product-info">
                      <h3>{p.name}</h3>
                      <p className="product-price">Rp {Number(p.price).toLocaleString()}</p>
                      <div className="product-actions">
                        <button className="add-cart-btn" onClick={() => addToCart(p)}>
                          Tambah Keranjang
                        </button>
                        <button className="detail-btn" onClick={() => { setProdukPilihan(p); setHalaman('detail'); }}>
                          Detail
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* HALAMAN ADMIN */}
          {halaman === 'admin' && isAdmin && (
            <section className="admin-section">
              <form className="admin-form" onSubmit={simpanProduk}>
                <h2 style={{ textAlign: 'center' }}>Tambah Stok Kebun</h2>
                <div className="form-group">
                  <label>Nama Produk *</label>
                  <input 
                    className="form-input"
                    placeholder="Contoh: Durian Bawor Premium" 
                    required 
                    value={formProduk.name} 
                    onChange={e => setFormProduk({...formProduk, name: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Harga (Rp) *</label>
                  <input 
                    className="form-input"
                    type="number" 
                    placeholder="100000" 
                    required 
                    value={formProduk.price} 
                    onChange={e => setFormProduk({...formProduk, price: e.target.value})} 
                  />
                </div>
                
                <div className="form-group">
                  <label>URL Gambar *</label>
                  <div className="image-tip">
                    <small>💡 Simpan foto di <b>public/assets/</b> lalu ketik: <b>/assets/namafile.jpg</b></small>
                  </div>
                  <input 
                    className="form-input"
                    placeholder="/assets/bawor.jpg" 
                    required 
                    value={formProduk.image} 
                    onChange={e => setFormProduk({...formProduk, image: e.target.value})} 
                  />
                </div>

                <div className="form-group">
                  <label>Deskripsi</label>
                  <textarea 
                    className="form-textarea"
                    placeholder="Deskripsi produk..." 
                    value={formProduk.desc} 
                    onChange={e => setFormProduk({...formProduk, desc: e.target.value})} 
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>Rasa</label>
                    <input 
                      className="form-input"
                      placeholder="Contoh: Manis, Creamy" 
                      value={formProduk.rasa} 
                      onChange={e => setFormProduk({...formProduk, rasa: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Tekstur</label>
                    <input 
                      className="form-input"
                      placeholder="Contoh: Lembut, Halus" 
                      value={formProduk.tekstur} 
                      onChange={e => setFormProduk({...formProduk, tekstur: e.target.value})} 
                    />
                  </div>
                </div>

                <button type="submit" className="submit-btn">Simpan ke Katalog</button>
              </form>
            </section>
          )}

          {/* HALAMAN CHECKOUT */}
          {halaman === 'checkout' && (
            <section className="checkout-section">
              <h2>Keranjang Belanja 🛒</h2>
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <p>Belum ada produk pilihan.</p>
                  <button className="cta-button" onClick={() => setHalaman('katalog')}>
                    Belanja Sekarang
                  </button>
                </div>
              ) : (
                <>
                  <div className="customer-form">
                    <h3>Data Pemesan</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nama *</label>
                        <input 
                          className="form-input" 
                          placeholder="Nama lengkap" 
                          value={customer.nama} 
                          onChange={(e) => setCustomer({...customer, nama: e.target.value})} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Telepon *</label>
                        <input 
                          className="form-input" 
                          placeholder="Contoh: 0812xxxxxxx" 
                          value={customer.telepon} 
                          onChange={(e) => setCustomer({...customer, telepon: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Alamat Lengkap *</label>
                      <textarea 
                        className="form-textarea" 
                        placeholder="Jalan, RT/RW, Kel/Desa, Kecamatan, Kota/Kab, Provinsi, Kode Pos" 
                        value={customer.alamat} 
                        onChange={(e) => setCustomer({...customer, alamat: e.target.value})} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Catatan (opsional)</label>
                      <input 
                        className="form-input" 
                        placeholder="Contoh: Kirim sore, tanpa duri" 
                        value={customer.catatan} 
                        onChange={(e) => setCustomer({...customer, catatan: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="cart-content">
                  {cart.map(item => (
                    <div key={item._id} className="cart-item">
                      <div className="cart-item-info">
                        <img src={item.image} alt={item.name} className="cart-item-image" />
                        <span>{item.name} (x{item.qty})</span>
                      </div>
                      <div className="cart-item-actions">
                        <span className="cart-item-price">Rp {(item.price * item.qty).toLocaleString()}</span>
                        <button className="delete-btn" onClick={() => removeFromCart(item._id)}>✕</button>
                      </div>
                    </div>
                  ))}
                  <div className="cart-total">
                    <h3>Total: Rp {cart.reduce((a, b) => a + (b.price * b.qty), 0).toLocaleString()}</h3>
                  </div>
                  <button className="whatsapp-btn" onClick={pesanViaWhatsApp}>
                    📱 Pesan via WhatsApp
                  </button>
                  </div>
                </>
              )}
            </section>
          )}

          {/* HALAMAN DETAIL */}
          {halaman === 'detail' && produkPilihan && (
            <section className="detail-section">
              <button className="back-btn" onClick={() => setHalaman('katalog')}>← Kembali</button>
              <div className="detail-container">
                <img src={produkPilihan.image} alt={produkPilihan.name} className="detail-image" />
                <div className="detail-content">
                  <h1>{produkPilihan.name}</h1>
                  <p className="detail-price">Rp {Number(produkPilihan.price).toLocaleString()}</p>
                  <div className="detail-specs">
                    <p><strong>📝 Deskripsi:</strong> {produkPilihan.desc || 'Durian pilihan kualitas terbaik.'}</p>
                    <p><strong>😋 Rasa:</strong> {produkPilihan.rasa || '-'}</p>
                    <p><strong>☁️ Tekstur:</strong> {produkPilihan.tekstur || '-'}</p>
                  </div>
                  <button className="add-cart-btn" onClick={() => addToCart(produkPilihan)}>Tambah Keranjang</button>
                </div>
              </div>
            </section>
          )}
        </main>
      )}
    </div>
  );
}

export default App;