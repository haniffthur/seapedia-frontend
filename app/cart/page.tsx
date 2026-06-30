"use client";
import { useState, useEffect } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

export default function CartPage() {
    const router = useRouter();
    const [cart, setCart] = useState<any>(null);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [deliveryMethod, setDeliveryMethod] = useState('REGULAR');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCartAndCheckoutData();
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

    // Hitung Finansial secara Real-time sesuai PRD Level 3
    const calculateFinancials = () => {
        if (!cart || !cart.items) return { subtotal: 0, deliveryFee: 0, ppn: 0, total: 0 };

        const subtotal = cart.items.reduce((sum: number, item: any) => {
            return sum + (Number(item.product.price) * item.quantity);
        }, 0);

        let deliveryFee = 10000; // REGULAR
        if (deliveryMethod === 'INSTANT') deliveryFee = 25000;
        if (deliveryMethod === 'NEXT_DAY') deliveryFee = 15000;

        const ppn = subtotal * 0.12; // Aturan Pajak PPN 12%
        const total = subtotal + deliveryFee + ppn;

        return { subtotal, deliveryFee, ppn, total };
    };

    const handleCheckout = async () => {
        if (!selectedAddress) {
            Swal.fire('Peringatan', 'Silakan daftarkan dan pilih alamat pengiriman terlebih dahulu di Dashboard.', 'warning');
            return;
        }

        try {
            await api.post('/orders/checkout', {
                deliveryMethod,
                addressId: selectedAddress
            });

            await Swal.fire('Sukses Transaksi!', 'Pesanan Anda berhasil dibuat dan saldo berhasil dipotong.', 'success');
            router.push('/dashboard/buyer'); // Alihkan ke history/dashboard
        } catch (err: any) {
            Swal.fire('Gagal Checkout', err.response?.data?.message || 'Terjadi kesalahan sistem transaksi', 'error');
        }
    };

    const { subtotal, deliveryFee, ppn, total } = calculateFinancials();

    if (loading) return <div className="p-10 text-center text-gray-500">Memuat Ringkasan Keranjang...</div>;

    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="p-20 text-center max-w-md mx-auto">
                <span className="text-5xl block mb-4">🛒</span>
                <h2 className="text-xl font-bold text-gray-700">Keranjang Kosong</h2>
                <p className="text-gray-500 text-sm mt-2">Silakan cari produk pilihan Anda di Katalog Utama.</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* List Item Keranjang */}
            <div className="md:col-span-2 space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Keranjang Belanja</h2>
                <div className="bg-white border rounded-xl p-4 shadow-sm text-xs text-blue-600 font-semibold mb-2">
                    🏪 Toko Penyedia: {cart.items[0]?.product?.store?.name}
                </div>

                {cart.items.map((item: any) => (
                    <div key={item.id} className="bg-white border p-4 rounded-xl shadow-sm flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-gray-800 text-base">{item.product.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                                Rp {Number(item.product.price).toLocaleString('id-ID')} x {item.quantity}
                            </p>
                        </div>
                        <span className="font-extrabold text-gray-900">
                            Rp {(Number(item.product.price) * item.quantity).toLocaleString('id-ID')}
                        </span>
                    </div>
                ))}
            </div>

            {/* Ringkasan Biaya & Checkout Panel */}
            <div className="md:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                    <h3 className="font-bold text-gray-800 text-lg border-b pb-2">Ringkasan Belanja</h3>

                    {/* Form Pengiriman */}
                    <div className="space-y-3 text-sm">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Alamat Kirim</label>
                            <select
                                className="w-full p-2 border rounded-md bg-gray-50"
                                value={selectedAddress}
                                onChange={e => setSelectedAddress(e.target.value)}
                            >
                                {addresses.map((addr: any) => (
                                    <option key={addr.id} value={addr.id}>{addr.street}, {addr.city}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Metode Opsi Kurir</label>
                            <select
                                className="w-full p-2 border rounded-md bg-gray-50"
                                value={deliveryMethod}
                                onChange={e => setDeliveryMethod(e.target.value)}
                            >
                                <option value="REGULAR">Regular (Rp 10.000)</option>
                                <option value="NEXT_DAY">Next Day (Rp 15.000)</option>
                                <option value="INSTANT">Instant (Rp 25.000)</option>
                            </select>
                        </div>
                    </div>

                    {/* Rincian Finansial Rekap */}
                    <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>Subtotal Produk</span>
                            <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Biaya Pengiriman</span>
                            <span>Rp {deliveryFee.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-red-500 font-medium">
                            <span>PPN (12%)</span>
                            <span>Rp {ppn.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-base font-extrabold text-gray-900 border-t pt-2 mt-2">
                            <span>Total Akhir</span>
                            <span>Rp {total.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        className="w-full mt-4 bg-blue-600 text-white py-2.5 rounded-lg font-bold text-sm tracking-wide hover:bg-blue-700 shadow-md transition"
                    >
                        Bayar & Selesaikan Pesanan
                    </button>
                </div>
            </div>
        </div>
    );
}