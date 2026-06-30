"use client";
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import Swal from 'sweetalert2';

export default function SellerDashboard() {
  const [store, setStore] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null); // State untuk dompet
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState('');

  // State UI: Tambahkan Tab WALLET
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'ORDERS' | 'WALLET'>('PRODUCTS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', stock: '', imageUrl: '' });

  useEffect(() => {
    fetchMyStore();
  }, []);

  // Fetch Dompet ketika Tab Keuangan diklik
  useEffect(() => {
    if (activeTab === 'WALLET') {
      fetchWalletData();
    }
  }, [activeTab]);

  const fetchMyStore = async () => {
    try {
      const res = await api.get('/stores/me');
      setStore(res.data);
    } catch (error: any) {
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletData = async () => {
    try {
      const res = await api.get('/wallets/me');
      setWallet(res.data);
    } catch (err) {
      console.error("Gagal memuat data dompet seller", err);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/stores', { name: storeName });
      Swal.fire('Sukses!', 'Toko Anda berhasil dibuat.', 'success');
      setStore(res.data);
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Gagal membuat toko', 'error');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/products', {
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        imageUrl: productForm.imageUrl
      });
      Swal.fire('Sukses!', 'Produk berhasil ditambahkan.', 'success');
      setIsModalOpen(false);
      setProductForm({ name: '', description: '', price: '', stock: '', imageUrl: '' });
      fetchMyStore();
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Gagal menambah produk', 'error');
    }
  };

  const handleProcessOrder = async (orderId: string) => {
    try {
      await api.put(`/orders/${orderId}/ready`);
      Swal.fire('Pesanan Diproses', 'Pesanan siap diambil oleh kurir!', 'success');
      fetchMyStore();
    } catch (err: any) {
      Swal.fire('Gagal', err.response?.data?.message || 'Gagal memproses pesanan', 'error');
    }
  };

  const handleWithdraw = () => {
    // Simulasi penarikan dana (Bisa dikembangkan ke Payment Gateway Asli nantinya)
    Swal.fire('Fitur Segera Hadir', 'Penarikan dana ke Rekening Bank akan diimplementasikan pada fase berikutnya.', 'info');
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Memuat Dashboard...</div>;

  if (!store) {
    return (
      <div className="p-10 max-w-md mx-auto mt-10 bg-white shadow-lg rounded-lg border">
        <h1 className="text-2xl font-bold mb-4 text-blue-600">Buka Toko Anda</h1>
        <form onSubmit={handleCreateStore} className="space-y-4">
          <input type="text" className="w-full p-2 border rounded" placeholder="Nama Toko" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">Buat Toko Sekarang</button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      <div className="flex justify-between items-end mb-6 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🏪 {store.name}</h1>
          <p className="text-gray-500 text-sm mt-1">Dashboard Penjual</p>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setActiveTab('PRODUCTS')} className={`px-4 py-2 text-sm font-bold rounded-md transition ${activeTab === 'PRODUCTS' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>Produk</button>
          <button onClick={() => setActiveTab('ORDERS')} className={`px-4 py-2 text-sm font-bold rounded-md transition ${activeTab === 'ORDERS' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>Pesanan</button>
          {/* TAB KEUANGAN BARU */}
          <button onClick={() => setActiveTab('WALLET')} className={`px-4 py-2 text-sm font-bold rounded-md transition ${activeTab === 'WALLET' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-800'}`}>Keuangan</button>
        </div>
      </div>

      {/* TAB 1: PRODUK */}
      {activeTab === 'PRODUCTS' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex justify-between items-center mb-6 border-b pb-2">
            <h2 className="text-xl font-semibold text-gray-800">Katalog Produk</h2>
            <button onClick={() => setIsModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded shadow-sm text-sm font-bold hover:bg-green-700">+ Tambah Produk</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {store.products?.map((p: any) => (
              <div key={p.id} className="border rounded-lg shadow-sm overflow-hidden bg-gray-50 flex flex-col">
                <div className="h-32 bg-gray-200 flex items-center justify-center">
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-4xl">📦</span>}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">{p.name}</h3>
                  <div className="mt-auto pt-2 flex justify-between items-center">
                    <span className="font-extrabold text-blue-600 text-sm">Rp {Number(p.price).toLocaleString('id-ID')}</span>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded font-semibold text-gray-700">Stok: {p.stock}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PESANAN */}
      {activeTab === 'ORDERS' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Daftar Pesanan Masuk</h2>

          {store.orders?.length > 0 ? (
            store.orders.map((order: any) => (
              <div key={order.id} className="border p-5 rounded-xl shadow-sm bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <div className="flex gap-3 items-center mb-2">
                    <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded uppercase">{order.status.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-gray-500">ID: {order.id.split('-')[0]}</span>
                  </div>
                  <p className="font-semibold text-gray-800 text-sm">Pembeli: {order.buyer?.name}</p>
                  <div className="text-sm text-gray-600 mt-1">
                    {order.items.map((item: any) => (
                      <span key={item.id} className="block">• {item.product.name} (x{item.quantity})</span>
                    ))}
                  </div>
                  <p className="font-extrabold text-gray-900 mt-3">Total Transaksi: Rp {Number(order.total).toLocaleString('id-ID')}</p>
                </div>

                {order.status === 'SEDANG_DIKEMAS' && (
                  <button
                    onClick={() => handleProcessOrder(order.id)}
                    className="w-full md:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 shadow transition"
                  >
                    Kemas & Panggil Kurir
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic text-center py-10">Belum ada pesanan masuk.</p>
          )}
        </div>
      )}

      {/* TAB 3: KEUANGAN (WALLET SELLER) */}
      {activeTab === 'WALLET' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Saldo Pendapatan Toko</h2>
            <p className="text-4xl font-extrabold text-green-600 mb-6">
              Rp {wallet ? Number(wallet.balance).toLocaleString('id-ID') : '0'}
            </p>
            <button
              onClick={handleWithdraw}
              className="bg-gray-900 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-gray-800 transition"
            >
              Tarik Dana ke Bank 💸
            </button>
            <p className="text-xs text-gray-400 mt-3">Dana akan ditransfer ke rekening yang terdaftar 1x24 jam.</p>
          </div>

          <div className="border-l pl-8 max-h-80 overflow-y-auto">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Mutasi Rekening</h3>
            <div className="space-y-4">
              {wallet?.transactions?.length > 0 ? (
                wallet.transactions.map((tx: any) => (
                  <div key={tx.id} className="flex justify-between items-start border-b pb-3 text-sm">
                    <div>
                      <p className="font-bold text-gray-700">{tx.description}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className={`font-bold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'} Rp {Number(tx.amount).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">Belum ada transaksi pendapatan.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PRODUK (Tetap Sama) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">Tambah Produk</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <input type="text" className="w-full p-2 border rounded text-sm" placeholder="Nama Produk" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />
              <textarea className="w-full p-2 border rounded text-sm" placeholder="Deskripsi" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} required />
              <input type="url" className="w-full p-2 border rounded text-sm" placeholder="URL Gambar (Opsional)" value={productForm.imageUrl} onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })} />
              <div className="flex gap-4">
                <input type="number" className="w-1/2 p-2 border rounded text-sm" placeholder="Harga (Rp)" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required min="0" />
                <input type="number" className="w-1/2 p-2 border rounded text-sm" placeholder="Stok" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} required min="1" />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded text-sm font-bold text-gray-700 hover:bg-gray-300">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded text-sm font-bold text-white hover:bg-blue-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}