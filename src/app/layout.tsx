import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { cookies } from "next/headers";

const font = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistem OCR Resit Zakat",
  description: "Pengimbas resit zakat berasaskan teknologi AI OCR dengan Arkib SharePoint",
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
  const userRole = cookieStore.get('auth_role')?.value || null;

  return (
    <html lang="ms">
      <body className={`${font.className} bg-gray-100 text-slate-800 antialiased min-h-screen flex justify-center print:min-h-0 print:bg-white`}>
        <div className="w-full max-w-md bg-[#F8FAFC] min-h-screen shadow-2xl relative pb-20 print:pb-0 print:shadow-none print:min-h-0 print:bg-white overflow-x-hidden">
          {children}
          <BottomNav userRole={userRole} />
        </div>
      </body>
    </html>
  );
}
