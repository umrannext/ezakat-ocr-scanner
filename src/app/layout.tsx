import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";

const font = Outfit({ subsets: ["latin"] });
const prisma = new PrismaClient();

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
  let userRole = null;
  
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    userRole = user?.role;
  }

  return (
    <html lang="ms">
      <body className={`${font.className} bg-gray-100 text-slate-800 antialiased min-h-screen flex justify-center`}>
        <div className="w-full max-w-md bg-[#F8FAFC] min-h-screen shadow-2xl relative pb-20 overflow-x-hidden">
          {children}
          <BottomNav userRole={userRole} />
        </div>
      </body>
    </html>
  );
}
