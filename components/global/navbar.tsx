"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
    const router = useRouter();
    const supabase = createClient();
    const [open, setOpen] = useState(false);

    async function handleLogout() {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            router.push("/login");
        }
    }

    return (
        <header className="w-full bg-white border-b border-neutral-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <a href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-md overflow-hidden bg-white">
                            <Image src="/logo.png" alt="Srinibas Vastra" width={48} height={48} className="object-contain w-full h-full" />
                        </div>
                    </a>

                    <nav className="hidden md:flex items-center gap-6">
                        <a href="/home" className="text-neutral-700 hover:text-neutral-900">Home</a>
                        <a href="/products" className="text-neutral-700 hover:text-neutral-900">Products</a>
                        <a href="/about" className="text-neutral-700 hover:text-neutral-900">About</a>
                        <a href="/contact" className="text-neutral-700 hover:text-neutral-900">Contact</a>
                        <button onClick={handleLogout} className="ml-4 text-neutral-700 hover:text-neutral-900">Logout</button>
                    </nav>

                    <div className="md:hidden">
                        <button
                            onClick={() => setOpen((s) => !s)}
                            aria-label="Toggle menu"
                            aria-expanded={open}
                            className="inline-flex items-center justify-center p-2 rounded-md text-neutral-700 hover:bg-neutral-100"
                        >
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                {open ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {open && (
                <div className="md:hidden bg-white border-t border-neutral-100">
                    <div className="px-4 pt-4 pb-4 space-y-2">
                        <a href="/home" className="block text-neutral-700 py-2">Home</a>
                        <a href="/products" className="block text-neutral-700 py-2">Products</a>
                        <a href="/about" className="block text-neutral-700 py-2">About</a>
                        <a href="/contact" className="block text-neutral-700 py-2">Contact</a>
                        <button onClick={handleLogout} className="w-full text-left text-neutral-700 py-2">Logout</button>
                    </div>
                </div>
            )}
        </header>
    );
}