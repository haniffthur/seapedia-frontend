"use client";
import { useEffect, useState } from "react";
import api from '../../services/api';
import Link from "next/link";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Cek apakah user sudah login
        const token = localStorage.getItem('accessToken');
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoggedIn(!!token);

        // Muat Katalog Produk
        api.get("/products")
            .then((res) => setProducts(res.data))
            .catch((err) => console.error("Gagal load produk", err))
            .finally(() => setLoading(false));
    }, []);

    const handleAddToCart = async (productId: string) => {
        if (!isLoggedIn) {
            Swal.fire({
                title: 'Akses Ditolak',
                text: 'Anda harus login dengan akun BUYER untuk berbelanja.',
                icon: 'warning',
                confirmButtonText: 'Ke Halaman Login'
            }).then((result) => {
                if (result.isConfirmed) router.push('/login');
            });
            return;
        }

        try {
            // Default quantity 1 untuk setiap klik
            await api.post('/carts/items', { productId, quantity: 1 });

            Swal.fire({
                title: 'Berhasil!',
                text: 'Produk telah ditambahkan ke keranjang belanja Anda.',
                icon: 'success',
                showCancelButton: true,
                confirmButtonColor: '#2563eb', // Blue-600
                cancelButtonColor: '#6b7280',  // Gray-500
                confirmButtonText: 'Lihat Keranjang',
                cancelButtonText: 'Lanjut Belanja'
            }).then((result) => {
                if (result.isConfirmed) {
                    router.push('/cart');
                }
            });
        } catch (err: any) {
            // Menangkap validasi Single-Store Checkout dari backend
            Swal.fire(
                'Gagal Menambahkan',
                err.response?.data?.message || 'Terjadi kesalahan sistem.',
                'error'
            );
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        setIsLoggedIn(false);
        Swal.fire('Logout Berhasil', 'Anda telah keluar dari sistem.', 'success');
    };

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navbar Dinamis */}
            <nav className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight">SEAPEDIA</h1>
                <div className="space-x-4 flex items-center">
                    <Link href="/reviews" className="text-gray-600 hover:text-blue-600 font-medium text-sm">Review Aplikasi</Link>

                    {isLoggedIn ? (
                        <>
                            <Link href="/dashboard/buyer" className="text-gray-600 hover:text-blue-600 font-medium text-sm">Dashboard Buyer</Link>
                            <Link href="/cart" className="text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-100 px-3 py-1.5 rounded-full flex items-center gap-1">
                                🛒 Keranjang
                            </Link>
                            <button onClick={handleLogout} className="bg-red-50 text-red-600 px-4 py-2 rounded text-sm font-semibold hover:bg-red-100 transition">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-gray-600 hover:text-blue-600 font-medium text-sm">Masuk</Link>
                            <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700 transition">Daftar</Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <div className="bg-blue-600 text-white text-center py-16 px-4">
                <h2 className="text-4xl font-bold mb-4">Selamat Datang di Marketplace Masa Depan</h2>
                <p className="text-lg opacity-90 max-w-2xl mx-auto">Temukan ribuan produk dari berbagai toko, atau mulai berjualan hari ini dengan mendaftar sebagai Seller.</p>
            </div>

            {/* Katalog Produk Publik */}
            <div className="flex-grow p-8 max-w-7xl mx-auto w-full">
                <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Katalog Produk</h3>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {products.map((p: any) => (
                            <div key={p.id} className="bg-white border rounded-lg shadow-sm hover:shadow-lg transition flex flex-col h-full overflow-hidden">
                                <div className="h-40 bg-gray-100 flex items-center justify-center">
                                    <span className="text-gray-300 text-5xl">📦</span>
                                </div>
                                <div className="p-4 flex flex-col flex-grow">
                                    <div className="text-xs font-semibold text-blue-500 mb-1 uppercase tracking-wider">
                                        🏪 {p.store?.name}
                                    </div>
                                    <h4 className="font-bold text-gray-800 mb-2 line-clamp-2">{p.name}</h4>

                                    <div className="mt-auto pt-4 space-y-3 border-t">
                                        <div className="flex justify-between items-end">
                                            <p className="text-lg font-extrabold text-gray-900">Rp {Number(p.price).toLocaleString('id-ID')}</p>
                                            <p className="text-xs text-gray-500 font-medium">Stok: {p.stock}</p>
                                        </div>

                                        <button
                                            onClick={() => handleAddToCart(p.id)}
                                            disabled={p.stock < 1}
                                            className={`w-full py-2 rounded text-sm font-bold transition shadow-sm ${p.stock < 1
                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'bg-green-600 text-white hover:bg-green-700 hover:shadow'
                                                }`}
                                        >
                                            {p.stock < 1 ? 'Habis' : '+ Tambah ke Keranjang'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white border rounded-lg shadow-sm">
                        <span className="text-4xl mb-4 block">🛒</span>
                        <p className="text-gray-500 text-lg">Belum ada produk di marketplace ini.</p>
                    </div>
                )}
            </div>
        </main>
    );
}