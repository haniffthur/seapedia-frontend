"use client";
import { useEffect, useState, useRef } from "react";
import api from "../../services/api";
import Link from "next/link";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";

const parseJwt = (token: string) => {
  try { return JSON.parse(atob(token.split('.')[1])); }
  catch (e) { return null; }
};

export default function SeapediaMarketplace() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [activeRole, setActiveRole] = useState('');
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [userData, setUserData] = useState<any>({});

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const banners = [
    {
      id: 1,
      title: 'THE ESSENTIALS.',
      desc: 'Standar baru kehidupan modern. Diskon hingga 70% untuk kurasi elektronik terbaik.',
      image: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?q=80&w=2000&auto=format&fit=crop'
    },
    {
      id: 2,
      title: 'LOCAL ARTISANS.',
      desc: 'Mendukung karya lokal dengan desain tak lekang oleh waktu.',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2000&auto=format&fit=crop'
    },
    {
      id: 3,
      title: 'SEAMLESS DELIVERY.',
      desc: 'Pengiriman tanpa batas ke seluruh penjuru Nusantara. Gratis ongkir sepuasnya.',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2000&auto=format&fit=crop'
    },
  ];

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsLoggedIn(true);
      const decoded = parseJwt(token);
      if (decoded) {
        setUserData({ id: decoded.userId, email: decoded.email });
        setActiveRole(decoded.role || decoded.activeRole || '');
        setAvailableRoles(decoded.availableRoles || []);
      }
    }

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

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 6000);

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
      Swal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const res = await api.post('/auth/select-role', { userId: userData.id, activeRole: newRole });
      localStorage.setItem('accessToken', res.data.accessToken);
      Swal.close();
      setIsDropdownOpen(false);
      router.push(res.data.redirectPath);
    } catch (err: any) {
      Swal.fire('Error', 'Gagal beralih role', 'error');
    }
  };

  const handleAddToCart = async (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    if (activeRole === 'SELLER') {
      Swal.fire('Akses Ditolak', 'Akun Seller tidak dapat berbelanja.', 'warning');
      return;
    }
    if (product.store?.ownerId === userData.id) {
      Swal.fire('Peringatan', 'Anda tidak dapat membeli barang dari toko sendiri.', 'error');
      return;
    }

    try {
      await api.post('/carts/items', { productId: product.id, quantity: 1 });
      Swal.fire({
        title: 'Ditambahkan',
        text: `${product.name} masuk ke keranjang.`,
        icon: 'success',
        confirmButtonColor: '#0f766e'
      });
    } catch (err: any) {
      Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan.', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
    setActiveRole('');
    setAvailableRoles([]);
    setIsDropdownOpen(false);
    router.refresh();
  };

  const userNameDisplay = userData.name || userData.email?.split('@')[0] || 'User';
  const userInitial = userNameDisplay.charAt(0).toUpperCase();

  const roleBadgeStyle = (role: string) => {
    switch (role) {
      case 'SELLER': return 'bg-amber-50 text-amber-700 ring-amber-600/20';
      case 'ADMIN': return 'bg-rose-50 text-rose-700 ring-rose-600/20';
      default: return 'bg-teal-50 text-teal-700 ring-teal-600/20';
    }
  };

  return (
    <main className="min-h-screen bg-white font-sans text-slate-900 selection:bg-teal-900 selection:text-white">

     <Navbar />

      {/* HERO CAROUSEL */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="relative w-full h-[400px] md:h-[500px] rounded-3xl bg-slate-100 overflow-hidden group shadow-sm">
          <div
            className="flex w-full h-full transition-transform duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {banners.map((banner) => (
              <div key={banner.id} className="w-full h-full flex-shrink-0 relative">
                <img src={banner.image} alt="Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute inset-0 flex flex-col justify-end pb-16 px-10 md:px-16 text-white max-w-2xl">
                  <span className="inline-block w-fit px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest mb-4 ring-1 ring-white/20">
                    Koleksi Pilihan
                  </span>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none mb-4">{banner.title}</h2>
                  <p className="text-sm md:text-base font-medium opacity-90 leading-relaxed max-w-md">{banner.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1))}
            className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all"
            aria-label="Sebelumnya"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1))}
            className="absolute right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all"
            aria-label="Berikutnya"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>

          <div className="absolute bottom-6 left-10 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Slide ${index + 1}`}
                className={`h-1.5 rounded-full transition-all ${currentSlide === index ? 'w-7 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </div>
      </section>


      {/* PRODUCT GRID */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Koleksi Terkini</h2>
            <p className="text-sm text-slate-500 mt-1">Produk terbaru dari toko-toko pilihan.</p>
          </div>
          <Link href="/seapedia/explore" className="flex items-center gap-1 text-xs font-bold text-slate-600 uppercase tracking-widest hover:text-teal-700 transition-colors">
            Lihat Semua
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="animate-pulse">
                <div className="aspect-[4/5] rounded-2xl bg-slate-100 mb-4"></div>
                <div className="h-3 w-1/2 rounded-full bg-slate-100 mb-2"></div>
                <div className="h-4 w-3/4 rounded-full bg-slate-100 mb-2"></div>
                <div className="h-4 w-1/3 rounded-full bg-slate-100"></div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
            {products.map((p: any) => {
              const isOwnProduct = p.store?.ownerId === userData.id;
              const isSoldOut = p.stock < 1;

              return (
                <Link key={p.id} href={`/seapedia/product/${p.id}`} className="group flex flex-col h-full cursor-pointer">
                  <div className="aspect-[4/5] rounded-2xl bg-slate-50 relative overflow-hidden mb-4 ring-1 ring-slate-100">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm font-medium">No Image</div>
                    )}

                    {isSoldOut && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
                        Habis
                      </span>
                    )}

                    <div className="absolute bottom-0 left-0 w-full p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                      <button
                        onClick={(e) => handleAddToCart(p, e)}
                        disabled={isSoldOut || isOwnProduct}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-lg ${isOwnProduct
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                          : isSoldOut
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                            : 'bg-slate-900 text-white hover:bg-teal-800'
                          }`}
                      >
                        {isOwnProduct ? 'Toko Anda' : (isSoldOut ? 'Stok Habis' : 'Tambah ke Keranjang')}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col flex-grow px-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">{p.store?.name}</p>
                    <h4 className="font-semibold text-slate-900 text-sm leading-snug mb-2 line-clamp-2">{p.name}</h4>
                    <p className="mt-auto text-sm font-black text-slate-900">
                      Rp {Number(p.price).toLocaleString('id-ID')}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-32 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900">Katalog Kosong</h3>
            <p className="text-slate-500 text-sm mt-2">Belum ada produk yang dipublikasikan.</p>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 pt-20 pb-10 text-slate-400">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 text-sm">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-6">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
                  <span className="text-white font-black text-sm">S</span>
                </span>
                <span className="text-lg font-black tracking-tight text-white">Seapedia</span>
              </div>
              <p className="leading-relaxed pr-4 text-slate-400">
                Redefinisi pengalaman e-commerce. Menghubungkan kurasi lokal berkualitas dengan teknologi modern tanpa batas.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">Eksplorasi</h4>
              <ul className="space-y-3.5 font-medium">
                <li><Link href="#" className="hover:text-white transition-colors">Koleksi Terbaru</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Desainer Lokal</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Editorial</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">Bantuan</h4>
              <ul className="space-y-3.5 font-medium">
                <li><Link href="#" className="hover:text-white transition-colors">FAQ Pengiriman</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pengembalian Dana</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Hubungi Kami</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">Newsletter</h4>
              <p className="mb-4 text-slate-400">Dapatkan akses awal untuk koleksi eksklusif.</p>
              <div className="flex items-center bg-white/5 rounded-xl border border-white/10 pl-4 pr-1.5 py-1.5 focus-within:border-teal-500/50 transition-colors">
                <input type="email" placeholder="Alamat email" className="bg-transparent w-full text-sm text-white placeholder-slate-500 outline-none" />
                <button className="text-xs font-bold uppercase tracking-widest text-white bg-teal-700 hover:bg-teal-600 rounded-lg px-3.5 py-2 transition-colors flex-shrink-0">
                  Kirim
                </button>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500">
            <p>&copy; {new Date().getFullYear()} Seapedia Commerce. Seluruh hak cipta dilindungi.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition-colors">Privasi</Link>
              <Link href="#" className="hover:text-white transition-colors">Syarat Ketentuan</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}