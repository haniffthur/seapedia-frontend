"use client";
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Utility function untuk JWT
const parseJwt = (token: string) => {
    try { return JSON.parse(atob(token.split('.')[1])); }
    catch (e) { return null; }
};

export default function CartPage() {
    const router = useRouter();
    const [cart, setCart] = useState<any>(null);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [deliveryMethod, setDeliveryMethod] = useState('REGULAR');
    const [loading, setLoading] = useState(true);

    // State Khusus Voucher
    const [voucherInput, setVoucherInput] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
    const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

    // State User & Navbar
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [activeRole, setActiveRole] = useState('');
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);
    const [userData, setUserData] = useState<any>({});
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Setup Auth & Navbar State
        const token = localStorage.getItem('accessToken');
        if (token) {
            setIsLoggedIn(true);
            const decoded = parseJwt(token);
            if (decoded) {
                setUserData({ id: decoded.userId, email: decoded.email });
                setActiveRole(decoded.role || decoded.activeRole || '');
                setAvailableRoles(decoded.availableRoles || []);
            }
        }

        // Click outside for dropdown
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        loadCartAndCheckoutData();

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadCartAndCheckoutData = async () => {
        try {
            const [cartRes, addressRes] = await Promise.all([
                api.get('/carts'),
                api.get('/addresses')
            ]);
            setCart(cartRes.data);
            setAddresses(addressRes.data);
            if (addressRes.data.length > 0) {
                setSelectedAddress(addressRes.data[0].id);
            }
        } catch (err) {
            console.error("Gagal memuat data keranjang", err);
        } finally {
            setLoading(false);
        }
    };

    // Switch Role Handler (Sama seperti Seapedia Navbar)
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

    const handleApplyVoucher = async () => {
        if (!voucherInput.trim()) {
            Swal.fire('Info', 'Silakan masukkan kode voucher.', 'info');
            return;
        }
        const currentSubtotal = cart.items.reduce((sum: number, item: any) => sum + (Number(item.product.price) * item.quantity), 0);
        setIsCheckingVoucher(true);
        try {
            const res = await api.post('/vouchers/validate', { code: voucherInput, subtotal: currentSubtotal });
            setAppliedVoucher(res.data);
            Swal.fire({ title: 'Voucher Berhasil!', text: `Diskon Rp ${Number(res.data.discountAmount).toLocaleString('id-ID')} diterapkan.`, icon: 'success', timer: 2000, showConfirmButton: false });
        } catch (err: any) {
            setAppliedVoucher(null);
            Swal.fire('Voucher Ditolak', err.response?.data?.message || 'Kode voucher tidak valid.', 'error');
        } finally {
            setIsCheckingVoucher(false);
        }
    };

    const calculateFinancials = () => {
        if (!cart || !cart.items) return { subtotal: 0, deliveryFee: 0, ppn: 0, discount: 0, total: 0 };
        const subtotal = cart.items.reduce((sum: number, item: any) => sum + (Number(item.product.price) * item.quantity), 0);
        let deliveryFee = 10000;
        if (deliveryMethod === 'INSTANT') deliveryFee = 25000;
        if (deliveryMethod === 'NEXT_DAY') deliveryFee = 15000;
        const ppn = subtotal * 0.12;
        const discount = appliedVoucher ? Number(appliedVoucher.discountAmount) : 0;
        let total = subtotal + deliveryFee + ppn - discount;
        if (total < 0) total = 0;
        return { subtotal, deliveryFee, ppn, discount, total };
    };

    const handleCheckout = async () => {
        if (!selectedAddress) {
            Swal.fire('Peringatan', 'Silakan daftarkan alamat pengiriman di Dashboard terlebih dahulu.', 'warning');
            return;
        }
        try {
            Swal.fire({ title: 'Memproses Pembayaran...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const payload: any = { deliveryMethod, addressId: selectedAddress };
            if (appliedVoucher) payload.voucherCode = appliedVoucher.code;

            await api.post('/orders/checkout', payload);
            await Swal.fire('Sukses!', 'Pesanan Anda berhasil dibuat dan saldo dipotong.', 'success');
            router.push('/dashboard/buyer');
        } catch (err: any) {
            Swal.fire('Gagal Checkout', err.response?.data?.message || 'Terjadi kesalahan transaksi', 'error');
        }
    };

    const { subtotal, deliveryFee, ppn, discount, total } = calculateFinancials();
    const userNameDisplay = userData.email?.split('@')[0] || 'User';

    return (
        <main className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 selection:bg-emerald-200">
            {/* NAVBAR MODERN (Konsisten) */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 transition-all">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <Link href="/seapedia" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center"><span className="text-white font-black text-xl">S</span></div>
                            <span className="text-xl font-black tracking-tight text-slate-900">SEAPEDIA</span>
                        </Link>

                        <div className="flex items-center space-x-4">
                            {isLoggedIn && (
                                <div className="flex items-center gap-4 relative" ref={dropdownRef}>
                                    <Link href="/seapedia" className="text-sm font-bold text-slate-500 hover:text-emerald-600 mr-4">Kembali ke Belanja</Link>
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
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <div className="p-6 md:p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-4">

                {/* KOLOM KIRI: DAFTAR BARANG */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="border-b border-slate-200 pb-4">
                        <h1 className="text-3xl font-black text-slate-900">Keranjang Belanja</h1>
                        <p className="text-slate-500 font-medium mt-1">Selesaikan pesanan Anda sebelum kehabisan stok.</p>
                    </div>

                    {loading ? (
                        <div className="animate-pulse bg-slate-100 h-40 rounded-3xl"></div>
                    ) : !cart || !cart.items || cart.items.length === 0 ? (
                        <div className="py-20 text-center bg-white border border-dashed border-slate-300 rounded-[2rem]">
                            <span className="text-6xl block mb-4 opacity-50">🛒</span>
                            <h2 className="text-xl font-bold text-slate-700">Keranjang Masih Kosong</h2>
                            <p className="text-slate-500 text-sm mt-2 mb-6">Silakan cari produk pilihan Anda di Katalog Utama.</p>
                            <Link href="/seapedia" className="bg-emerald-500 text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-emerald-600 transition-colors">Mulai Belanja</Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-sm text-emerald-700 font-bold flex items-center gap-2">
                                <span>🏪</span> Dikirim dari: {cart.items[0]?.product?.store?.name}
                            </div>

                            {cart.items.map((item: any) => (
                                <div key={item.id} className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm flex flex-col md:flex-row gap-6 items-center">
                                    <div className="w-24 h-24 bg-slate-50 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100">
                                        {item.product.imageUrl ? <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" /> : <span className="text-3xl opacity-30">📦</span>}
                                    </div>
                                    <div className="flex-grow text-center md:text-left">
                                        <h4 className="font-bold text-slate-900 text-lg">{item.product.name}</h4>
                                        <p className="text-sm font-semibold text-slate-400 mt-1">Rp {Number(item.product.price).toLocaleString('id-ID')} <span className="text-slate-300 mx-1">x</span> {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-black text-slate-900 block">
                                            Rp {(Number(item.product.price) * item.quantity).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* KOLOM KANAN: CHECKOUT PANEL (STICKY) */}
                {cart && cart.items && cart.items.length > 0 && (
                    <div className="lg:col-span-1 sticky top-28 space-y-6">
                        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100">
                            <h3 className="font-black text-slate-900 text-xl border-b border-slate-100 pb-4 mb-6">Ringkasan Belanja</h3>

                            <div className="space-y-5 text-sm">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Alamat Pengiriman</label>
                                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-slate-700" value={selectedAddress} onChange={e => setSelectedAddress(e.target.value)}>
                                        {addresses.length === 0 && <option value="">Tidak ada alamat terdaftar</option>}
                                        {addresses.map((addr: any) => (
                                            <option key={addr.id} value={addr.id}>{addr.street}, {addr.city}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Metode Pengiriman</label>
                                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-slate-700" value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)}>
                                        <option value="REGULAR">Regular (Rp 10.000)</option>
                                        <option value="NEXT_DAY">Next Day (Rp 15.000)</option>
                                        <option value="INSTANT">Instant (Rp 25.000)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Kode Voucher</label>
                                {!appliedVoucher ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold uppercase"
                                            placeholder="KODE PROMO"
                                            value={voucherInput}
                                            onChange={e => setVoucherInput(e.target.value)}
                                        />
                                        <button
                                            onClick={handleApplyVoucher}
                                            disabled={isCheckingVoucher}
                                            className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-emerald-500 transition-colors disabled:bg-slate-300"
                                        >
                                            {isCheckingVoucher ? 'Cek..' : 'Klaim'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                                        <span className="text-sm font-bold text-emerald-700 uppercase">🎟️ {appliedVoucher.code}</span>
                                        <button onClick={() => { setAppliedVoucher(null); setVoucherInput(''); }} className="text-xs bg-white text-red-500 hover:text-white hover:bg-red-500 px-2 py-1 rounded-md font-bold transition-colors">Batal</button>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-sm font-semibold text-slate-500">
                                <div className="flex justify-between"><span>Subtotal Produk</span><span className="text-slate-900">Rp {subtotal.toLocaleString('id-ID')}</span></div>
                                <div className="flex justify-between"><span>Ongkos Kirim</span><span className="text-slate-900">Rp {deliveryFee.toLocaleString('id-ID')}</span></div>
                                <div className="flex justify-between"><span>PPN (12%)</span><span className="text-slate-900">Rp {ppn.toLocaleString('id-ID')}</span></div>

                                {discount > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg -mx-2 px-2">
                                        <span>Diskon Voucher</span><span>- Rp {discount.toLocaleString('id-ID')}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-lg font-black text-slate-900 pt-4 mt-2 border-t border-slate-200">
                                    <span>Total Tagihan</span>
                                    <span className="text-emerald-600 text-2xl">Rp {total.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                className="w-full mt-8 bg-emerald-500 text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95"
                            >
                                Bayar Pesanan
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}