"use client";
import { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const parseJwt = (token: string) => {
  try { return JSON.parse(atob(token.split('.')[1])); }
  catch (e) { return null; }
};

export default function SellerDashboard() {
  const router = useRouter();
  const [store, setStore] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState('');

  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'ORDERS' | 'WALLET'>('PRODUCTS');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State Form Produk Baru
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', stock: '', categoryId: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // State User & Navbar
  const [userData, setUserData] = useState<any>({});
  const [activeRole, setActiveRole] = useState('');
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const decoded = parseJwt(token);
      if (decoded) {
        setUserData({ id: decoded.userId, email: decoded.email });
        setActiveRole(decoded.role || decoded.activeRole || '');
        setAvailableRoles(decoded.availableRoles || []);
      }
    }

    fetchMyStore();
    fetchCategories();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeTab === 'WALLET') fetchWalletData();
  }, [activeTab]);

  const fetchMyStore = async () => {
    try {
      const res = await api.get('/stores/me');
      setStore(res.data);
    } catch (error: any) {
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletData = async () => {
    try {
      const res = await api.get('/wallets/me');
      setWallet(res.data);
    } catch (err) {
      console.error("Gagal memuat data dompet", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories');
      setCategories(res.data);
    } catch (err) {
      console.error("Gagal memuat kategori", err);
    }
  };

  const handleSwitchRole = async (newRole: string) => {
    if (newRole === activeRole) return;
    try {
      Swal.fire({ title: 'Beralih Peran...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const res = await api.post('/auth/select-role', { userId: userData.id, activeRole: newRole });
      localStorage.setItem('accessToken', res.data.accessToken);
      Swal.close();
      router.push(res.data.redirectPath);
    } catch (err: any) {
      Swal.fire('Error', 'Gagal beralih role', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    Swal.fire('Logout Berhasil', 'Anda telah keluar.', 'success').then(() => router.push('/seapedia'));
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/stores', { name: storeName });
      Swal.fire({ title: 'Sukses!', text: 'Toko berhasil dibuat.', icon: 'success', confirmButtonColor: '#10b981' });
      setStore(res.data);
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Gagal membuat toko', 'error');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match('image.*')) {
        Swal.fire('Peringatan', 'Hanya format gambar yang diperbolehkan!', 'warning');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      Swal.fire({ title: 'Mengunggah Produk...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('description', productForm.description);
      formData.append('price', String(productForm.price));
      formData.append('stock', String(productForm.stock));

      if (productForm.categoryId) {
        formData.append('categoryId', productForm.categoryId);
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await api.post('/products', formData);

      Swal.close();
      Swal.fire({ title: 'Sukses!', text: 'Produk ditambahkan ke etalase.', icon: 'success', timer: 1500, showConfirmButton: false });

      setIsModalOpen(false);
      setProductForm({ name: '', description: '', price: '', stock: '', categoryId: '' });
      setImageFile(null);
      setImagePreview(null);
      fetchMyStore();
    } catch (error: any) {
      Swal.close();
      Swal.fire('Error', error.response?.data?.message || 'Gagal menambah produk', 'error');
    }
  };

  const handleProcessOrder = async (orderId: string) => {
    try {
      await api.put(`/orders/${orderId}/ready`);
      Swal.fire({ title: 'Pesanan Diproses', text: 'Kurir akan segera mengambil pesanan ini.', icon: 'success', confirmButtonColor: '#10b981' });
      fetchMyStore();
    } catch (err: any) {
      Swal.fire('Gagal', err.response?.data?.message || 'Gagal memproses pesanan', 'error');
    }
  };

  const userNameDisplay = userData.email?.split('@')[0] || 'User';

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;

  if (!store) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-emerald-200 flex flex-col items-center justify-center p-6">
        <div className="absolute top-0 w-full h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="bg-white p-10 max-w-md w-full rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 relative z-10 text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl mx-auto flex items-center justify-center mb-6 border border-emerald-100">
            <span className="text-4xl">🏪</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Buka Toko Anda</h1>
          <p className="text-slate-500 text-sm font-medium mb-8">Satu langkah lagi untuk mulai berjualan ke ribuan pembeli aktif.</p>
          <form onSubmit={handleCreateStore} className="space-y-4">
            <input type="text" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold text-slate-700 text-center" placeholder="Nama Toko Hebat Anda" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
            <button type="submit" className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold tracking-wide hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">Buka Toko Sekarang</button>
          </form>
          <button onClick={() => handleSwitchRole('BUYER')} className="mt-6 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Kembali Berbelanja</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 selection:bg-emerald-200">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/seapedia" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center"><span className="text-white font-black text-xl">S</span></div>
              <span className="text-xl font-black tracking-tight text-slate-900 hidden sm:block">SEAPEDIA</span>
              <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md ml-2 border border-emerald-100">SELLER</span>
            </Link>

            <div className="flex items-center gap-4 relative" ref={dropdownRef}>
              <Link href="/seapedia" className="hidden sm:block text-sm font-bold text-slate-500 hover:text-emerald-600 mr-2">Marketplace</Link>
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:shadow-sm transition-all">
                <div className="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xs uppercase">{userNameDisplay.charAt(0)}</div>
                <span className="text-sm font-bold text-slate-700 max-w-[100px] truncate">{userNameDisplay}</span>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-12 right-0 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl py-3 z-50">
                  <div className="px-4 pb-3 border-b border-slate-100 mb-2">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Peran Saat Ini</p>
                    <p className="font-bold text-emerald-600 text-sm mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {activeRole}</p>
                  </div>
                  <div className="px-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2 mb-1">Ganti Peran</p>
                    {availableRoles.map(role => (
                      <button key={role} onClick={() => handleSwitchRole(role)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex justify-between items-center ${activeRole === role ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <span>{role}</span>{activeRole === role && <span className="text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleLogout} className="w-full text-left px-5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 mt-1 border-t border-slate-50 pt-3">Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* DASHBOARD CONTENT */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">🏪 {store.name}</h1>
            <p className="text-slate-500 font-medium mt-1 ml-2">Pusat Pengelolaan Toko Anda</p>
          </div>

          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button onClick={() => setActiveTab('PRODUCTS')} className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'PRODUCTS' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}>Produk</button>
            <button onClick={() => setActiveTab('ORDERS')} className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'ORDERS' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}>
              Pesanan {store.orders?.filter((o: any) => o.status === 'SEDANG_DIKEMAS').length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1 animate-pulse">{store.orders?.filter((o: any) => o.status === 'SEDANG_DIKEMAS').length}</span>}
            </button>
            <button onClick={() => setActiveTab('WALLET')} className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'WALLET' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}>Keuangan</button>
          </div>
        </div>

        {/* TAB 1: PRODUK */}
        {activeTab === 'PRODUCTS' && (
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Katalog Produk</h2>
                <p className="text-sm text-slate-500 font-medium">Atur etalase toko Anda.</p>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500 hover:shadow-lg transition-all active:scale-95">
                + Tambah Produk
              </button>
            </div>

            {store.products?.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <span className="text-5xl mb-4 block opacity-40">📦</span>
                <h3 className="text-lg font-bold text-slate-700">Belum ada produk</h3>
                <p className="text-slate-500 text-sm mt-1">Mulai tambahkan produk pertama Anda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {store.products?.map((p: any) => (
                  <div key={p.id} className="border border-slate-100 rounded-[1.5rem] p-3 hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col bg-white">
                    <div className="h-40 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden mb-3 relative">
                      {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-4xl opacity-20">🖼️</span>}
                      {p.category && (
                        <div className="absolute top-2 right-2 bg-white/80 backdrop-blur text-[9px] font-black px-2 py-1 rounded-md text-slate-700 uppercase">
                          {p.category.name}
                        </div>
                      )}
                    </div>
                    <div className="px-1 flex flex-col flex-grow">
                      <h3 className="font-bold text-slate-800 text-sm line-clamp-1 mb-1">{p.name}</h3>
                      <div className="mt-auto flex justify-between items-end pt-3">
                        <span className="font-black text-emerald-600">Rp {Number(p.price).toLocaleString('id-ID')}</span>
                        <span className="text-[11px] bg-slate-100 px-2 py-1 rounded-md font-bold text-slate-500">Stok: {p.stock}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PESANAN */}
        {activeTab === 'ORDERS' && (
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Pesanan Masuk</h2>
            {store.orders?.length > 0 ? (
              <div className="space-y-4">
                {store.orders.map((order: any) => (
                  <div key={order.id} className="p-5 rounded-[1.5rem] border bg-white border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                      <p className="font-bold text-slate-800 text-sm mb-1">👤 {order.buyer?.name}</p>
                      <p className="text-xs font-semibold text-emerald-600">{order.status.replace(/_/g, ' ')}</p>
                    </div>
                    {order.status === 'SEDANG_DIKEMAS' && (
                      <button onClick={() => handleProcessOrder(order.id)} className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold">
                        Kemas & Panggil Kurir
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">Belum ada pesanan.</p>
            )}
          </div>
        )}

        {/* TAB 3: KEUANGAN (RESTORED & PREVENTED TRUNCATION) */}
        {activeTab === 'WALLET' && (
          <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in duration-300">
            <div className="flex flex-col justify-center bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/20">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/30 blur-[60px] rounded-full pointer-events-none"></div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10">Saldo Aktif Toko</h2>
              <p className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight relative z-10">
                Rp {wallet ? Number(wallet.balance).toLocaleString('id-ID') : '0'}
              </p>
              <button
                onClick={() => Swal.fire('Tarik Dana', 'Fitur payout ke bank sedang dalam pengkajian operasional.', 'info')}
                className="bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:bg-emerald-400 transition-all active:scale-95 relative z-10 w-fit text-sm"
              >
                Tarik Dana ke Bank
              </button>
            </div>

            <div className="flex flex-col">
              <h3 className="font-bold text-slate-900 text-lg mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm">📊</span> Mutasi Rekening
              </h3>
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {wallet?.transactions?.length > 0 ? (
                  wallet.transactions.map((tx: any) => (
                    <div key={tx.id} className="flex justify-between items-center border border-slate-100 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${tx.type === 'INCOME' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                          {tx.type === 'INCOME' ? '↓' : '↑'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm line-clamp-1">{tx.description}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <span className={`font-black text-sm whitespace-nowrap ml-2 ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'} Rp {Number(tx.amount).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 font-medium text-center py-10">Belum ada riwayat transaksi finansial.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL TAMBAH PRODUK */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 border border-slate-100 overflow-y-auto max-h-[90vh]">
              <h2 className="text-2xl font-black text-slate-900 mb-1">Tambah Produk</h2>
              <p className="text-xs text-slate-500 font-medium mb-6">Lengkapi etalase Anda dengan gambar nyata.</p>

              <form onSubmit={handleAddProduct} className="space-y-4 text-sm font-semibold text-slate-700">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider mb-2">Foto Produk (Wajib)</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 relative overflow-hidden transition-all">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-400">
                        <span className="text-2xl mb-2">📸</span>
                        <p className="text-xs font-bold">Klik untuk unggah foto</p>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} required />
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider mb-1">Nama Produk</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider mb-1">Kategori</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none" value={productForm.categoryId} onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })} required>
                    <option value="" disabled>Pilih Kategori...</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider mb-1">Deskripsi Singkat</label>
                  <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-16" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} required />
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-[10px] uppercase tracking-wider mb-1">Harga (Rp)</label>
                    <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required min="0" />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-[10px] uppercase tracking-wider mb-1">Stok Fisik</label>
                    <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} required min="1" />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => { setIsModalOpen(false); setImagePreview(null); setImageFile(null); }} className="w-1/3 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Batal</button>
                  <button type="submit" className="w-2/3 py-3 bg-slate-900 rounded-xl font-bold text-white hover:bg-emerald-500 shadow-lg transition-all active:scale-95">Upload & Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}