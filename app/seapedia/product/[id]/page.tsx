"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../services/api";
import Link from "next/link";
import Swal from "sweetalert2";

export default function ProductDetail() {
    const params = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionType, setActionType] = useState<"CART" | "BUY_NOW" | null>(null);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        api.get("/products")
            .then((res) => {
                const found = res.data.find((p: any) => p.id === params.id);
                setProduct(found);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [params.id]);

    const openActionModal = (type: "CART" | "BUY_NOW") => {
        setActionType(type);
        setIsModalOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!product) return;
        setIsModalOpen(false);

        if (actionType === "CART") {
            try {
                Swal.fire({ title: 'Menambahkan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                await api.post('/carts/items', { productId: product.id, quantity });
                Swal.fire({ title: 'Berhasil!', text: 'Produk ditambahkan ke keranjang.', icon: 'success', confirmButtonColor: '#0f766e' });
            } catch (err: any) {
                Swal.fire('Error', err.response?.data?.message || 'Gagal menambahkan', 'error');
            }
        } else if (actionType === "BUY_NOW") {
            sessionStorage.setItem('buyNowItem', JSON.stringify({ product, quantity }));
            router.push('/checkout/direct');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full"></div>
        </div>
    );

    if (!product) return (
        <div className="min-h-screen flex items-center justify-center font-semibold text-slate-600">
            Produk tidak ditemukan.
        </div>
    );

    return (
        <main className="min-h-screen bg-white font-sans text-slate-900 selection:bg-teal-50 selection:text-teal-800">
            {/* NAVBAR */}
            <nav className="border-b border-slate-200 h-16 flex items-center px-6 lg:px-8 max-w-7xl mx-auto justify-between">
                <Link href="/seapedia/explore" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    Kembali
                </Link>
                <Link href="/seapedia" className="text-xl font-black tracking-tighter text-slate-900">SEAPEDIA.</Link>
            </nav>

            {/* DETAIL PRODUK */}
            <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">

                {/* Gambar Produk: rounded-2xl & ring-1 sesuai guide */}
                <div className="aspect-[4/5] bg-slate-50 rounded-2xl ring-1 ring-slate-100 overflow-hidden relative">
                    {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-2 opacity-50">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                            <span className="text-sm font-medium">Tanpa Gambar</span>
                        </div>
                    )}
                </div>

                {/* Informasi Produk */}
                <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.999 2.999 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.999 2.999 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                        </svg>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{product.store?.name}</p>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4 leading-tight">{product.name}</h1>
                    <p className="text-2xl font-black text-slate-900 mb-8">Rp {Number(product.price).toLocaleString('id-ID')}</p>

                    <div className="border-t border-b border-slate-200 py-6 mb-8">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3 text-slate-400">Deskripsi</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
                        <div className="flex items-center gap-2 mt-5">
                            <span className="bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 text-[11px] font-bold">Stok: {product.stock}</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => openActionModal("CART")}
                            className="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-600 py-3.5 rounded-xl font-bold text-sm hover:border-slate-300 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                            Keranjang
                        </button>
                        <button
                            onClick={() => openActionModal("BUY_NOW")}
                            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-teal-800 transition-colors"
                        >
                            Beli Sekarang
                        </button>
                    </div>
                </div>
            </div>

            {/* BOTTOM SHEET MODAL (rounded-t-3xl) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-white w-full sm:w-[420px] rounded-t-3xl sm:rounded-3xl p-6 md:p-8 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-200 shadow-2xl">

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-900 text-lg">Atur Jumlah</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex gap-4 mb-8">
                            <div className="w-16 h-16 bg-slate-50 rounded-xl ring-1 ring-slate-100 flex-shrink-0 overflow-hidden">
                                {product.imageUrl && <img src={product.imageUrl} className="w-full h-full object-cover" alt="thumb" />}
                            </div>
                            <div className="flex flex-col justify-center">
                                <p className="font-semibold text-sm text-slate-900 line-clamp-2 leading-snug">{product.name}</p>
                                <p className="text-sm font-black text-slate-900 mt-1">Rp {Number(product.price).toLocaleString('id-ID')}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-8">
                            <span className="text-sm font-medium text-slate-600">Kuantitas</span>
                            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                                <button
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
                                </button>
                                <span className="w-10 text-center font-bold text-sm text-slate-900 bg-white h-10 flex items-center justify-center border-l border-r border-slate-200">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleConfirmAction}
                            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-teal-800 transition-colors"
                        >
                            Lanjutkan
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}