import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TalentDash — Career Intelligence Platform",
  description:
    "Structured, comparable salary data for tech professionals in India. Compare compensation across companies by equivalent engineering levels.",
  openGraph: {
    title: "TalentDash — Career Intelligence Platform",
    description:
      "Compare tech salaries across companies by equivalent engineering levels. Structured data, not opinions.",
    url: "https://talentdash.vercel.app",
    siteName: "TalentDash",
    type: "website",
  },
};

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#EBEBEB]">
      <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 bg-[#FF5A5F] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">TD</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-[#222222]">
            TalentDash
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Link href="/salaries" className="nav-link">
            Salaries
          </Link>
          <Link href="/companies" className="nav-link">
            Companies
          </Link>
          <Link href="/compare" className="nav-link">
            Compare
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#F7F7F7] text-[#222222] antialiased font-[family-name:var(--font-inter)]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="py-6 text-center text-xs text-[#717171] border-t border-[#EBEBEB] bg-white">
          TalentDash · Career Intelligence Platform · Built with Next.js,
          Prisma, PostgreSQL
        </footer>
      </body>
    </html>
  );
}
