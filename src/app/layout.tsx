import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "THE PULSE | 내한공연 트래커",
  description:
    "일본 아티스트 내한 공연 일정과 티케팅 오픈 정보를 한눈에 확인하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
        <style>{`
          :root {
            --font-sans: 'Pretendard Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'system-ui', sans-serif;
          }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1 pt-[68px] pb-20 md:pb-0">{children}</main>
        <Footer />
        <MobileBottomNav />
      </body>
    </html>
  );
}
