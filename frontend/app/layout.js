import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'SprintForge',
  description: 'Manage Product and Sprint Backlogs',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen">
        <Navbar />
        <main className="container mx-auto p-6">
          {children}
        </main>
      </body>
    </html>
  );
}