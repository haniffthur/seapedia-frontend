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

    // State Khusus Voucher
    const [voucherInput, setVoucherInput] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
    const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

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

    // Logika Validasi Voucher ke Backend
    const handleApplyVoucher = async () => {
        if (!voucherInput.trim()) {
            Swal.fire('Info', 'Silakan masukkan kode voucher terlebih dahulu.', 'info');
            return;
        }

        const currentSubtotal = cart.items.reduce((sum: number, item: any) => sum + (Number(item.product.price) * item.quantity), 0);

        setIsCheckingVoucher(true);
        try {
            const res = await api.post('/vouchers/validate', {
                code: voucherInput,
                subtotal: currentSubtotal
            });

            setAppliedVoucher(res.data);
            Swal.fire({
                title: 'Voucher Berhasil!',
                text: `Anda mendapat potongan Rp ${Number(res.data.discountAmount).toLocaleString('id-ID')}`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err: any) {
            setAppliedVoucher(null);
            Swal.fire('Voucher Ditolak', err.response?.data?.message || 'Kode voucher tidak valid.', 'error');
        } finally {
            setIsCheckingVoucher(false);
        }
    };

    const removeVoucher = () => {
        setAppliedVoucher(null);
        setVoucherInput('');
    };

    // Kalkulasi Finansial Dinamis
    const calculateFinancials = () => {
        if (!cart || !cart.items) return { subtotal: 0, deliveryFee: 0, ppn: 0, discount: 0, total: 0 };

        const subtotal = cart.items.reduce((sum: number, item: any) => sum + (Number(item.product.price) * item.quantity), 0);

        let deliveryFee = 10000;
        if (deliveryMethod === 'INSTANT') deliveryFee = 25000;
        if (deliveryMethod === 'NEXT_DAY') deliveryFee = 15000;

        const ppn = subtotal * 0.12;
        const discount = appliedVoucher ? Number(appliedVoucher.discountAmount) : 0;

        let total = subtotal + deliveryFee + ppn - discount;
        if (total < 0) total = 0; // Fallback agar tidak minus

        return { subtotal, deliveryFee, ppn, discount, total };
    };

    const handleCheckout = async () => {
        if (!selectedAddress) {
            Swal.fire('Peringatan', 'Silakan daftarkan alamat pengiriman di Dashboard terlebih dahulu.', 'warning');
            return;
        }

        try {
            const payload: any = {
                deliveryMethod,
                addressId: selectedAddress
            };

            // Sisipkan kode voucher jika ada yang aktif
            if (appliedVoucher) {
                payload.voucherCode = appliedVoucher.code;
            }

            await api.post('/orders/checkout', payload);

            await Swal.fire('Sukses Transaksi!', 'Pesanan Anda berhasil dibuat dan saldo berhasil dipotong.', 'success');
            router.push('/dashboard/buyer');
        } catch (err: any) {
            Swal.fire('Gagal Checkout', err.response?.data?.message || 'Terjadi kesalahan sistem transaksi', 'error');
        }
    };

    const { subtotal, deliveryFee, ppn, discount, total } = calculateFinancials();

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
            {/* Kolom Kiri: Daftar Barang */}
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

            {/* Kolom Kanan: Checkout Panel */}
            <div className="md:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-5">
                    <h3 className="font-bold text-gray-800 text-lg border-b pb-2">Ringkasan Belanja</h3>

                    {/* Form Pengiriman */}
                    <div className="space-y-3 text-sm">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Alamat Kirim</label>
                            <select className="w-full p-2 border rounded-md bg-gray-50" value={selectedAddress} onChange={e => setSelectedAddress(e.target.value)}>
                                {addresses.map((addr: any) => (
                                    <option key={addr.id} value={addr.id}>{addr.street}, {addr.city}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Metode Opsi Kurir</label>
                            <select className="w-full p-2 border rounded-md bg-gray-50" value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)}>
                                <option value="REGULAR">Regular (Rp 10.000)</option>
                                <option value="NEXT_DAY">Next Day (Rp 15.000)</option>
                                <option value="INSTANT">Instant (Rp 25.000)</option>
                            </select>
                        </div>
                    </div>

                    {/* Form Input Voucher */}
                    <div className="pt-2">
                        <label className="block text-xs font-bold text-gray-600 mb-1">Makin Hemat dengan Promo</label>
                        {!appliedVoucher ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-md text-sm uppercase"
                                    placeholder="KODE PROMO"
                                    value={voucherInput}
                                    onChange={e => setVoucherInput(e.target.value)}
                                />
                                <button
                                    onClick={handleApplyVoucher}
                                    disabled={isCheckingVoucher}
                                    className="bg-gray-800 text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-gray-900 disabled:bg-gray-400"
                                >
                                    {isCheckingVoucher ? 'Cek...' : 'Terapkan'}
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center bg-green-50 border border-green-200 p-2 rounded-md">
                                <span className="text-sm font-bold text-green-700 uppercase">🎟️ {appliedVoucher.code} Aktif!</span>
                                <button onClick={removeVoucher} className="text-xs text-red-500 hover:text-red-700 font-bold">Batal</button>
                            </div>
                        )}
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
                        <div className="flex justify-between">
                            <span>PPN (12%)</span>
                            <span>Rp {ppn.toLocaleString('id-ID')}</span>
                        </div>

                        {/* Baris Diskon hanya muncul jika ada voucher aktif */}
                        {discount > 0 && (
                            <div className="flex justify-between text-green-600 font-bold">
                                <span>Diskon Promo</span>
                                <span>- Rp {discount.toLocaleString('id-ID')}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-base font-extrabold text-gray-900 border-t pt-3 mt-2">
                            <span>Total Akhir</span>
                            <span>Rp {total.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-bold text-sm tracking-wide hover:bg-blue-700 shadow-md transition"
                    >
                        Bayar Pesanan
                    </button>
                </div>
            </div>
        </div>
    );
}