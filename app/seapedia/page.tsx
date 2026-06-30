"use client";
import { useEffect, useState, useRef } from "react";
import api from "../../services/api";
import Link from "next/link";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
};

export default function SeapediaMarketplace() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [activeRole, setActiveRole] = useState("");
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [userData, setUserData] = useState<any>({});

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const banners = [
    {
      id: 1,
      title: "Mega Diskon Akhir Tahun",
      desc: "Nikmati potongan harga hingga 70% untuk produk elektronik terpilih.",
      color: "from-emerald-600 to-teal-700",
      icon: "🎉",
    },
    {
      id: 2,
      title: "Festival Fashion Lokal",
      desc: "Dukung UMKM dengan gaya trendi masa kini. Cashback hingga Rp 50.000.",
      color: "from-indigo-600 to-blue-700",
      icon: "👗",
    },
    {
      id: 3,
      title: "Gratis Ongkir Sepuasnya",
      desc: "Tanpa minimum belanja untuk pengiriman ke seluruh pulau Jawa dan Bali.",
      color: "from-orange-500 to-rose-600",
      icon: "🚚",
    },
  ];

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setIsLoggedIn(true);
      const decoded = parseJwt(token);
      if (decoded) {
        setUserData({ id: decoded.userId, email: decoded.email });
        setActiveRole(decoded.role || decoded.activeRole || "");
        setAvailableRoles(decoded.availableRoles || []);
      }
    }

    api
      .get("/products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Gagal load produk", err))
      .finally(() => setLoading(false));

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clearInterval(slideInterval);
    };
  }, [banners.length]);

  const handleSwitchRole = async (newRole: string) => {
    if (newRole === activeRole) {
      setIsDropdownOpen(false);
      return;
    }
    try {
      Swal.fire({ title: "Beralih Peran...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const res = await api.post("/auth/select-role", { userId: userData.id, activeRole: newRole });
      localStorage.setItem("accessToken", res.data.accessToken);
      Swal.close();
      setIsDropdownOpen(false);
      router.push(res.data.redirectPath);
    } catch (err: any) {
      Swal.fire("Error", "Gagal beralih role", "error");
    }
  };

  const handleAddToCart = async (productId: string) => {
    if (!isLoggedIn) {
      Swal.fire({
        title: "Akses Ditolak",
        text: "Silakan masuk ke akun Anda.",
        icon: "warning",
        confirmButtonText: "Ke Halaman Login",
      }).then((result) => {
        if (result.isConfirmed) router.push("/login");
      });
      return;
    }
    if (activeRole === "SELLER") {
      Swal.fire("Akses Ditolak", "Akun Seller tidak dapat berbelanja. Ganti peran ke Buyer.", "warning");
      return;
    }
    try {
      await api.post("/carts/items", { productId, quantity: 1 });
      Swal.fire({
        title: "Berhasil!",
        text: "Produk ditambahkan ke keranjang.",
        icon: "success",
        showCancelButton: true,
        confirmButtonColor: "#059669",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Lihat Keranjang",
        cancelButtonText: "Lanjut Belanja",
      }).then((result) => {
        if (result.isConfirmed) router.push("/cart");
      });
    } catch (err: any) {
      Swal.fire("Gagal Menambahkan", err.response?.data?.message || "Terjadi kesalahan.", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setIsLoggedIn(false);
    setActiveRole("");
    setAvailableRoles([]);
    setIsDropdownOpen(false);
    Swal.fire("Logout Berhasil", "Anda telah keluar dari sistem.", "success");
  };

  const userNameDisplay = userData.email?.split("@")[0] || "User";

  return (
    <main className="min-h-screen bg-[#FAFAF7] font-sans text-slate-900 selection:bg-emerald-200">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 py-3 gap-8">
            <Link href="/seapedia" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm shadow-emerald-600/30">
                <span className="text-white font-extrabold text-lg">S</span>
              </div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 hidden sm:block">
                Seapedia
              </span>
            </Link>

            <div className="flex-grow hidden md:flex items-center gap-5">
              <Link href="#categories" className="text-sm font-medium text-slate-500 hover:text-emerald-700 whitespace-nowrap transition-colors">
                Kategori
              </Link>
              <div className="relative w-full max-w-xl">
                <input
                  type="text"
                  placeholder="Cari produk, toko, atau brand..."
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-100/70 border border-transparent rounded-xl text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600/50 outline-none transition-all"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {isLoggedIn ? (
                <div className="flex items-center gap-3 relative" ref={dropdownRef}>
                  {activeRole === "BUYER" && (
                    <Link
                      href="/cart"
                      className="relative p-2.5 text-slate-600 hover:text-emerald-700 transition-colors bg-slate-100/70 rounded-xl hover:bg-emerald-50"
                    >
                      <span className="text-base leading-none">🛒</span>
                    </Link>
                  )}

                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 bg-white border border-slate-200 pl-1.5 pr-3 py-1.5 rounded-full hover:border-slate-300 transition-colors"
                  >
                    <div className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                      {userNameDisplay.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 max-w-[100px] truncate hidden lg:block">
                      {userNameDisplay}
                    </span>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-13 right-0 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/60 py-3 z-50">
                      <div className="px-4 pb-3 border-b border-slate-100 mb-2">
                        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Peran Saat Ini</p>
                        <p className="font-bold text-emerald-700 text-sm mt-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> {activeRole}
                        </p>
                      </div>
                      <div className="px-2">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2 mb-1">
                          Ganti Peran
                        </p>
                        {availableRoles.map((role) => (
                          <button
                            key={role}
                            onClick={() => handleSwitchRole(role)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${
                              activeRole === role ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <span>{role}</span>
                            {activeRole === role && <span className="text-xs">✓</span>}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 px-2">
                        <Link
                          href={`/dashboard/${activeRole.toLowerCase()}`}
                          className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-700 w-full text-left"
                        >
                          Dashboard {activeRole}
                        </Link>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 mt-1 border-t border-slate-50 pt-3"
                      >
                        Keluar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link
                    href="/login"
                    className="text-sm font-semibold text-slate-700 px-4 sm:px-5 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm font-semibold bg-emerald-600 text-white px-4 sm:px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/30"
                  >
                    Daftar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* HERO CAROUSEL */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <div className="relative w-full h-[280px] md:h-[380px] rounded-3xl overflow-hidden group">
          <div
            className="flex w-full h-full transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {banners.map((banner) => (
              <div
                key={banner.id}
                className={`w-full h-full flex-shrink-0 bg-gradient-to-br ${banner.color} flex items-center px-10 md:px-16 relative overflow-hidden`}
              >
                <div className="absolute -right-16 -top-16 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="z-10 max-w-xl text-white">
                  <span className="text-4xl md:text-6xl mb-4 block">{banner.icon}</span>
                  <h2 className="text-2xl md:text-4xl font-extrabold mb-3 leading-tight tracking-tight">
                    {banner.title}
                  </h2>
                  <p className="text-sm md:text-base font-medium text-white/85 max-w-md">{banner.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1))}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-slate-900"
          >
            ❮
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1))}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-slate-900"
          >
            ❯
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all ${
                  currentSlide === index ? "w-6 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* QUICK CATEGORIES */}
      <section id="categories" className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 text-sm tracking-tight">Kategori Pilihan</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-5 justify-between sm:justify-start">
            {[
              { icon: "💻", name: "Elektronik" },
              { icon: "👕", name: "Pakaian" },
              { icon: "🍔", name: "Makanan" },
              { icon: "⚽", name: "Olahraga" },
              { icon: "💄", name: "Kecantikan" },
              { icon: "📚", name: "Buku" },
            ].map((cat, i) => (
              <div key={i} className="flex flex-col items-center gap-2 cursor-pointer group w-16 sm:w-24">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-emerald-50 group-hover:-translate-y-0.5 transition-all">
                  {cat.icon}
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-slate-600 text-center">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT GRID */}
      <section id="marketplace" className="py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-end mb-7">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Rekomendasi Untukmu
              </h2>
              <p className="text-slate-500 mt-1 text-sm">Produk terbaik dari toko terpercaya.</p>
            </div>
            <Link href="#" className="hidden sm:block text-emerald-700 font-semibold text-sm hover:underline">
              Lihat Semua
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="animate-pulse bg-white border border-slate-100 h-72 rounded-2xl" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
              {products.map((p: any) => (
                <div
                  key={p.id}
                  className="group bg-white border border-slate-100 rounded-2xl p-3 hover:shadow-lg hover:shadow-slate-200/60 hover:border-slate-200 transition-all duration-300 flex flex-col h-full"
                >
                  <div className="h-36 sm:h-44 bg-slate-50 rounded-xl relative overflow-hidden flex items-center justify-center mb-3">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <span className="text-3xl grayscale opacity-20">📦</span>
                    )}
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur text-[9px] font-bold text-slate-700 px-2 py-1 rounded-md uppercase tracking-wide truncate max-w-[90%]">
                      {p.store?.name}
                    </div>
                  </div>

                  <div className="flex flex-col flex-grow">
                    <h4 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 mb-1 group-hover:text-emerald-700 transition-colors">
                      {p.name}
                    </h4>
                    <p className="text-[10px] font-medium text-slate-400 mb-3">Stok: {p.stock}</p>

                    <div className="mt-auto pt-2 border-t border-slate-50 flex items-center justify-between">
                      <p className="text-sm sm:text-base font-bold text-slate-900">
                        Rp {Number(p.price).toLocaleString("id-ID")}
                      </p>
                      <button
                        onClick={() => handleAddToCart(p.id)}
                        disabled={p.stock < 1}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                          p.stock < 1
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                        }`}
                      >
                        {p.stock < 1 ? "✕" : "+"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <span className="text-5xl mb-4 block opacity-30">🛍️</span>
              <h3 className="text-lg font-bold text-slate-700">Katalog Kosong</h3>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 pt-16 pb-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-14 text-sm">
            <div className="space-y-4">
              <Link href="/seapedia" className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-extrabold text-lg">S</span>
                </div>
                <span className="text-lg font-extrabold tracking-tight text-white">Seapedia</span>
              </Link>
              <p className="text-slate-400 font-normal leading-relaxed">
                Platform e-commerce yang menghubungkan jutaan pembeli dengan UMKM lokal terbaik.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold text-sm mb-5">Marketplace</h4>
              <ul className="space-y-3 text-slate-400 font-normal">
                <li><Link href="#" className="hover:text-emerald-400 transition-colors">Semua Produk</Link></li>
                <li><Link href="#" className="hover:text-emerald-400 transition-colors">Toko Terlaris</Link></li>
                <li><Link href="#" className="hover:text-emerald-400 transition-colors">Promo Spesial</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold text-sm mb-5">Layanan Pelanggan</h4>
              <ul className="space-y-3 text-slate-400 font-normal">
                <li><Link href="#" className="hover:text-emerald-400 transition-colors">Pusat Bantuan</Link></li>
                <li><Link href="#" className="hover:text-emerald-400 transition-colors">Syarat & Ketentuan</Link></li>
                <li><Link href="#" className="hover:text-emerald-400 transition-colors">Kebijakan Privasi</Link></li>
                <li><Link href="#" className="hover:text-emerald-400 transition-colors">Lacak Pesanan</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold text-sm mb-5">Langganan Info</h4>
              <p className="text-slate-400 text-xs mb-4">Dapatkan update promo terbaru langsung di email Anda.</p>
              <div className="flex bg-slate-900 rounded-xl overflow-hidden p-1 border border-slate-800">
                <input
                  type="email"
                  placeholder="Email Anda"
                  className="bg-transparent w-full px-3 py-2 text-sm text-white placeholder-slate-500 outline-none"
                />
                <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors">
                  Go
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-slate-500 text-xs font-medium">
            &copy; {new Date().getFullYear()} Seapedia Commerce. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}