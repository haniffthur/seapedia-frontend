"use client";
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

    const [voucherInput, setVoucherInput] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
    const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [activeRole, setActiveRole] = useState('');
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);
    const [userData, setUserData] = useState<any>({});
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            setIsLoggedIn(true);
            const decoded = parseJwt(token);
            if (decoded) {
                setUserData({ id: decoded.userId, email: decoded.email, name: decoded.name });
                setActiveRole(decoded.role || decoded.activeRole || '');
                setAvailableRoles(decoded.availableRoles || []);
            }
        }

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
            if (addressRes.data.length > 0) setSelectedAddress(addressRes.data[0].id);
        } catch (err) {
            console.error("Gagal memuat data", err);
        } finally {
            setLoading(false);
        }
    };

    // ==================== LOGIKA UPDATE & DELETE ITEM ====================
    const handleIncrease = async (item: any) => {
        if (item.quantity >= item.product.stock) return; // Mencegah melebihi stok
        try {
            await api.put(`/carts/items/${item.id}`, { quantity: item.quantity + 1 });
            loadCartAndCheckoutData(); // Refresh UI
        } catch (err: any) {
            Swal.fire('Gagal', err.response?.data?.message || 'Gagal menambah jumlah.', 'error');
        }
    };

    const handleDecrease = async (item: any) => {
        if (item.quantity > 1) {
            try {
                await api.put(`/carts/items/${item.id}`, { quantity: item.quantity - 1 });
                loadCartAndCheckoutData();
            } catch (err: any) {
                Swal.fire('Gagal', err.response?.data?.message || 'Gagal mengurangi jumlah.', 'error');
            }
        } else {
            // Jika quantity 1 dan dikurangi, tampilkan modal konfirmasi hapus
            confirmRemoveItem(item.id);
        }
    };

    const confirmRemoveItem = (itemId: string) => {
        Swal.fire({
            title: 'Hapus Produk?',
            text: "Yakin ingin menghapus produk ini dari keranjang?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0f766e', // teal-700
            cancelButtonColor: '#e2e8f0',  // slate-200
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: '<span style="color: #475569">Batal</span>', // Teks slate-600
            reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    Swal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                    await api.delete(`/carts/items/${itemId}`);
                    Swal.close();

                    // Reset voucher jika ada item yang dihapus untuk menghindari anomali harga
                    setAppliedVoucher(null);
                    setVoucherInput('');

                    loadCartAndCheckoutData();
                } catch (err: any) {
                    Swal.fire('Gagal', err.response?.data?.message || 'Gagal menghapus produk.', 'error');
                }
            }
        });
    };
    // ====================================================================

    const handleApplyVoucher = async () => {
        if (!voucherInput.trim()) return;
        const subtotal = cart.items.reduce((sum: number, item: any) => sum + (Number(item.product.price) * item.quantity), 0);
        setIsCheckingVoucher(true);
        try {
            const res = await api.post('/vouchers/validate', { code: voucherInput, subtotal });
            setAppliedVoucher(res.data);
        } catch (err: any) {
            setAppliedVoucher(null);
            Swal.fire('Voucher Ditolak', err.response?.data?.message || 'Kode tidak valid.', 'error');
        } finally {
            setIsCheckingVoucher(false);
        }
    };

    const calculateFinancials = () => {
        if (!cart || !cart.items) return { subtotal: 0, deliveryFee: 0, ppn: 0, discount: 0, total: 0 };
        const subtotal = cart.items.reduce((sum: number, item: any) => sum + (Number(item.product.price) * item.quantity), 0);
        let deliveryFee = deliveryMethod === 'INSTANT' ? 25000 : deliveryMethod === 'NEXT_DAY' ? 15000 : 10000;
        const ppn = subtotal * 0.12;
        const discount = appliedVoucher ? Number(appliedVoucher.discountAmount) : 0;
        let total = subtotal + deliveryFee + ppn - discount;
        return { subtotal, deliveryFee, ppn, discount, total: total > 0 ? total : 0 };
    };

    const handleCheckout = async () => {
        if (!selectedAddress) {
            Swal.fire('Perhatian', 'Pilih alamat pengiriman terlebih dahulu.', 'warning');
            return;
        }
        try {
            Swal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const payload: any = { deliveryMethod, addressId: selectedAddress };
            if (appliedVoucher) payload.voucherCode = appliedVoucher.code;

            await api.post('/orders/checkout', payload);
            Swal.fire({ title: 'Sukses!', text: 'Pesanan berhasil dibuat.', icon: 'success', confirmButtonColor: '#0f766e' });
            router.push('/dashboard/buyer');
        } catch (err: any) {
            Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan', 'error');
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
        } catch (err) {
            Swal.fire('Error', 'Gagal beralih role', 'error');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        router.push('/seapedia');
    };

    const { subtotal, deliveryFee, ppn, discount, total } = calculateFinancials();
    const userNameDisplay = userData.name || userData.email?.split('@')[0] || 'User';

    return (
        <main className="min-h-screen bg-slate-50 font-sans text-slate-900">

            {/* NAVBAR */}
            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-all">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 gap-8">
                        <Link href="/seapedia" className="text-xl font-black tracking-tighter text-slate-900">SEAPEDIA.</Link>

                        <div className="flex items-center space-x-6">
                            {isLoggedIn && (
                                <>
                                    <Link href="/seapedia/explore" className="hidden md:block text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">Belanja</Link>
                                    <div className="relative" ref={dropdownRef}>
                                        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="text-sm font-bold text-slate-900 hover:text-slate-600 transition-colors">
                                            {userNameDisplay}
                                        </button>

                                        {isDropdownOpen && (
                                            <div className="absolute top-10 right-0 w-56 bg-white border border-slate-200 shadow-xl rounded-2xl py-2 z-50">
                                                <div className="px-4 py-2 border-b border-slate-100 mb-2">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Peran Aktif</p>
                                                    <span className="bg-teal-50 text-teal-700 rounded-full px-2.5 py-1 text-[11px] font-bold">{activeRole}</span>
                                                </div>
                                                <div className="px-2">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 mb-1 mt-2">Ganti Peran</p>
                                                    {availableRoles.map(role => (
                                                        <button key={role} onClick={() => handleSwitchRole(role)} className={`w-full text-left px-4 py-2 text-xs font-bold rounded-xl transition-colors ${activeRole === role ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                                                            {role}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="mt-2 pt-2 border-t border-slate-100 px-2">
                                                    <Link href={`/dashboard/${activeRole.toLowerCase()}`} className="block px-4 py-2 text-xs font-bold rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">Dashboard</Link>
                                                </div>
                                                <button onClick={handleLogout} className="w-full text-left px-6 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 mt-1 border-t border-slate-100 transition-colors">Keluar</button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* KOLOM KIRI: DAFTAR BARANG */}
                <div className="lg:col-span-2 space-y-6">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-6">Keranjang Anda</h1>

                    {loading ? (
                        <div className="animate-pulse bg-white border border-slate-100 h-40 rounded-2xl"></div>
                    ) : !cart || !cart.items || cart.items.length === 0 ? (

                        /* EMPTY STATE BERDASARKAN STYLE GUIDE */
                        <div className="py-24 flex flex-col items-center justify-center bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-slate-300 mb-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                            <h2 className="text-lg font-bold text-slate-900">Keranjang kosong</h2>
                            <p className="text-sm text-slate-500 mt-1">Belum ada produk yang ditambahkan.</p>
                            <Link href="/seapedia/explore" className="mt-6 border border-slate-200 bg-white text-slate-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:border-slate-300 transition-colors">Mulai Belanja</Link>
                        </div>

                    ) : (
                        <div className="space-y-6">

                            {/* HEADER TOKO */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.999 2.999 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.999 2.999 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                                    </svg>
                                    <span className="text-sm font-bold text-slate-900">{cart.items[0]?.product?.store?.name}</span>
                                </div>
                            </div>

                            {/* ITEM LIST */}
                            {cart.items.map((item: any) => (
                                <div key={item.id} className="flex flex-col sm:flex-row gap-6 items-start py-4 border-b border-slate-100 last:border-0">
                                    <div className="w-24 h-24 bg-slate-100 rounded-2xl ring-1 ring-slate-200 flex-shrink-0 overflow-hidden">
                                        {item.product.imageUrl ? <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" /> : <span className="text-xs text-slate-400">No Image</span>}
                                    </div>

                                    <div className="flex-grow flex flex-col justify-between h-full w-full">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-slate-900 text-sm mb-1">{item.product.name}</h4>
                                                <p className="text-xs font-medium text-slate-500 mb-2">Rp {Number(item.product.price).toLocaleString('id-ID')}</p>
                                            </div>
                                            <button
                                                onClick={() => confirmRemoveItem(item.id)}
                                                className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                                title="Hapus"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="flex justify-between items-end mt-4">
                                            {/* KOMPONEN PENGATUR JUMLAH (PLUS / MINUS) */}
                                            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 w-fit">
                                                <button
                                                    onClick={() => handleDecrease(item)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
                                                </button>
                                                <span className="w-8 text-center font-bold text-xs text-slate-900 bg-white h-8 flex items-center justify-center border-l border-r border-slate-200">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => handleIncrease(item)}
                                                    disabled={item.quantity >= item.product.stock}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                                </button>
                                            </div>

                                            <span className="text-base font-black text-slate-900">
                                                Rp {(Number(item.product.price) * item.quantity).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* KOLOM KANAN: RINGKASAN */}
                {cart && cart.items && cart.items.length > 0 && (
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 md:p-8 rounded-2xl ring-1 ring-slate-200 sticky top-24">
                            <h3 className="font-bold text-slate-900 text-base mb-6">Ringkasan</h3>

                            <div className="space-y-5 text-sm mb-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Alamat</label>
                                    <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-teal-700 outline-none text-slate-600" value={selectedAddress} onChange={e => setSelectedAddress(e.target.value)}>
                                        {addresses.length === 0 && <option value="">Belum ada alamat</option>}
                                        {addresses.map((addr: any) => (
                                            <option key={addr.id} value={addr.id}>{addr.street}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Pengiriman</label>
                                    <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-teal-700 outline-none text-slate-600" value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)}>
                                        <option value="REGULAR">Regular (Rp 10.000)</option>
                                        <option value="NEXT_DAY">Next Day (Rp 15.000)</option>
                                        <option value="INSTANT">Instant (Rp 25.000)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Promo</label>
                                    {!appliedVoucher ? (
                                        <div className="flex gap-2">
                                            <input type="text" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-teal-700 outline-none text-sm uppercase" placeholder="KODE" value={voucherInput} onChange={e => setVoucherInput(e.target.value)} />
                                            <button onClick={handleApplyVoucher} disabled={isCheckingVoucher} className="bg-slate-900 text-white px-5 rounded-xl font-bold text-xs hover:bg-teal-800 transition-colors disabled:bg-slate-200 disabled:text-slate-500">Gunakan</button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center border border-slate-200 p-3 rounded-xl bg-slate-50">
                                            <span className="text-xs font-bold text-teal-700 uppercase flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-teal-600"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                                                {appliedVoucher.code}
                                            </span>
                                            <button onClick={() => { setAppliedVoucher(null); setVoucherInput(''); }} className="text-[10px] font-bold text-rose-600 hover:text-rose-700">Lepas</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 text-sm text-slate-600 pt-6 border-t border-slate-100">
                                <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold text-slate-900">Rp {subtotal.toLocaleString('id-ID')}</span></div>
                                <div className="flex justify-between"><span>Pengiriman</span><span className="font-semibold text-slate-900">Rp {deliveryFee.toLocaleString('id-ID')}</span></div>
                                <div className="flex justify-between"><span>Pajak (12%)</span><span className="font-semibold text-slate-900">Rp {ppn.toLocaleString('id-ID')}</span></div>

                                {discount > 0 && (
                                    <div className="flex justify-between text-teal-700 font-bold bg-teal-50 px-2 py-1 rounded-md">
                                        <span>Diskon</span><span>- Rp {discount.toLocaleString('id-ID')}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-200">
                                    <span className="font-bold text-slate-900">Total</span>
                                    <span className="text-xl font-black text-slate-900">Rp {total.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            <button onClick={handleCheckout} className="w-full mt-6 bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-teal-800 transition-colors shadow-sm">
                                Selesaikan Pembayaran
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}