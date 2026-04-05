import type { Metadata, Viewport } from "next";
import { Catamaran, Open_Sans } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-sans-app",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
});

const catamaran = Catamaran({
  variable: "--font-display-app",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Bey360 Finans",
  description: "Basit on muhasebe, e-Fatura ve ticari operasyon yonetim sistemi",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#d5202a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" data-scroll-behavior="smooth" className={`${openSans.variable} ${catamaran.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
