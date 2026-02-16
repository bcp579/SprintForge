import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-slate-900 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-400">SprintForge</h1>
        <div className="space-x-6 text-sm font-medium">
          <Link href="/" className="hover:text-blue-300 transition">Product Backlog</Link>
          <Link href="/planning" className="hover:text-blue-300 transition">Sprint Planning</Link>
          <Link href="/active" className="hover:text-blue-300 transition">Active Sprint</Link>
        </div>
      </div>
    </nav>
  );
}