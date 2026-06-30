"use client";
import { useState } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<any>(null);
  const [form, setForm] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      setUserData(res.data.user);
      setStep(2); // Pindah ke tahap pilih role
    } catch (err: any) {
      Swal.fire('Login Gagal', err.response?.data?.message || 'Email atau Password salah', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRole = async (role: string) => {
    try {
      const res = await api.post('/auth/select-role', { userId: userData.id, activeRole: role });

      localStorage.setItem('accessToken', res.data.accessToken);

      await Swal.fire({
        title: 'Login Berhasil',
        text: `Anda masuk sebagai ${role}`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      router.push(res.data.redirectPath);
    } catch (err) {
      Swal.fire('Error', 'Gagal memilih role', 'error');
    }
  };

  // UI Helper untuk Icon dan Deskripsi Role
  const roleConfig: any = {
    BUYER: { icon: '🛒', desc: 'Mulai belanja dan temukan produk.' },
    SELLER: { icon: '🏪', desc: 'Kelola toko dan pesanan masuk.' },
    DRIVER: { icon: '🛵', desc: 'Antar pesanan dan dapatkan cuan.' },
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-400/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-400/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-md w-full bg-white shadow-2xl shadow-slate-200/50 border border-slate-100 rounded-[2rem] p-8 md:p-10 relative z-10">

        {/* Logo Header */}
        <div className="flex justify-center mb-8">
          <Link href="/seapedia" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30">
              <span className="text-white font-black text-2xl">S</span>
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">SEAPEDIA</span>
          </Link>
        </div>

        {step === 1 ? (
          // STEP 1: FORM LOGIN
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-900">Selamat Datang Kembali</h2>
              <p className="text-slate-500 text-sm mt-2 font-medium">Masuk ke akun Anda untuk melanjutkan</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Alamat Email</label>
                <input
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-700 text-sm font-medium"
                  placeholder="email@contoh.com"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Kata Sandi</label>
                <input
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-700 text-sm font-medium"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-emerald-500 text-white py-4 rounded-xl font-bold text-sm tracking-wide hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
              >
                {isLoading ? 'Memeriksa...' : 'Masuk Sekarang'}
              </button>
            </form>

            <p className="text-center text-sm font-semibold text-slate-500 mt-8">
              Belum punya akun?{' '}
              <Link href="/register" className="text-emerald-600 hover:text-emerald-700 hover:underline">
                Daftar Gratis
              </Link>
            </p>
          </div>
        ) : (
          // STEP 2: PILIH ROLE
          <div className="animate-in zoom-in-95 duration-300">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-900">Pilih Peran Anda</h2>
              <p className="text-slate-500 text-sm mt-2 font-medium">Sistem mendeteksi Anda memiliki multi-role.</p>
            </div>

            <div className="space-y-3">
              {userData.availableRoles.map((role: string) => (
                <button
                  key={role}
                  onClick={() => handleSelectRole(role)}
                  className="w-full p-4 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-2xl transition-all group flex items-center text-left gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-white flex items-center justify-center text-2xl shadow-sm transition-colors">
                    {roleConfig[role]?.icon || '👤'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 group-hover:text-emerald-700">{role}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{roleConfig[role]?.desc || 'Masuk ke dashboard.'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}