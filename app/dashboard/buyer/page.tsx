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

export default function BuyerDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ street: '', city: '', postalCode: '' });

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
      const [walletRes, addressRes, ordersRes] = await Promise.all([
        api.get('/wallets/me').catch(() => ({ data: null })),
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
      Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      await api.post('/addresses', addressForm);
      Swal.close();
      setShowAddressForm(false);
      setAddressForm({ street: '', city: '', postalCode: '' });
      loadDashboardData();
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Gagal menambah alamat', 'error');
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

  const userNameDisplay = userData.name || userData.email?.split('@')[0] || 'User';

  const deliverySteps = [
    { key: 'SEDANG_DIKEMAS', label: 'Dikemas' },
    { key: 'MENUNGGU_PENGIRIM', label: 'Menunggu Kurir' },
    { key: 'SEDANG_DIKIRIM', label: 'Di Perjalanan' },
    { key: 'PESANAN_SELESAI', label: 'Selesai' }
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">

      <Navbar />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-12">

        {/* HEADER DASHBOARD */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Akun Saya</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola pesanan dan informasi akun Anda.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

          {/* KOLOM KIRI: INFO AKUN (WALLET & ALAMAT) */}
          <div className="lg:col-span-1 space-y-6">

            {/* KARTU WALLET (Dark Mode sesuai style guide footer-bg) */}
            <div className="bg-slate-950 rounded-3xl p-8 relative overflow-hidden text-white shadow-xl shadow-slate-900/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 blur-[50px] rounded-full pointer-events-none"></div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1 0-6h3.75m-9 0H3.375c-1.036 0-1.875.84-1.875 1.875M9 15h2.25m-2.25 0v2.25m0-2.25H3.375c-1.036 0-1.875.84-1.875 1.875v3.375c0 1.036.84 1.875 1.875 1.875h14.25c1.036 0 1.875-.84 1.875-1.875v-3.375c0-1.036-.84-1.875-1.875-1.875H15m-3-15h.008v.008H12V3.75Z" /></svg>
                SEAPEDIA PAY
              </h3>
              <p className="text-3xl font-black mb-6 relative z-10 tracking-tight">
                Rp {wallet ? Number(wallet.balance).toLocaleString('id-ID') : '0'}
              </p>
              <button
                onClick={() => Swal.fire('Info Top Up', 'Fitur Top Up Saldo sedang dalam pengembangan.', 'info')}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold py-3 rounded-xl transition-colors relative z-10 text-xs uppercase tracking-widest"
              >
                Top Up Saldo
              </button>
            </div>

            {/* KARTU ALAMAT PENGIRIMAN */}
            <div className="bg-white ring-1 ring-slate-200 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h3 className="font-bold text-slate-900 text-sm">Alamat Pengiriman</h3>
                <button onClick={() => setShowAddressForm(!showAddressForm)} className="text-[10px] font-bold text-teal-700 uppercase tracking-widest hover:text-teal-800 transition-colors">
                  {showAddressForm ? 'Tutup' : '+ Tambah'}
                </button>
              </div>

              {showAddressForm ? (
                <form onSubmit={handleAddAddress} className="space-y-4 animate-in fade-in duration-200">
                  <input type="text" placeholder="Jalan & Patokan" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-900 transition-colors" value={addressForm.street} onChange={e => setAddressForm({ ...addressForm, street: e.target.value })} required />
                  <div className="flex gap-3">
                    <input type="text" placeholder="Kota" className="w-2/3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-900 transition-colors" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} required />
                    <input type="text" placeholder="Kode Pos" className="w-1/3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-900 transition-colors" value={addressForm.postalCode} onChange={e => setAddressForm({ ...addressForm, postalCode: e.target.value })} required />
                  </div>
                  <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-teal-800 transition-colors">Simpan Alamat</button>
                </form>
              ) : (
                <div className="space-y-3">
                  {addresses.length > 0 ? (
                    addresses.map((addr: any) => (
                      <div key={addr.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="font-semibold text-slate-900 text-sm mb-1">{addr.street}</p>
                        <p className="text-xs text-slate-500">{addr.city}, {addr.postalCode}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 flex flex-col items-center justify-center bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-center">
                      <span className="text-xs font-medium text-slate-500">Belum ada alamat.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* KOLOM KANAN: RIWAYAT PESANAN */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Riwayat Pesanan</h2>

            {orders.length > 0 ? (
              <div className="space-y-6">
                {orders.map((order: any) => {
                  const currentStatusIndex = deliverySteps.findIndex(step => step.key === order.status);
                  const isReturned = order.status === 'DIKEMBALIKAN';

                  return (
                    <div key={order.id} className="bg-white ring-1 ring-slate-200 rounded-2xl p-6 sm:p-8">

                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-6 gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">INV-{order.id.split('-')[0].toUpperCase()}</span>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full uppercase tracking-widest">{order.deliveryMethod.replace('_', ' ')}</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.999 2.999 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.999 2.999 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" /></svg>
                            {order.store.name}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Belanja</p>
                          <p className="font-black text-slate-900 text-lg">Rp {Number(order.total).toLocaleString('id-ID')}</p>
                        </div>
                      </div>

                      {/* Item List */}
                      <div className="space-y-4 mb-8">
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center ring-1 ring-slate-100 overflow-hidden">
                              {item.product.imageUrl ? <img src={item.product.imageUrl} className="w-full h-full object-cover" alt="" /> : <span className="text-xs text-slate-400">No Img</span>}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-sm mb-1">{item.product.name}</p>
                              <p className="text-xs text-slate-500">{item.quantity} barang x Rp {Number(item.price).toLocaleString('id-ID')}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* TRACKING TIMELINE (STEPPER) */}
                      <div className="bg-slate-50/50 rounded-2xl p-6 ring-1 ring-slate-100 relative">
                        {isReturned ? (
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 mt-1">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">Pesanan Dibatalkan / Dikembalikan</p>
                              <p className="text-sm text-slate-600 leading-relaxed mt-1">Dana Anda telah dikembalikan secara utuh ke saldo SEAPEDIA Pay karena penjual melewati batas waktu pengemasan.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col md:flex-row justify-between relative">
                            {/* Line Base */}
                            <div className="hidden md:block absolute top-4 left-8 right-8 h-0.5 bg-slate-200 -z-0"></div>

                            {/* Line Progress */}
                            <div
                              className="hidden md:block absolute top-4 left-8 h-0.5 bg-teal-700 -z-0 transition-all duration-500"
                              style={{ width: `${(currentStatusIndex / (deliverySteps.length - 1)) * 100}%` }}
                            ></div>

                            {deliverySteps.map((step, index) => {
                              const isCompleted = index <= currentStatusIndex;
                              const isCurrent = index === currentStatusIndex;

                              return (
                                <div key={step.key} className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-3 mb-6 md:mb-0 last:mb-0">
                                  {index !== deliverySteps.length - 1 && (
                                    <div className={`md:hidden absolute left-4 top-8 w-0.5 h-full -z-0 ${isCompleted ? 'bg-teal-700' : 'bg-slate-200'}`}></div>
                                  )}

                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ring-4 ${isCompleted
                                      ? 'bg-teal-700 text-white ring-teal-50'
                                      : 'bg-white text-slate-400 ring-slate-50 border border-slate-200'
                                    }`}>
                                    {isCompleted ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                    ) : index + 1}
                                  </div>

                                  <div className="text-left md:text-center mt-0 md:mt-1">
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                                      {step.label}
                                    </p>
                                    {isCurrent && <p className="text-[10px] text-teal-600 font-semibold mt-1">Aktif</p>}
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
              /* EMPTY STATE */
              <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl text-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-300 mb-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                <h3 className="text-base font-bold text-slate-900">Belum Ada Transaksi</h3>
                <p className="text-sm text-slate-500 mt-1 mb-6">Mulai belanja dan temukan barang kurasi terbaik.</p>
                <Link href="/seapedia/explore" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-teal-800 transition-colors">
                  Eksplorasi Katalog
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}