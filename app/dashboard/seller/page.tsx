"use client";
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import Swal from 'sweetalert2';

export default function SellerDashboard() {
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState('');
  
  // State untuk Modal Produk
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', stock: '' });

  useEffect(() => {
    fetchMyStore();
  }, []);

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
      });
      Swal.fire('Sukses!', 'Produk berhasil ditambahkan.', 'success');
      setIsModalOpen(false);
      setProductForm({ name: '', description: '', price: '', stock: '' });
      fetchMyStore(); // Refresh data toko & produk
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Gagal menambah produk', 'error');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const confirm = await Swal.fire({
      title: 'Hapus Produk?',
      text: "Data yang dihapus tidak bisa dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (confirm.isConfirmed) {
      try {
        await api.delete(`/products/${productId}`);
        Swal.fire('Terhapus!', 'Produk telah dihapus.', 'success');
        fetchMyStore(); // Refresh data
      } catch (error: any) {
        Swal.fire('Error', 'Gagal menghapus produk', 'error');
      }
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Memuat Dashboard...</div>;

  if (!store) {
    return (
      <div className="p-10 max-w-md mx-auto mt-10 bg-white shadow-lg rounded-lg border">
        <h1 className="text-2xl font-bold mb-4 text-blue-600">Buka Toko Anda</h1>
        <form onSubmit={handleCreateStore} className="space-y-4">
          <input type="text" className="w-full p-2 border rounded" placeholder="Nama Toko" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Buat Toko Sekarang</button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-6xl mx-auto relative">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Toko: {store.name}</h1>
          <p className="text-gray-500">Seller Dashboard</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700">
          + Tambah Produk
        </button>
      </div>

      <div className="bg-white p-6 rounded shadow-md border">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Daftar Produk ({store.products?.length || 0})</h2>
        {store.products && store.products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {store.products.map((p: any) => (
              <div key={p.id} className="border p-4 rounded shadow-sm hover:shadow-md transition bg-gray-50">
                <h3 className="font-bold text-lg text-gray-800">{p.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{p.description}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="font-semibold text-blue-600">Rp {Number(p.price).toLocaleString('id-ID')}</span>
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded">Stok: {p.stock}</span>
                </div>
                <button onClick={() => handleDeleteProduct(p.id)} className="w-full mt-4 bg-red-100 text-red-600 py-1 rounded hover:bg-red-200 text-sm font-semibold">
                  Hapus Produk
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic text-center py-10">Belum ada produk. Silakan tambahkan produk pertama Anda!</p>
        )}
      </div>

      {/* Modal Tambah Produk (KISS & DRY - langsung di file yang sama untuk mempercepat development) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">Tambah Produk Baru</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <input type="text" className="w-full p-2 border rounded" placeholder="Nama Produk" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} required />
              <textarea className="w-full p-2 border rounded" placeholder="Deskripsi Produk" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} required />
              <div className="flex gap-4">
                <input type="number" className="w-1/2 p-2 border rounded" placeholder="Harga (Rp)" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} required min="0" />
                <input type="number" className="w-1/2 p-2 border rounded" placeholder="Stok" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} required min="1" />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700">Simpan Produk</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}