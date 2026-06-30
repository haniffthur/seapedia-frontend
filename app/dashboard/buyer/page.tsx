"use client";
import { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Utility function untuk JWT
const parseJwt = (token: string) => {
  try { return JSON.parse(atob(token.split('.')[1])); }
  catch (e) { return null; }
};

export default function BuyerDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk Form Alamat Baru
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ street: '', city: '', postalCode: '' });

  // State untuk Modal Top Up Saldo
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);

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

    loadDashboardData();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch data secara paralel untuk efisiensi
      const [walletRes, addressRes, ordersRes] = await Promise.all([
        api.get('/wallets/me').catch(() => ({ data: null })), // Catch error jika dompet belum inisialisasi
        api.get('/addresses').catch(() => ({ data: [] })),
        api.get('/orders/me').catch(() => ({ data: [] }))
      ]);

      setWallet(walletRes.data);
      setAddresses(addressRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      console.error("Gagal memuat data dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/addresses', addressForm);
      Swal.fire({ title: 'Sukses!', text: 'Alamat berhasil ditambahkan.', icon: 'success', timer: 1500, showConfirmButton: false });
      setShowAddressForm(false);
      setAddressForm({ street: '', city: '', postalCode: '' });
      loadDashboardData();
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Gagal menambah alamat', 'error');
    }
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(topUpAmount);
    if (!amount || amount <= 0) {
      Swal.fire('Error', 'Masukkan nominal top up yang valid.', 'error');
      return;
    }
    try {
      setIsTopUpLoading(true);
      const res = await api.post('/wallets/topup', { amount });
      setWallet(res.data);
      setShowTopUpModal(false);
      setTopUpAmount('');
      Swal.fire({
        title: 'Top Up Berhasil!',
        text: `Saldo Rp ${amount.toLocaleString('id-ID')} telah ditambahkan ke SEAPEDIA Pay Anda.`,
        icon: 'success',
        confirmButtonColor: '#10b981',
      });
      loadDashboardData();
    } catch (error: any) {
      Swal.fire('Gagal', error.response?.data?.message || 'Gagal melakukan top up saldo', 'error');
    } finally {
      setIsTopUpLoading(false);
    }
  };

  const topUpPresets = [25000, 50000, 100000, 250000, 500000, 1000000];

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

  const userNameDisplay = userData.email?.split('@')[0] || 'User';

  // Helper untuk rendering Stepper Logistik
  const deliverySteps = [
    { key: 'SEDANG_DIKEMAS', label: 'Dikemas Toko', icon: '📦' },
    { key: 'MENUNGGU_PENGIRIM', label: 'Menunggu Kurir', icon: '🔎' },
    { key: 'SEDANG_DIKIRIM', label: 'Di Perjalanan', icon: '🛵' },
    { key: 'PESANAN_SELESAI', label: 'Tiba di Tujuan', icon: '✅' }
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;

  return (
    <main className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 selection:bg-emerald-200 pb-20">

      {/* NAVBAR MODERN */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/seapedia" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center"><span className="text-white font-black text-xl">S</span></div>
              <span className="text-xl font-black tracking-tight text-slate-900 hidden sm:block">SEAPEDIA</span>
            </Link>

            <div className="flex items-center gap-4 relative" ref={dropdownRef}>
              <Link href="/cart" className="relative p-2 text-slate-600 hover:text-emerald-600 transition-colors bg-slate-100 rounded-full hover:bg-emerald-50 mr-2">
                <span className="text-lg">🛒</span>
              </Link>
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

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8">

        {/* HEADER DASHBOARD */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">👋 Halo, {userNameDisplay}</h1>
          <p className="text-slate-500 font-medium mt-1">Pantau pesanan dan kelola akun belanja Anda di sini.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* KOLOM KIRI: INFO AKUN (WALLET & ALAMAT) */}
          <div className="lg:col-span-1 space-y-6">

            {/* KARTU WALLET */}
            <div className="bg-slate-900 rounded-[2rem] p-8 shadow-xl shadow-slate-900/10 relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/30 blur-[50px] rounded-full pointer-events-none"></div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10">SEAPEDIA PAY</h3>
              <p className="text-4xl font-black mb-6 relative z-10">
                Rp {wallet ? Number(wallet.balance).toLocaleString('id-ID') : '0'}
              </p>
              <button
                onClick={() => setShowTopUpModal(true)}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold py-3 rounded-xl transition-all relative z-10 text-sm"
              >
                + Top Up Saldo
              </button>
            </div>

            {/* KARTU ALAMAT PENGIRIMAN */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900">Alamat Pengiriman</h3>
                <button onClick={() => setShowAddressForm(!showAddressForm)} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                  {showAddressForm ? 'Batal' : '+ Alamat'}
                </button>
              </div>

              {showAddressForm ? (
                <form onSubmit={handleAddAddress} className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <input type="text" placeholder="Nama Jalan & Patokan" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={addressForm.street} onChange={e => setAddressForm({ ...addressForm, street: e.target.value })} required />
                  <div className="flex gap-2">
                    <input type="text" placeholder="Kota" className="w-2/3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} required />
                    <input type="text" placeholder="Kode Pos" className="w-1/3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={addressForm.postalCode} onChange={e => setAddressForm({ ...addressForm, postalCode: e.target.value })} required />
                  </div>
                  <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-500 transition-colors">Simpan Alamat</button>
                </form>
              ) : (
                <div className="space-y-3">
                  {addresses.length > 0 ? (
                    addresses.map((addr: any) => (
                      <div key={addr.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="font-bold text-slate-800 text-sm mb-1">{addr.street}</p>
                        <p className="text-xs text-slate-500">{addr.city}, {addr.postalCode}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 font-medium text-center py-4 border border-dashed border-slate-200 rounded-xl">Belum ada alamat tersimpan.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* KOLOM KANAN: RIWAYAT PESANAN & TRACKING TIMELINE */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Pesanan Saya</h2>

            {orders.length > 0 ? (
              <div className="space-y-6">
                {orders.map((order: any) => {
                  // Logika untuk menentukan progress stepper
                  const currentStatusIndex = deliverySteps.findIndex(step => step.key === order.status);
                  const isReturned = order.status === 'DIKEMBALIKAN';

                  return (
                    <div key={order.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all">

                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-6 gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black text-slate-400 font-mono tracking-wider">INV-{order.id.split('-')[0].toUpperCase()}</span>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider">{order.deliveryMethod.replace('_', ' ')}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-800">🏪 {order.store.name}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Belanja</p>
                          <p className="font-black text-emerald-600 text-lg">Rp {Number(order.total).toLocaleString('id-ID')}</p>
                        </div>
                      </div>

                      {/* Item List */}
                      <div className="space-y-3 mb-8">
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-lg flex-shrink-0 flex items-center justify-center border border-slate-100 overflow-hidden">
                              {item.product.imageUrl ? <img src={item.product.imageUrl} className="w-full h-full object-cover" alt="" /> : <span className="text-xl">📦</span>}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{item.product.name}</p>
                              <p className="text-xs font-semibold text-slate-400">{item.quantity} barang x Rp {Number(item.price).toLocaleString('id-ID')}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* TRACKING TIMELINE (STEPPER) */}
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative">
                        {isReturned ? (
                          <div className="flex items-center gap-3 text-red-600">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-xl">❌</div>
                            <div>
                              <p className="font-bold">Pesanan Dibatalkan / Dikembalikan</p>
                              <p className="text-xs text-red-400 font-medium mt-0.5">Dana Anda telah dikembalikan secara utuh ke saldo SEAPEDIA Pay.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col md:flex-row justify-between relative">
                            {/* Garis background stepper (Desktop) */}
                            <div className="hidden md:block absolute top-5 left-8 right-8 h-1 bg-slate-200 -z-0 rounded-full"></div>

                            {/* Garis progress (Desktop) */}
                            <div
                              className="hidden md:block absolute top-5 left-8 h-1 bg-emerald-500 -z-0 rounded-full transition-all duration-500"
                              style={{ width: `${(currentStatusIndex / (deliverySteps.length - 1)) * 100}%` }}
                            ></div>

                            {/* Render Steps */}
                            {deliverySteps.map((step, index) => {
                              const isCompleted = index <= currentStatusIndex;
                              const isCurrent = index === currentStatusIndex;

                              return (
                                <div key={step.key} className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-2 mb-4 md:mb-0">
                                  {/* Garis Vertikal untuk Mobile */}
                                  {index !== deliverySteps.length - 1 && (
                                    <div className={`md:hidden absolute left-5 top-10 w-0.5 h-full -z-0 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                                  )}

                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${isCompleted
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                    : 'bg-white text-slate-300 border-2 border-slate-200'
                                    } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}>
                                    {isCompleted ? step.icon : index + 1}
                                  </div>

                                  <div className="text-left md:text-center mt-0 md:mt-2">
                                    <p className={`text-xs font-bold uppercase tracking-wider ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                                      {step.label}
                                    </p>
                                    {isCurrent && (
                                      <p className="text-[10px] text-emerald-600 font-bold mt-0.5 animate-pulse">Sedang Proses</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-32 bg-white border border-dashed border-slate-200 rounded-[2.5rem]">
                <div className="relative inline-block mb-4">
                  <span className="text-6xl opacity-30">🛍️</span>
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-1">Belum Ada Transaksi</h3>
                <p className="text-slate-500 text-sm font-medium mb-6">Mulai belanja dan temukan barang impian Anda.</p>
                <Link href="/seapedia" className="bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all">
                  Eksplorasi Marketplace
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL TOP UP SALDO */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 border border-slate-100">
            <h2 className="text-2xl font-black text-slate-900 mb-1">Top Up SEAPEDIA Pay</h2>
            <p className="text-xs text-slate-500 font-medium mb-6">Simulasi top up saldo dompet Anda (dummy, tidak terhubung payment gateway sungguhan).</p>

            <form onSubmit={handleTopUp} className="space-y-4 text-sm font-semibold text-slate-700">
              <div>
                <label className="block text-[10px] uppercase tracking-wider mb-1">Pilih Nominal Cepat</label>
                <div className="grid grid-cols-3 gap-2">
                  {topUpPresets.map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setTopUpAmount(String(preset))}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${topUpAmount === String(preset)
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300'
                        }`}
                    >
                      {preset.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider mb-1">Atau Masukkan Nominal (Rp)</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Contoh: 100000"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowTopUpModal(false); setTopUpAmount(''); }}
                  className="w-1/3 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isTopUpLoading}
                  className="w-2/3 py-3 bg-emerald-500 rounded-xl font-bold text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-60"
                >
                  {isTopUpLoading ? 'Memproses...' : 'Top Up Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}