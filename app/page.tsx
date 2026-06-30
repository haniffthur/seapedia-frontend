"use client";
import { useEffect, useState } from "react";
import api from "../services/api";
import Link from "next/link";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Memanggil endpoint publik yang kita buat di backend sebelumnya
    api.get("/products")
      .then((res) => {
        setProducts(res.data);
      })
      .catch((err) => console.error("Gagal load produk", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar Minimalis */}
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight">SEAPEDIA</h1>
        <div className="space-x-4">
          <Link href="/reviews" className="text-gray-600 hover:text-blue-600 font-medium text-sm">Review Aplikasi</Link>
          <Link href="/login" className="text-gray-600 hover:text-blue-600 font-medium text-sm">Masuk</Link>
          <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700 transition">Daftar</Link>
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
                <div className="h-40 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-5xl">📦</span>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <div className="text-xs font-semibold text-blue-500 mb-1 uppercase tracking-wider">
                    {/* Menampilkan informasi toko penjual sesuai PRD */}
                    🏪 {p.store?.name}
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2 line-clamp-2">{p.name}</h4>
                  <div className="mt-auto">
                    <p className="text-lg font-extrabold text-gray-900">Rp {Number(p.price).toLocaleString('id-ID')}</p>
                    <p className="text-xs text-gray-500 mt-1">Sisa Stok: {p.stock}</p>
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