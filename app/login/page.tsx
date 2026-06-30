"use client";
import { useState } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState(1); // Step 1: Login, Step 2: Pilih Role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userData, setUserData] = useState<any>(null);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', form);
      setUserData(res.data.user);
      setStep(2);
    } catch (err) {
      Swal.fire('Error', 'Login gagal', 'error');
    }
  };

  const handleSelectRole = async (role: string) => {
    try {
      const res = await api.post('/auth/select-role', { userId: userData.id, activeRole: role });
      localStorage.setItem('accessToken', res.data.accessToken);
      Swal.fire('Login Berhasil', `Anda masuk sebagai ${role}`, 'success');
      router.push('/dashboard');
    } catch (err) {
      Swal.fire('Error', 'Gagal memilih role', 'error');
    }
  };

  if (step === 2) return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">Pilih Active Role</h2>
      {userData.availableRoles.map((role: string) => (
        <button key={role} onClick={() => handleSelectRole(role)} className="w-full mb-2 p-2 bg-gray-100 hover:bg-blue-100 rounded">
          {role}
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <input className="w-full p-2 border rounded" placeholder="Email" onChange={e => setForm({...form, email: e.target.value})} />
        <input className="w-full p-2 border rounded" type="password" placeholder="Password" onChange={e => setForm({...form, password: e.target.value})} />
        <button className="w-full bg-blue-600 text-white p-2 rounded">Login</button>
      </form>
    </div>
  );
}