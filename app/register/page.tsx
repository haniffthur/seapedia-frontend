"use client";
import { useState } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
    const router = useRouter();
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/auth/register', form);
            Swal.fire({
                title: 'Registrasi Berhasil!',
                text: 'Akun Anda telah dibuat. Silakan login.',
                icon: 'success',
                confirmButtonColor: '#10b981', // Emerald 500
            }).then(() => {
                router.push('/login');
            });
        } catch (err: any) {
            Swal.fire('Registrasi Gagal', err.response?.data?.message || 'Terjadi kesalahan sistem', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background Decor */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-400/20 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-400/10 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="max-w-md w-full bg-white shadow-2xl shadow-slate-200/50 border border-slate-100 rounded-[2rem] p-8 md:p-10 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Logo Header */}
                <div className="flex justify-center mb-8">
                    <Link href="/seapedia" className="flex items-center gap-2 group cursor-pointer">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30">
                            <span className="text-white font-black text-2xl">S</span>
                        </div>
                        <span className="text-2xl font-black tracking-tight text-slate-900">SEAPEDIA</span>
                    </Link>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-slate-900">Buat Akun Baru</h2>
                    <p className="text-slate-500 text-sm mt-2 font-medium">Bergabung dan mulai transaksi tanpa batas.</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Nama Lengkap</label>
                        <input
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-700 text-sm font-medium"
                            placeholder="John Doe"
                            type="text"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            required
                        />
                    </div>
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
                            placeholder="Minimal 6 karakter"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-4 bg-slate-900 text-white py-4 rounded-xl font-bold text-sm tracking-wide hover:bg-slate-800 hover:shadow-lg transition-all active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
                    >
                        {isLoading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
                    </button>
                </form>

                <p className="text-center text-sm font-semibold text-slate-500 mt-8">
                    Sudah punya akun?{' '}
                    <Link href="/login" className="text-emerald-600 hover:text-emerald-700 hover:underline">
                        Masuk di sini
                    </Link>
                </p>
            </div>
        </main>
    );
}