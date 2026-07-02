"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import api from '../services/api';

const parseJwt = (token: string) => {
  try { return JSON.parse(atob(token.split('.')[1])); }
  catch (e) { return null; }
};

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeRole, setActiveRole] = useState('');
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [userData, setUserData] = useState<any>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Cek Autentikasi
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsLoggedIn(true);
      const decoded = parseJwt(token);
      if (decoded) {
        setUserData({ id: decoded.userId, email: decoded.email, name: decoded.name });
        setActiveRole(decoded.role || decoded.activeRole || '');
        setAvailableRoles(decoded.availableRoles || []);
      }
    }

    // 2. Event Listener untuk menutup dropdown saat klik di luar
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
    setActiveRole('');
    setAvailableRoles([]);
    setIsDropdownOpen(false);
    router.push('/seapedia');
    router.refresh();
  };

  const userNameDisplay = userData.name || userData.email?.split('@')[0] || 'User';
  const userInitial = userNameDisplay.charAt(0).toUpperCase();

  const roleBadgeStyle = (role: string) => {
    switch (role) {
      case 'SELLER': return 'bg-amber-50 text-amber-700 ring-amber-600/20';
      case 'ADMIN': return 'bg-rose-50 text-rose-700 ring-rose-600/20';
      case 'DRIVER': return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      default: return 'bg-teal-50 text-teal-700 ring-teal-600/20';
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-[68px] gap-8">

          {/* LOGO */}
          <Link href="/seapedia" className="flex items-center gap-3">
            <span className="text-xl font-black tracking-tighter text-slate-900">SEAPEDIA.</span>
          </Link>

          {/* SEARCH BAR */}
         

          {/* USER ACTIONS */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {isLoggedIn ? (
              <>
                {/* ICON KERANJANG (HANYA MUNCUL JIKA ROLE BUYER) */}
                {activeRole === 'BUYER' && (
                  <Link href="/cart" className="relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors" aria-label="Keranjang">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </Link>
                )}

                {/* DROPDOWN PROFIL */}
                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors">
                    <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                      {userInitial}
                    </span>
                    <span className="text-sm font-semibold text-slate-800 hidden sm:block">{userNameDisplay}</span>
                    <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-[calc(100%+10px)] right-0 w-64 bg-white rounded-2xl shadow-xl shadow-slate-900/10 ring-1 ring-slate-200 py-2 z-50 origin-top-right animate-[fadeIn_0.15s_ease-out]">
                      <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100">
                        <span className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {userInitial}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{userNameDisplay}</p>
                          <p className="text-xs text-slate-400 truncate">{userData.email}</p>
                        </div>
                      </div>

                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Peran Aktif</p>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ring-1 ring-inset ${roleBadgeStyle(activeRole)}`}>
                          {activeRole}
                        </span>
                      </div>

                      {availableRoles.length > 1 && (
                        <div className="px-2 py-2 border-b border-slate-100">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 mb-1.5">Ganti Peran</p>
                          <div className="space-y-0.5">
                            {availableRoles.map(role => (
                              <button key={role} onClick={() => handleSwitchRole(role)} className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors flex justify-between items-center ${activeRole === role ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                                <span>{role}</span>
                                {activeRole === role && (
                                  <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="px-2 pt-2">
                        <Link href={`/dashboard/${activeRole.toLowerCase()}`} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Dashboard
                        </Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors mt-1 mb-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Keluar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Masuk</Link>
                <Link href="/register" className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm">Daftar</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}