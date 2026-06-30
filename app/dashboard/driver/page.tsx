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

export default function DriverDashboard() {
    const router = useRouter();
    const [availableOrders, setAvailableOrders] = useState<any[]>([]);
    const [activeDelivery, setActiveDelivery] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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

        fetchAvailableDeliveries();

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchAvailableDeliveries = async () => {
        try {
            const res = await api.get('/orders/deliveries/available');
            setAvailableOrders(res.data);
        } catch (err) {
            console.error("Gagal load pesanan", err);
        } finally {
            setLoading(false);
        }
    };

    const handleTakeDelivery = async (order: any) => {
        try {
            Swal.fire({ title: 'Mengunci Pesanan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            await api.put(`/orders/${order.id}/take`);
            Swal.close();
            Swal.fire({ title: 'Tugas Diambil!', text: 'Silakan ambil barang di toko dan antar ke tujuan.', icon: 'success', confirmButtonColor: '#10b981' });
            setActiveDelivery(order);
            fetchAvailableDeliveries();
        } catch (err: any) {
            Swal.fire('Error', err.response?.data?.message || 'Gagal mengambil pesanan', 'error');
        }
    };

    const handleCompleteDelivery = async () => {
        if (!activeDelivery) return;
        try {
            Swal.fire({
                title: 'Konfirmasi Penyelesaian',
                text: "Pastikan barang sudah diterima oleh pembeli.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Ya, Selesaikan!'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    Swal.fire({ title: 'Menyelesaikan Tugas...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                    await api.put(`/orders/${activeDelivery.id}/complete`);
                    Swal.close();
                    Swal.fire({ title: 'Kerja Bagus!', text: 'Tugas selesai, saldo toko telah diteruskan.', icon: 'success', timer: 2000, showConfirmButton: false });
                    setActiveDelivery(null);
                    fetchAvailableDeliveries();
                }
            });
        } catch (err: any) {
            Swal.fire('Error', err.response?.data?.message || 'Gagal menyelesaikan pesanan', 'error');
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

    const userNameDisplay = userData.email?.split('@')[0] || 'Kurir';

    return (
        <main className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 selection:bg-emerald-200 pb-20">
            {/* NAVBAR MODERN */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 transition-all">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <Link href="/seapedia" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center"><span className="text-white font-black text-xl">S</span></div>
                            <span className="text-xl font-black tracking-tight text-slate-900 hidden sm:block">SEAPEDIA</span>
                            <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md ml-2 border border-amber-100">DRIVER</span>
                        </Link>

                        <div className="flex items-center gap-4 relative" ref={dropdownRef}>
                            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:shadow-sm transition-all">
                                <div className="w-7 h-7 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold text-xs uppercase">{userNameDisplay.charAt(0)}</div>
                                <span className="text-sm font-bold text-slate-700 max-w-[100px] truncate">{userNameDisplay}</span>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute top-12 right-0 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl py-3 z-50">
                                    <div className="px-4 pb-3 border-b border-slate-100 mb-2">
                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Peran Saat Ini</p>
                                        <p className="font-bold text-amber-600 text-sm mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> {activeRole}</p>
                                    </div>
                                    <div className="px-2">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2 mb-1">Ganti Peran</p>
                                        {availableRoles.map(role => (
                                            <button key={role} onClick={() => handleSwitchRole(role)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex justify-between items-center ${activeRole === role ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}>
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

            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">

                <div className="mb-8 text-center sm:text-left">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center sm:justify-start gap-3">
                        🛵 Radar Kurir
                        <span className="relative flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                        </span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">Cari, ambil, dan antar pesanan pelanggan ke tujuan.</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500 mb-4"></div>
                        <p className="text-slate-400 font-bold animate-pulse">Memindai area sekitar...</p>
                    </div>
                ) : (
                    <div className="space-y-6">

                        {/* PANEL AKTIF: TUGAS SAAT INI */}
                        {activeDelivery && (
                            <div className="bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl shadow-slate-900/20 relative overflow-hidden transform transition-all animate-in zoom-in-95">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none"></div>
                                <div className="absolute top-6 right-6">
                                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                                        Sedang Mengantar
                                    </span>
                                </div>

                                <h2 className="text-xl font-black text-white mb-8">Detail Perjalanan</h2>

                                <div className="relative pl-8 space-y-8 mb-10">
                                    {/* Garis vertikal penghubung */}
                                    <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-700"></div>

                                    {/* Titik Jemput */}
                                    <div className="relative">
                                        <div className="absolute -left-9 top-1 w-6 h-6 bg-amber-500 rounded-full border-4 border-slate-900 flex items-center justify-center z-10"></div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ambil di Toko</p>
                                        <p className="text-lg font-bold text-white">{activeDelivery.store.name}</p>
                                        <p className="text-xs text-slate-500 mt-1 font-mono">INV-{activeDelivery.id.split('-')[0].toUpperCase()}</p>
                                    </div>

                                    {/* Titik Antar */}
                                    <div className="relative">
                                        <div className="absolute -left-9 top-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-slate-900 flex items-center justify-center z-10"></div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Antar ke Pembeli</p>
                                        <p className="text-lg font-bold text-white">{activeDelivery.buyer.name}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCompleteDelivery}
                                    className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl hover:bg-emerald-400 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 text-sm uppercase tracking-widest"
                                >
                                    ✓ Selesaikan Tugas
                                </button>
                            </div>
                        )}

                        {/* PANEL TERSEDIA: DAFTAR PESANAN NGANGGUR */}
                        {!activeDelivery && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tersedia di Sekitar Anda</h2>
                                    <span className="text-xs font-black bg-slate-200 text-slate-600 px-2 py-1 rounded-md">{availableOrders.length} Pesanan</span>
                                </div>

                                {availableOrders.length > 0 ? (
                                    availableOrders.map((order) => (
                                        <div key={order.id} className="bg-white border border-slate-100 p-5 sm:p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all group flex flex-col sm:flex-row justify-between items-center gap-6">

                                            <div className="w-full sm:w-auto flex-grow">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${order.deliveryMethod === 'INSTANT' ? 'bg-amber-100 text-amber-700' :
                                                            order.deliveryMethod === 'NEXT_DAY' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {order.deliveryMethod.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-mono font-semibold">INV-{order.id.split('-')[0].toUpperCase()}</span>
                                                </div>

                                                <div className="flex items-center gap-4 text-sm font-semibold text-slate-700">
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Dari</p>
                                                        <p className="font-bold">🏪 {order.store.name}</p>
                                                    </div>
                                                    <span className="text-slate-300">→</span>
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Ke</p>
                                                        <p className="font-bold">👤 {order.buyer.name}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleTakeDelivery(order)}
                                                className="w-full sm:w-auto bg-slate-900 text-white px-6 py-3.5 rounded-xl text-sm font-bold group-hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95 whitespace-nowrap"
                                            >
                                                Ambil Pesanan
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-24 bg-white border border-dashed border-slate-200 rounded-[2.5rem]">
                                        <div className="relative inline-block mb-4">
                                            <span className="text-6xl opacity-30">📡</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-700 mb-1">Belum Ada Pesanan</h3>
                                        <p className="text-slate-500 text-sm font-medium">Radar terus memindai. Tunggu sebentar lagi.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}