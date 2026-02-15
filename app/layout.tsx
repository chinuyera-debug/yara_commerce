import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientAuthNavbar from "@/components/global/client-auth-navbar";
import Footer from "@/components/global/footer";
import { createClient as createServerClient } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Srinibas Vastra : Authentic Handloom & Textile Store",
  description: "Discover authentic handloom sarees, fabrics & textiles from artisans across India.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user ?? null;

  return (
    <html lang="en" style={{ backgroundColor: '#FFF8E7' }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientAuthNavbar initialAuthenticated={Boolean(user)} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
