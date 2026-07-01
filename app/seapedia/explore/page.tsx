"use client";
import { useState, useEffect } from "react";
import api from "../../../services/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ExploreMarketplace() {
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [sortBy, setSortBy] = useState<string>("NEWEST");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, catRes] = await Promise.all([
                    api.get("/products"),
                    api.get("/products/categories")
                ]);
                setProducts(prodRes.data);
                setCategories(catRes.data);
            } catch (err) {
                console.error("Gagal memuat data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter & Sort Logic
    const getFilteredProducts = () => {
        let filtered = [...products];

        if (selectedCategory !== "ALL") {
            filtered = filtered.filter(p => p.categoryId === selectedCategory);
        }

        if (sortBy === "PRICE_HIGH") {
            filtered.sort((a, b) => Number(b.price) - Number(a.price));
        } else if (sortBy === "PRICE_LOW") {
            filtered.sort((a, b) => Number(a.price) - Number(b.price));
        } else if (sortBy === "BEST_SELLING") {
            // Asumsi ada logic terjual, sementara urutkan berdasarkan stok tersedikit
            filtered.sort((a, b) => Number(a.stock) - Number(b.stock));
        }

        return filtered;
    };

    const filteredProducts = getFilteredProducts();

    const sortLabel: Record<string, string> = {
        NEWEST: "Terbaru",
        PRICE_HIGH: "Harga Tertinggi",
        PRICE_LOW: "Harga Terendah",
        BEST_SELLING: "Paling Laris",
    };

    return (
        <main className="min-h-screen bg-white font-sans text-slate-900">
            {/* NAVBAR */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 h-[68px] flex items-center justify-between">
                    <Link href="/seapedia" className="flex items-center gap-2.5 group">
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center shadow-sm shadow-teal-900/20 group-hover:shadow-teal-900/30 transition-shadow">
                            <span className="text-white font-black text-sm">S</span>
                        </span>
                        <span className="text-lg font-black tracking-tight text-slate-900">Seapedia</span>
                    </Link>
                    <div className="flex items-center gap-1 text-sm font-semibold">
                        <Link href="/seapedia" className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                            Beranda
                        </Link>
                        <Link href="/seapedia/explore" className="px-3 py-2 rounded-lg text-teal-700 bg-teal-50">
                            Eksplorasi
                        </Link>
                        <Link href="/cart" className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                            Keranjang
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 flex flex-col md:flex-row gap-10">

                {/* SIDEBAR FILTER */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    <div className="sticky top-24 space-y-8">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Kategori</h3>
                            <div className="space-y-1">
                                <button
                                    onClick={() => setSelectedCategory("ALL")}
                                    className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${selectedCategory === "ALL"
                                        ? "bg-teal-50 text-teal-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                >
                                    Semua Kategori
                                    {selectedCategory === "ALL" && (
                                        <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${selectedCategory === cat.id
                                            ? "bg-teal-50 text-teal-700"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                    >
                                        {cat.name}
                                        {selectedCategory === cat.id && (
                                            <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Urutkan</h3>
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full appearance-none bg-slate-100/70 border border-transparent rounded-xl px-3.5 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 transition-all cursor-pointer"
                                >
                                    <option value="NEWEST">Terbaru</option>
                                    <option value="PRICE_HIGH">Harga Tertinggi</option>
                                    <option value="PRICE_LOW">Harga Terendah</option>
                                    <option value="BEST_SELLING">Paling Laris</option>
                                </select>
                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* PRODUCT GRID */}
                <div className="flex-grow">
                    <div className="mb-6 flex flex-wrap justify-between items-end gap-3">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Katalog Produk</h1>
                            <p className="text-sm text-slate-500 mt-1">
                                {filteredProducts.length} produk ditemukan &middot; diurutkan berdasarkan {sortLabel[sortBy]}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                                <div key={n} className="animate-pulse">
                                    <div className="aspect-[4/5] rounded-2xl bg-slate-100 mb-4"></div>
                                    <div className="h-3 w-3/4 rounded-full bg-slate-100 mb-2"></div>
                                    <div className="h-3 w-1/2 rounded-full bg-slate-100 mb-2"></div>
                                    <div className="h-4 w-1/3 rounded-full bg-slate-100"></div>
                                </div>
                            ))}
                        </div>
                    ) : filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                            {filteredProducts.map((p: any) => {
                                const isSoldOut = p.stock < 1;
                                return (
                                    <Link key={p.id} href={`/seapedia/product/${p.id}`} className="group block">
                                        <div className="aspect-[4/5] rounded-2xl bg-slate-50 mb-4 relative overflow-hidden ring-1 ring-slate-100">
                                            {p.imageUrl ? (
                                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">No Image</div>
                                            )}
                                            {isSoldOut && (
                                                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
                                                    Habis
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">{p.store?.name}</p>
                                        <h4 className="font-semibold text-slate-900 text-sm leading-snug mb-2 line-clamp-2">{p.name}</h4>
                                        <p className="font-black text-slate-900 text-sm">Rp {Number(p.price).toLocaleString('id-ID')}</p>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-24 text-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">Tidak Ada Produk</h3>
                            <p className="text-slate-500 text-sm mt-2">Tidak ada produk yang sesuai dengan filter yang kamu pilih.</p>
                            {/* <button
                                onClick={() => { setSelectedCategory("ALL"); setSortBy("NEWEST"); }}
                                className="mt-5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-teal-800 transition-colors"
                            >
                                Reset Filter
                            </button> */}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}