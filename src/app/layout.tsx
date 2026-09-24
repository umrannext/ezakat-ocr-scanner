import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import OfflineSyncBanner from "@/components/OfflineSyncBanner";
import { cookies } from "next/headers";
import prisma from '@/lib/prisma';

const font = Outfit({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "Sistem OCR Resit Zakat Fitrah",
  description: "Pengimbas resit zakat berasaskan teknologi AI OCR",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('auth_token')?.value;
  // Dapatkan role terus daripada kuki untuk menghapuskan query DB pada setiap muat turun halaman
  let userRole = cookieStore.get('auth_role')?.value || null;
  
  if (userId && !userRole) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      userRole = user?.role || 'AMIL';
    } catch (e) {
      userRole = 'AMIL'; // Sandaran selamat tanpa menjatuhkan aplikasi
    }
  }

  return (
    <html lang="ms">
      <body className={`${font.className} bg-gray-100 text-slate-800 antialiased min-h-screen flex justify-center`}>
        <div className="w-full max-w-md bg-[#F8FAFC] min-h-screen shadow-2xl relative pb-20 overflow-x-hidden">
          <OfflineSyncBanner />
          {children}
          <BottomNav userRole={userRole} />
        </div>
      </body>
    </html>
  );
}
