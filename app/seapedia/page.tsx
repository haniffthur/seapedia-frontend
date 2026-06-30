"use client";
import { useEffect, useState, useRef } from "react";
import api from "../../services/api";
import Link from "next/link";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

// Utility function untuk JWT
const parseJwt = (token: string) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

export default function SeapediaMarketplace() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [activeRole, setActiveRole] = useState('');
    const [userName, setUserName] = useState('');

    // State untuk Dropdown Profil
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            setIsLoggedIn(true);
            const decoded = parseJwt(token);
            if (decoded) {
                setActiveRole(decoded.role || decoded.activeRole || '');
                setUserName(decoded.email?.split('@')[0] || 'User'); // Fallback ke email prefix
            }
        }

        api.get("/products")
            .then((res) => setProducts(res.data))
            .catch((err) => console.error("Gagal load produk", err))
            .finally(() => setLoading(false));

        // Handler klik di luar dropdown untuk menutupnya
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAddToCart = async (productId: string) => {
        if (!isLoggedIn) {
            Swal.fire({
                title: 'Akses Ditolak',
                text: 'Anda harus login terlebih dahulu.',
                icon: 'warning',
                confirmButtonText: 'Ke Halaman Login'
            }).then((result) => {
                if (result.isConfirmed) router.push('/login');
            });
            return;
        }

        if (activeRole === 'SELLER') {
            Swal.fire('Akses Ditolak', 'Akun Seller tidak dapat melakukan pembelian. Silakan login sebagai Buyer.', 'warning');
            return;
        }

        try {
            await api.post('/carts/items', { productId, quantity: 1 });
            Swal.fire({
                title: 'Berhasil!',
                text: 'Produk ditambahkan ke keranjang.',
                icon: 'success',
                showCancelButton: true,
                confirmButtonColor: '#10b981', // Emerald 500
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Lihat Keranjang',
                cancelButtonText: 'Lanjut Belanja'
            }).then((result) => {
                if (result.isConfirmed) router.push('/cart');
            });
        } catch (err: any) {
            Swal.fire('Gagal Menambahkan', err.response?.data?.message || 'Terjadi kesalahan sistem.', 'error');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        setIsLoggedIn(false);
        setActiveRole('');
        setIsDropdownOpen(false);
        Swal.fire('Logout Berhasil', 'Anda telah keluar dari sistem.', 'success');
    };

    return (
        <main className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 selection:bg-emerald-200">

            {/* NAVBAR */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 transition-all">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <Link href="/seapedia" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-black text-xl">S</span>
                            </div>
                            <span className="text-xl font-black tracking-tight text-slate-900">SEAPEDIA</span>
                        </Link>

                        {/* Main Links (Center) */}
                        <div className="hidden md:flex space-x-8 text-sm font-semibold text-slate-500">
                            <Link href="#marketplace" className="hover:text-emerald-600 transition-colors">Marketplace</Link>
                            <Link href="#categories" className="hover:text-emerald-600 transition-colors">Categories</Link>
                            <Link href="#stores" className="hover:text-emerald-600 transition-colors">Stores</Link>
                            <Link href="#about" className="hover:text-emerald-600 transition-colors">About</Link>
                        </div>

                        {/* User Actions (Right) */}
                        <div className="flex items-center space-x-4">
                            {isLoggedIn ? (
                                <div className="flex items-center gap-4 relative" ref={dropdownRef}>
                                    {activeRole === 'BUYER' && (
                                        <Link href="/cart" className="relative p-2 text-slate-600 hover:text-emerald-600 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </Link>
                                    )}

                                    {/* User Profile Trigger */}
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:shadow-sm transition-all"
                                    >
                                        <div className="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                                            {userName.charAt(0)}
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 max-w-[100px] truncate">{userName}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isDropdownOpen && (
                                        <div className="absolute top-12 right-0 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl py-3 z-50">
                                            <div className="px-4 pb-3 border-b border-slate-100 mb-2">
                                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Status Aktif</p>
                                                <p className="font-bold text-emerald-600 text-sm mt-1 flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {activeRole}
                                                </p>
                                            </div>

                                            <Link href={`/dashboard/${activeRole.toLowerCase()}`} className="block px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-600">
                                                Masuk ke Dashboard
                                            </Link>

                                            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 mt-1 border-t border-slate-50 pt-3">
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-emerald-600 px-3 py-2 transition-colors">Sign In</Link>
                                    <Link href="/register" className="text-sm font-bold bg-emerald-500 text-white px-5 py-2.5 rounded-full hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95">
                                        Get Started
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                {/* Soft Emerald Glow Background */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-400/20 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="relative max-w-5xl mx-auto px-6 text-center z-10">
                    <span className="inline-block py-1.5 px-4 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold tracking-widest mb-6 border border-emerald-100">
                        L O C A L   M A R K E T P L A C E
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 mb-6 leading-[1.1]">
                        The Future of <br />
                        <span className="text-emerald-500">Marketplace</span> Commerce
                    </h1>
                    <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto mb-10 font-medium">
                        Jelajahi ribuan produk dari toko terpercaya dengan pengiriman instan. Ekosistem digital yang dirancang untuk kecepatan dan kenyamanan Anda.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="#marketplace" className="bg-emerald-500 text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-emerald-600 transition-all hover:shadow-xl hover:shadow-emerald-500/20 active:scale-95">
                            Mulai Belanja
                        </Link>
                        <Link href="#about" className="bg-white text-slate-700 border border-slate-200 font-bold text-sm px-8 py-4 rounded-full hover:bg-slate-50 transition-all">
                            Pelajari Lebih Lanjut
                        </Link>
                    </div>
                </div>
            </section>

            {/* STATS SECTION */}
            <section className="border-y border-slate-100 bg-white py-10">
                <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-around items-center gap-6 text-center">
                    <div>
                        <h3 className="text-3xl font-black text-slate-900">2M+</h3>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Active Users</p>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-900">50K+</h3>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Active Stores</p>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-900">1M+</h3>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Products</p>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-emerald-500">99.8%</h3>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Satisfaction</p>
                    </div>
                </div>
            </section>

            {/* CATEGORIES MOCKUP */}
            <section id="categories" className="py-24 bg-[#FAFAFA]">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <span className="text-xs font-bold tracking-widest text-emerald-500 uppercase bg-emerald-50 px-3 py-1 rounded-full">Explore</span>
                    <h2 className="text-3xl font-black text-slate-900 mt-4 mb-2">Shop by Category</h2>
                    <p className="text-slate-500 mb-12">Temukan produk impian Anda dalam hitungan detik.</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: '💻', name: 'Electronics', color: 'bg-blue-50' },
                            { icon: '👕', name: 'Fashion', color: 'bg-pink-50' },
                            { icon: '🏡', name: 'Home Living', color: 'bg-orange-50' },
                            { icon: '💄', name: 'Beauty', color: 'bg-purple-50' },
                            { icon: '⚽', name: 'Sports', color: 'bg-emerald-50' },
                            { icon: '🍔', name: 'Food', color: 'bg-red-50' },
                            { icon: '🚗', name: 'Automotive', color: 'bg-slate-100' },
                            { icon: '📚', name: 'Books', color: 'bg-yellow-50' }
                        ].map((cat, i) => (
                            <div key={i} className="bg-white border border-slate-100 p-6 rounded-3xl hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all cursor-pointer group flex flex-col items-center">
                                <div className={`w-14 h-14 rounded-full ${cat.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                                    {cat.icon}
                                </div>
                                <p className="font-bold text-slate-700 text-sm">{cat.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* MARKETPLACE: REAL DATA DARI BACKEND */}
            <section id="marketplace" className="py-24 bg-white relative">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900">Featured Products</h2>
                        <p className="text-slate-500 mt-2">Koleksi terbaik yang diambil langsung dari database.</p>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="animate-pulse bg-slate-50 border border-slate-100 h-96 rounded-[2rem]"></div>
                            ))}
                        </div>
                    ) : products.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {products.map((p: any) => (
                                <div key={p.id} className="group bg-white border border-slate-100 rounded-[2rem] p-3 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col h-full">

                                    {/* Image Area */}
                                    <div className="h-56 bg-slate-50 rounded-3xl relative overflow-hidden flex items-center justify-center mb-4">
                                        {p.imageUrl ? (
                                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <span className="text-6xl grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">📦</span>
                                        )}
                                        {/* Badge */}
                                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-[10px] font-black text-slate-800 px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">
                                            {p.store?.name}
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="px-2 flex flex-col flex-grow">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-slate-900 text-lg leading-tight line-clamp-2">{p.name}</h4>
                                        </div>
                                        <p className="text-xs font-semibold text-slate-400 mb-4">Stok: {p.stock}</p>

                                        <div className="mt-auto flex items-center justify-between pt-2">
                                            <p className="text-xl font-black text-emerald-600">
                                                Rp {Number(p.price).toLocaleString('id-ID')}
                                            </p>
                                            <button
                                                onClick={() => handleAddToCart(p.id)}
                                                disabled={p.stock < 1}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${p.stock < 1
                                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                        : 'bg-slate-900 text-white hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30'
                                                    }`}
                                            >
                                                {p.stock < 1 ? '✕' : '+'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-[#FAFAFA] rounded-3xl border border-dashed border-slate-200">
                            <span className="text-5xl mb-4 block opacity-40">🛍️</span>
                            <h3 className="text-xl font-bold text-slate-700">Katalog Masih Kosong</h3>
                            <p className="text-slate-500 mt-2">Daftar sebagai Seller dan mulai berjualan.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA BANNER */}
            <section className="py-24 bg-white px-6">
                <div className="max-w-5xl mx-auto bg-slate-900 rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full"></div>
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6 relative z-10">
                        Ready to Join the <span className="text-emerald-400">Future</span> of Commerce?
                    </h2>
                    <p className="text-slate-400 mb-10 max-w-lg mx-auto relative z-10">
                        Bergabunglah dengan ribuan pengguna lainnya. Mulai pengalaman belanja cerdas Anda hari ini.
                    </p>
                    <div className="flex justify-center gap-4 relative z-10">
                        <Link href="/register" className="bg-emerald-500 text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-emerald-400 transition-colors">
                            Buat Akun Gratis
                        </Link>
                        <Link href="#about" className="bg-white/10 text-white border border-white/20 font-bold text-sm px-8 py-4 rounded-full hover:bg-white/20 transition-colors">
                            Hubungi Kami
                        </Link>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer id="about" className="bg-[#0B0F19] text-slate-400 py-16 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="md:col-span-2">
                        <Link href="/seapedia" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-black text-xl">S</span>
                            </div>
                            <span className="text-xl font-black tracking-tight text-white">SEAPEDIA</span>
                        </Link>
                        <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                            Arsitektur e-commerce level enterprise yang dirancang untuk keandalan, performa, dan pengalaman pengguna tingkat tinggi. Ditenagai oleh Next.js & NestJS.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Marketplace</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Semua Produk</a></li>
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Kategori Populer</a></li>
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Promo & Diskon</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Support</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Pusat Bantuan</a></li>
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Syarat & Ketentuan</a></li>
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Kebijakan Privasi</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-sm text-center md:text-left flex flex-col md:flex-row justify-between items-center">
                    <p>&copy; {new Date().getFullYear()} Seapedia Commerce. All rights reserved.</p>
                </div>
            </footer>
        </main>
    );
}