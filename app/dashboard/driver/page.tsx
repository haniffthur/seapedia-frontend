"use client";
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import Swal from 'sweetalert2';

export default function DriverDashboard() {
    const [availableOrders, setAvailableOrders] = useState<any[]>([]);
    const [activeDelivery, setActiveDelivery] = useState<any>(null); // Menyimpan pesanan yang sedang diantar
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAvailableDeliveries();
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
            await api.put(`/orders/${order.id}/take`);
            Swal.fire('Sukses', 'Pesanan berhasil diambil! Silakan antar ke tujuan.', 'success');
            setActiveDelivery(order); // Pindahkan ke mode sedang mengantar
            fetchAvailableDeliveries();
        } catch (err: any) {
            Swal.fire('Error', err.response?.data?.message || 'Gagal mengambil pesanan', 'error');
        }
    };

    const handleCompleteDelivery = async () => {
        if (!activeDelivery) return;
        try {
            await api.put(`/orders/${activeDelivery.id}/complete`);
            Swal.fire('Tugas Selesai!', 'Pesanan berhasil diantar sampai tujuan.', 'success');
            setActiveDelivery(null); // Reset setelah selesai
            fetchAvailableDeliveries();
        } catch (err: any) {
            Swal.fire('Error', err.response?.data?.message || 'Gagal menyelesaikan pesanan', 'error');
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Memuat Radar Kurir...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div className="border-b pb-4">
                <h1 className="text-3xl font-extrabold text-gray-800">🛵 Radar Driver</h1>
                <p className="text-gray-500 text-sm mt-1">Cari dan antar pesanan pelanggan.</p>
            </div>

            {/* PANEL AKTIF: Sedang Mengantar */}
            {activeDelivery && (
                <div className="bg-blue-50 border-2 border-blue-500 p-6 rounded-xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                        SEDANG MENGANTAR
                    </div>
                    <h2 className="text-xl font-bold text-blue-900 mb-4">Tugas Saat Ini</h2>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                        <div>
                            <p className="text-blue-700 font-bold">Ambil dari (Toko):</p>
                            <p className="text-gray-800">{activeDelivery.store.name}</p>
                        </div>
                        <div>
                            <p className="text-blue-700 font-bold">Antar ke (Pembeli):</p>
                            <p className="text-gray-800">{activeDelivery.buyer.name}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleCompleteDelivery}
                        className="w-full bg-blue-600 text-white font-extrabold py-3 rounded-lg hover:bg-blue-700 shadow-md transition"
                    >
                        ✅ Selesaikan Pengiriman
                    </button>
                </div>
            )}

            {/* PANEL TERSEDIA: Daftar Pesanan Nganggur */}
            {!activeDelivery && (
                <div className="bg-white border p-6 rounded-xl shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Pesanan Menunggu Kurir</h2>

                    {availableOrders.length > 0 ? (
                        <div className="space-y-4">
                            {availableOrders.map((order) => (
                                <div key={order.id} className="border p-4 rounded-lg bg-gray-50 flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                                                {order.deliveryMethod}
                                            </span>
                                            <span className="text-xs text-gray-400">ID: {order.id.split('-')[0]}</span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-800">Toko: {order.store.name}</p>
                                        <p className="text-sm text-gray-600">Penerima: {order.buyer.name}</p>
                                    </div>
                                    <button
                                        onClick={() => handleTakeDelivery(order)}
                                        className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm transition"
                                    >
                                        Ambil Pesanan
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <span className="text-4xl">😴</span>
                            <p className="text-gray-500 mt-2 font-medium">Belum ada pesanan yang siap dikirim.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}