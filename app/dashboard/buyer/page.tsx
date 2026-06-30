"use client";
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import Swal from 'sweetalert2';

export default function BuyerDashboard() {
  const [wallet, setWallet] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [addressForm, setAddressForm] = useState({ street: '', city: '', postalCode: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBuyerData();
  }, []);

  const loadBuyerData = async () => {
    try {
      const [walletRes, addressRes] = await Promise.all([
        api.get('/wallets/me'),
        api.get('/addresses')
      ]);
      setWallet(walletRes.data);
      setAddresses(addressRes.data);
    } catch (err) {
      console.error("Gagal memuat data buyer", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(topUpAmount) <= 0) return;
    try {
      const res = await api.post('/wallets/topup', { amount: Number(topUpAmount) });
      Swal.fire('Sukses!', `Berhasil top-up Rp ${Number(topUpAmount).toLocaleString('id-ID')}`, 'success');
      setWallet(res.data);
      setTopUpAmount('');
      loadBuyerData();
    } catch (err) {
      Swal.fire('Error', 'Gagal melakukan top-up', 'error');
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/addresses', addressForm);
      Swal.fire('Sukses!', 'Alamat berhasil ditambahkan.', 'success');
      setAddressForm({ street: '', city: '', postalCode: '' });
      loadBuyerData();
    } catch (err) {
      Swal.fire('Error', 'Gagal menambah alamat', 'error');
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Memuat Data Buyer...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Kolom Kiri: Wallet */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Saldo SEAPEDIA Pay</h2>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">
            Rp {wallet ? Number(wallet.balance).toLocaleString('id-ID') : '0'}
          </p>
          
          <form onSubmit={handleTopUp} className="mt-6 space-y-3 border-t pt-4">
            <label className="text-xs font-bold text-gray-700">Simulasi Top-Up Saldo</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded-md text-sm" 
              placeholder="Masukkan Nominal (Rp)" 
              value={topUpAmount}
              onChange={e => setTopUpAmount(e.target.value)}
              required
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold text-sm hover:bg-blue-700">
              Isi Saldo
            </button>
          </form>
        </div>

        {/* Riwayat Transaksi Dompet */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-3 text-sm">Riwayat Transaksi</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {wallet?.transactions?.length > 0 ? (
              wallet.transactions.map((tx: any) => (
                <div key={tx.id} className="text-xs border-b pb-2 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-700">{tx.description}</p>
                    <p className="text-gray-400">{new Date(tx.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>
                  <span className={`font-bold ${tx.type === 'TOP_UP' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'TOP_UP' ? '+' : '-'} Rp {Number(tx.amount).toLocaleString('id-ID')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">Belum ada transaksi.</p>
            )}
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Alamat Pengiriman */}
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Daftar Alamat Pengiriman</h2>
          
          {addresses.length > 0 ? (
            <div className="space-y-3 mb-6">
              {addresses.map((addr: any) => (
                <div key={addr.id} className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{addr.street}</p>
                    <p className="text-sm text-gray-500">{addr.city}, {addr.postalCode}</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">Tersimpan</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic mb-6">Belum ada alamat yang didaftarkan.</p>
          )}

          {/* Form Tambah Alamat */}
          <form onSubmit={handleAddAddress} className="border-t pt-4 space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm">Tambah Alamat Baru</h3>
            <input 
              type="text" 
              className="w-full p-2 border rounded-md text-sm" 
              placeholder="Nama Jalan / Rumah / Patokan"
              value={addressForm.street}
              onChange={e => setAddressForm({...addressForm, street: e.target.value})}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" 
                className="p-2 border rounded-md text-sm" 
                placeholder="Kota"
                value={addressForm.city}
                onChange={e => setAddressForm({...addressForm, city: e.target.value})}
                required
              />
              <input 
                type="text" 
                className="p-2 border rounded-md text-sm" 
                placeholder="Kode Pos"
                value={addressForm.postalCode}
                onChange={e => setAddressForm({...addressForm, postalCode: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-900">
              Simpan Alamat
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}