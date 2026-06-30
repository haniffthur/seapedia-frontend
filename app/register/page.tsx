"use client";
import { useState } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

export default function Register() {
    const router = useRouter();
    const [form, setForm] = useState({ email: '', name: '', password: '' });

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', form);
            Swal.fire('Sukses!', 'Akun berhasil dibuat. Silakan login.', 'success');
            router.push('/login');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            Swal.fire('Error', err.response?.data?.message || 'Gagal register', 'error');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Daftar SEAPEDIA</h2>
            <form onSubmit={handleRegister} className="space-y-4">
                <input className="w-full p-2 border rounded" placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} required />
                <input className="w-full p-2 border rounded" placeholder="Nama" onChange={e => setForm({ ...form, name: e.target.value })} required />
                <input className="w-full p-2 border rounded" type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button className="w-full bg-blue-600 text-white p-2 rounded">Register</button>
            </form>
        </div>
    );
}