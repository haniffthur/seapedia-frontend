import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="p-4 bg-white shadow-md flex justify-between items-center">
      <Link href="/" className="text-xl font-bold text-blue-600">SEAPEDIA</Link>
      <div className="space-x-4">
        <Link href="/login" className="text-gray-600">Login</Link>
        <Link href="/register" className="text-blue-600 font-semibold">Register</Link>
      </div>
    </nav>
  );
}