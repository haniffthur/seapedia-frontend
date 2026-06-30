/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';

export default function ReviewPage() {
    const [reviews, setReviews] = useState([]);
    const [form, setForm] = useState({ reviewerName: '', rating: 5, comment: '' });

    // eslint-disable-next-line react-hooks/immutability
    useEffect(() => { fetchReviews(); }, []);

    const fetchReviews = async () => {
        const res = await api.get('/reviews');
        setReviews(res.data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/reviews', form);
            Swal.fire('Berhasil!', 'Terima kasih atas ulasannya.', 'success');
            fetchReviews();
            setForm({ reviewerName: '', rating: 5, comment: '' });
        } catch (err) {
            Swal.fire('Error', 'Gagal mengirim review', 'error');
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Ulasan Aplikasi</h2>
            <form onSubmit={handleSubmit} className="mb-8 space-y-4">
                <input className="w-full p-2 border rounded" placeholder="Nama Anda" value={form.reviewerName} onChange={e => setForm({ ...form, reviewerName: e.target.value })} required />
                <select className="w-full p-2 border rounded" value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })}>
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Bintang</option>)}
                </select>
                <textarea className="w-full p-2 border rounded" placeholder="Komentar Anda..." value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} required />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Kirim Review</button>
            </form>

            <div className="space-y-4">
                {reviews.map((r: any) => (
                    <div key={r.id} className="p-4 border rounded">
                        <p className="font-bold">{r.reviewerName} - {r.rating} Bintang</p>
                        <p>{r.comment}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}