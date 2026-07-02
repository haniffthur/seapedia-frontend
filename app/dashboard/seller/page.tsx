"use client";
import { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';  

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

  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', stock: '', categoryId: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
        setUserData({ id: decoded.userId, email: decoded.email, name: decoded.name });
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
      Swal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
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
    router.push('/seapedia');
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/stores', { name: storeName });
      Swal.fire({ title: 'Berhasil', text: 'Toko telah dibuat.', icon: 'success', confirmButtonColor: '#0f766e' });
      setStore(res.data);
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Gagal membuat toko', 'error');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match('image.*')) {
        Swal.fire('Peringatan', 'Hanya format gambar yang diperbolehkan.', 'warning');
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
      Swal.fire({ title: 'Mengunggah...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('description', productForm.description);
      formData.append('price', String(productForm.price));
      formData.append('stock', String(productForm.stock));

      if (productForm.categoryId) formData.append('categoryId', productForm.categoryId);
      if (imageFile) formData.append('image', imageFile);

      await api.post('/products', formData);
      Swal.close();
      Swal.fire({ title: 'Berhasil!', text: 'Produk ditambahkan ke etalase.', icon: 'success', timer: 1500, showConfirmButton: false });

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
      Swal.fire({ title: 'Diproses', text: 'Kurir akan menjemput pesanan ini.', icon: 'success', confirmButtonColor: '#0f766e' });
      fetchMyStore();
    } catch (err: any) {
      Swal.fire('Gagal', err.response?.data?.message || 'Gagal memproses pesanan', 'error');
    }
  };

  const userNameDisplay = userData.name || userData.email?.split('@')[0] || 'User';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full"></div>
    </div>
  );

  // ==================== TAMPILAN JIKA BELUM PUNYA TOKO ====================
  if (!store) {
    return (
      <main className="min-h-screen bg-slate-50 font-sans flex flex-col items-center justify-center p-6 text-slate-900">
        <div className="bg-white p-10 max-w-md w-full rounded-2xl ring-1 ring-slate-200 text-center shadow-xl shadow-slate-900/5">
          <div className="w-16 h-16 bg-amber-50 text-amber-700 rounded-full mx-auto flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.999 2.999 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.999 2.999 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" /></svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Buka Toko</h1>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">Mulai perjalanan bisnis Anda dan jangkau lebih banyak pelanggan.</p>
          <form onSubmit={handleCreateStore} className="space-y-4">
            <input type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-slate-900 outline-none text-sm font-semibold text-slate-700 text-center" placeholder="Nama Brand/Toko Anda" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
            <button type="submit" className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-teal-800 transition-colors">Buat Sekarang</button>
          </form>
          <button onClick={() => handleSwitchRole('BUYER')} className="mt-6 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Kembali</button>
        </div>
      </main>
    );
  }

  // ==================== TAMPILAN UTAMA DASHBOARD ====================
  const newOrdersCount = store.orders?.filter((o: any) => o.status === 'SEDANG_DIKEMAS').length || 0;

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <Navbar />

      {/* DASHBOARD CONTENT */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.999 2.999 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.999 2.999 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" /></svg>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{store.name}</h1>
            </div>
            <p className="text-slate-500 text-sm font-medium">Panel Manajemen Operasional</p>
          </div>

          {/* TABS MINIMALIS */}
          <div className="flex gap-2 bg-white ring-1 ring-slate-200 p-1.5 rounded-xl">
            <button onClick={() => setActiveTab('PRODUCTS')} className={`px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${activeTab === 'PRODUCTS' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>Katalog</button>
            <button onClick={() => setActiveTab('ORDERS')} className={`px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'ORDERS' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
              Pesanan {newOrdersCount > 0 && <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-md text-[9px]">{newOrdersCount}</span>}
            </button>
            <button onClick={() => setActiveTab('WALLET')} className={`px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${activeTab === 'WALLET' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>Keuangan</button>
          </div>
        </div>

        {/* TAB 1: PRODUK */}
        {activeTab === 'PRODUCTS' && (
          <div className="bg-white p-6 md:p-8 rounded-2xl ring-1 ring-slate-200">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Katalog Produk</h2>
              <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-teal-800 transition-colors">
                + Tambah
              </button>
            </div>

            {store.products?.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl text-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-300 mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                <h3 className="text-base font-bold text-slate-900">Belum ada produk</h3>
                <p className="text-slate-500 text-sm mt-1">Mulai tambahkan produk pertama Anda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {store.products?.map((p: any) => (
                  <div key={p.id} className="group border border-slate-100 rounded-2xl p-3 hover:border-slate-300 transition-all flex flex-col bg-white">
                    <div className="aspect-[4/5] bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden mb-3 relative">
                      {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-xs text-slate-400">No Img</span>}
                      {p.category && (
                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur text-[9px] font-bold px-2 py-1 rounded uppercase tracking-widest text-slate-600">
                          {p.category.name}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-grow">
                      <h3 className="font-semibold text-slate-900 text-sm line-clamp-1 mb-2">{p.name}</h3>
                      <div className="mt-auto flex justify-between items-end">
                        <span className="font-black text-slate-900">Rp {Number(p.price).toLocaleString('id-ID')}</span>
                        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-md font-bold text-slate-500 uppercase tracking-widest">Stok: {p.stock}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDERS */}
        {activeTab === 'ORDERS' && (
          <div className="bg-white p-6 md:p-8 rounded-2xl ring-1 ring-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Pesanan Masuk</h2>
            {store.orders?.length > 0 ? (
              <div className="space-y-4">
                {store.orders.map((order: any) => (
                  <div key={order.id} className="p-6 rounded-2xl border bg-slate-50/50 border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="w-full md:w-auto">
                      <div className="flex items-center gap-2 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                        <p className="font-bold text-slate-900 text-sm">{order.buyer?.name}</p>
                      </div>
                      <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">{order.status.replace(/_/g, ' ')}</p>
                    </div>
                    {order.status === 'SEDANG_DIKEMAS' && (
                      <button onClick={() => handleProcessOrder(order.id)} className="w-full md:w-auto bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-teal-800 transition-colors">
                        Kemas & Panggil Kurir
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 text-sm">Belum ada pesanan aktif.</div>
            )}
          </div>
        )}

        {/* TAB 3: WALLET */}
        {activeTab === 'WALLET' && (
          <div className="bg-white p-6 md:p-10 rounded-3xl ring-1 ring-slate-200 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="flex flex-col justify-center bg-slate-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/10">
              <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/20 blur-[60px] rounded-full pointer-events-none"></div>
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10">Saldo Aktif Toko</h2>
              <p className="text-4xl font-black text-white mb-8 tracking-tight relative z-10">
                Rp {wallet ? Number(wallet.balance).toLocaleString('id-ID') : '0'}
              </p>
              <button
                onClick={() => Swal.fire('Tarik Dana', 'Fitur payout ke bank sedang dalam pengkajian operasional.', 'info')}
                className="bg-white text-slate-900 font-bold py-3.5 px-6 rounded-xl hover:bg-slate-100 transition-colors relative z-10 w-fit text-xs uppercase tracking-widest"
              >
                Tarik Dana
              </button>
            </div>

            <div className="flex flex-col">
              <h3 className="font-bold text-slate-900 text-sm mb-6 border-b border-slate-100 pb-4">Mutasi Rekening</h3>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                {wallet?.transactions?.length > 0 ? (
                  wallet.transactions.map((tx: any) => (
                    <div key={tx.id} className="flex justify-between items-center border border-slate-100 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${tx.type === 'INCOME' ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700'}`}>
                          {tx.type === 'INCOME' ? '↓' : '↑'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{tx.description}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                        </div>
                      </div>
                      <span className={`font-black text-sm whitespace-nowrap ml-2 ${tx.type === 'INCOME' ? 'text-teal-700' : 'text-slate-900'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'} Rp {Number(tx.amount).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-10">Belum ada riwayat transaksi.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL TAMBAH PRODUK */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white p-8 rounded-3xl w-full max-w-md animate-in zoom-in-95 duration-200 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-slate-900">Tambah Produk</h2>
                <button onClick={() => { setIsModalOpen(false); setImagePreview(null); setImageFile(null); }} className="text-slate-400 hover:text-slate-900">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-5">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Foto Produk</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-slate-300 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-2 opacity-70"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Unggah Foto</span>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} required />
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Nama Produk</label>
                  <input type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-slate-900 outline-none text-sm text-slate-700" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Kategori</label>
                  <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-slate-900 outline-none text-sm text-slate-700" value={productForm.categoryId} onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })} required>
                    <option value="" disabled>Pilih Kategori...</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Deskripsi Singkat</label>
                  <textarea className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-slate-900 outline-none resize-none h-20 text-sm text-slate-700" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} required />
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Harga (Rp)</label>
                    <input type="number" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-slate-900 outline-none text-sm text-slate-700" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required min="0" />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Stok Fisik</label>
                    <input type="number" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-slate-900 outline-none text-sm text-slate-700" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} required min="1" />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button type="submit" className="w-full py-3.5 bg-slate-900 rounded-xl font-bold text-xs text-white uppercase tracking-widest hover:bg-teal-800 transition-colors">Upload & Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}