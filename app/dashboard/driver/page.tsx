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

export default function DriverDashboard() {
    const router = useRouter();
    const [wallet, setWallet] = useState<any>(null);
    const [availableDeliveries, setAvailableDeliveries] = useState<any[]>([]);
    const [myTasks, setMyTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<'RADAR' | 'TASKS' | 'WALLET'>('RADAR');

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

        fetchDashboardData();

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

    const fetchDashboardData = async () => {
        try {
            const [deliveriesRes, tasksRes] = await Promise.all([
                api.get('/orders/deliveries/available'),
                api.get('/orders/deliveries/my-tasks') // Asumsi Anda memiliki endpoint ini di backend
            ]).catch(() => [{ data: [] }, { data: [] }]);

            setAvailableDeliveries(deliveriesRes.data);
            setMyTasks(tasksRes.data);
        } catch (err) {
            console.error("Gagal memuat data", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWalletData = async () => {
        try {
            const res = await api.get('/wallets/me');
            setWallet(res.data);
        } catch (err) {
            console.error("Gagal memuat wallet", err);
        }
    };

    const handleTakeDelivery = async (orderId: string) => {
        try {
            Swal.fire({ title: 'Mengambil...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            await api.post('/orders/deliveries/take', { orderId });
            Swal.fire({ title: 'Berhasil', text: 'Tugas pengantaran ditambahkan.', icon: 'success', confirmButtonColor: '#0f766e' });
            fetchDashboardData();
            setActiveTab('TASKS');
        } catch (err: any) {
            Swal.fire('Gagal', err.response?.data?.message || 'Pesanan mungkin sudah diambil driver lain', 'error');
            fetchDashboardData();
        }
    };

    const handleCompleteDelivery = (orderId: string) => {
        Swal.fire({
            title: 'Selesaikan Tugas?',
            text: "Pastikan paket sudah diterima oleh pelanggan dengan baik.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0f766e',
            cancelButtonColor: '#e2e8f0',
            confirmButtonText: 'Ya, Selesaikan',
            cancelButtonText: '<span style="color: #475569">Batal</span>',
            reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    Swal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                    await api.post('/orders/deliveries/complete', { orderId });
                    Swal.fire({ title: 'Sukses', text: 'Pengantaran selesai. Komisi masuk ke dompet Anda.', icon: 'success', confirmButtonColor: '#0f766e' });
                    fetchDashboardData();
                } catch (err: any) {
                    Swal.fire('Gagal', err.response?.data?.message || 'Gagal menyelesaikan tugas', 'error');
                }
            }
        });
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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full"></div>
        </div>
    );

    return (
        <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
            <Navbar />

            {/* DASHBOARD CONTENT */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">

                {/* HEADER & TABS */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 border-b border-slate-200 pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-slate-900"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Logistik</h1>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Temukan, ambil, dan antar pesanan pelanggan.</p>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                        <button onClick={() => setActiveTab('RADAR')} className={`flex-shrink-0 px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors ${activeTab === 'RADAR' ? 'bg-slate-900 text-white' : 'bg-white ring-1 ring-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
                            Radar Kurir
                        </button>
                        <button onClick={() => setActiveTab('TASKS')} className={`flex-shrink-0 px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors flex items-center gap-2 ${activeTab === 'TASKS' ? 'bg-slate-900 text-white' : 'bg-white ring-1 ring-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
                            Tugas Aktif {myTasks.length > 0 && <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px]">{myTasks.length}</span>}
                        </button>
                        <button onClick={() => setActiveTab('WALLET')} className={`flex-shrink-0 px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors ${activeTab === 'WALLET' ? 'bg-slate-900 text-white' : 'bg-white ring-1 ring-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
                            Pendapatan
                        </button>
                    </div>
                </div>

                {/* TAB 1: RADAR (AVAILABLE DELIVERIES) */}
                {activeTab === 'RADAR' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-slate-900">Menunggu Penjemputan</h2>
                            <button onClick={fetchDashboardData} className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                Refresh
                            </button>
                        </div>

                        {availableDeliveries.length === 0 ? (
                            <div className="py-24 flex flex-col items-center justify-center bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl text-center">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-slate-300 relative z-10">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.424 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Z" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-bold text-slate-900">Area Anda Kosong</h3>
                                <p className="text-slate-500 text-sm mt-1">Belum ada paket yang siap dijemput. Radar terus memindai.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {availableDeliveries.map(order => (
                                    <div key={order.id} className="bg-white ring-1 ring-slate-200 rounded-2xl p-6 md:p-8 flex flex-col h-full hover:shadow-xl hover:shadow-slate-900/5 transition-all">
                                        <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ID Pesanan</p>
                                                <p className="font-bold text-slate-900 uppercase">{order.id.split('-')[0]}</p>
                                            </div>
                                            <span className="bg-slate-100 text-slate-600 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest">
                                                {order.deliveryMethod.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <div className="flex-grow space-y-5 mb-8">
                                            {/* Pick Up Point */}
                                            <div className="flex gap-4">
                                                <div className="flex flex-col items-center mt-1">
                                                    <div className="w-3 h-3 rounded-full border-2 border-slate-900 bg-white"></div>
                                                    <div className="w-px h-10 bg-slate-200 my-1"></div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Ambil Dari</p>
                                                    <p className="font-semibold text-slate-900 text-sm">{order.store?.name}</p>
                                                </div>
                                            </div>

                                            {/* Drop Point */}
                                            <div className="flex gap-4">
                                                <div className="flex flex-col items-center mt-1">
                                                    <div className="w-3 h-3 rounded-full bg-slate-900"></div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Antar Ke</p>
                                                    <p className="font-semibold text-slate-900 text-sm">{order.buyer?.name}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto border-t border-slate-100 pt-6">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Potensi Pendapatan</p>
                                                <p className="text-xl font-black text-slate-900">Rp {Number(order.deliveryFee).toLocaleString('id-ID')}</p>
                                            </div>
                                            <button
                                                onClick={() => handleTakeDelivery(order.id)}
                                                className="bg-slate-900 text-white px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-teal-800 transition-colors"
                                            >
                                                Ambil
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: TASKS (MY DELIVERIES) */}
                {activeTab === 'TASKS' && (
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-6">Sedang Diantar</h2>
                        {myTasks.length === 0 ? (
                            <div className="py-24 flex flex-col items-center justify-center bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-300 mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
                                <h3 className="text-base font-bold text-slate-900">Tidak ada tugas aktif</h3>
                                <p className="text-slate-500 text-sm mt-1">Ambil pesanan dari Radar Kurir.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {myTasks.map(order => (
                                    <div key={order.id} className="bg-white ring-1 ring-slate-200 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden">

                                        {/* Aksen Status Biru di sisi kiri */}
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600"></div>

                                        <div className="flex-grow space-y-4 w-full">
                                            <div className="flex justify-between md:justify-start items-center gap-4 border-b border-slate-100 md:border-0 pb-4 md:pb-0">
                                                <p className="font-bold text-slate-900 text-lg uppercase tracking-tight">INV-{order.id.split('-')[0]}</p>
                                                <span className="bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                                                    Di Perjalanan
                                                </span>
                                            </div>

                                            <div className="flex flex-col md:flex-row gap-6 md:gap-12 mt-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Penerima</p>
                                                    <p className="font-semibold text-slate-900 text-sm">{order.buyer?.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Toko Pengirim</p>
                                                    <p className="font-semibold text-slate-900 text-sm">{order.store?.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Komisi</p>
                                                    <p className="font-black text-slate-900 text-sm">Rp {Number(order.deliveryFee).toLocaleString('id-ID')}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleCompleteDelivery(order.id)}
                                            className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-teal-800 transition-colors shadow-lg shadow-slate-900/10 flex-shrink-0"
                                        >
                                            Selesaikan Antaran
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: WALLET */}
                {activeTab === 'WALLET' && (
                    <div className="bg-white p-6 md:p-10 rounded-3xl ring-1 ring-slate-200 grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="flex flex-col justify-center bg-slate-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/10">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 blur-[60px] rounded-full pointer-events-none"></div>
                            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.375c0 .621-.504 1.125-1.125 1.125H2.25m17.25-3h-2.25a2.25 2.25 0 0 0-2.25 2.25v.916m0 0a48.846 48.846 0 0 1-15.166 0v-.916c0-1.18.91-2.164 2.09-2.201a51.964 51.964 0 0 0 3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                Saldo Komisi
                            </h2>
                            <p className="text-4xl font-black text-white mb-8 tracking-tight relative z-10">
                                Rp {wallet ? Number(wallet.balance).toLocaleString('id-ID') : '0'}
                            </p>
                            <button
                                onClick={() => Swal.fire('Tarik Dana', 'Pencairan komisi akan ditransfer otomatis setiap hari Jumat.', 'info')}
                                className="bg-white text-slate-900 font-bold py-3.5 px-6 rounded-xl hover:bg-slate-100 transition-colors relative z-10 w-fit text-xs uppercase tracking-widest"
                            >
                                Cairkan Komisi
                            </button>
                        </div>

                        <div className="flex flex-col">
                            <h3 className="font-bold text-slate-900 text-sm mb-6 border-b border-slate-100 pb-4">Riwayat Pendapatan</h3>
                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                                {wallet?.transactions?.length > 0 ? (
                                    wallet.transactions.map((tx: any) => (
                                        <div key={tx.id} className="flex justify-between items-center border border-slate-100 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${tx.type === 'INCOME' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {tx.type === 'INCOME' ? '↓' : '↑'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">{tx.description}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                                                </div>
                                            </div>
                                            <span className={`font-black text-sm whitespace-nowrap ml-2 ${tx.type === 'INCOME' ? 'text-blue-700' : 'text-slate-900'}`}>
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
            </div>
        </main>
    );
}