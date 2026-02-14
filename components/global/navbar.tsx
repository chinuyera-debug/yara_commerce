"use client";

import Image from "next/image";
import { Home, ShoppingBag, ShoppingCart, User, List, Package, Shield, ChevronDown, ClipboardList } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import axios from "axios";

/* ── Category dropdown data ─────────────────────────────── */
const PRODUCT_MENU = [
    {
        label: "Saree",
        value: "saree",
        subs: ["Sambalpuri", "Bomkai", "Pasapalli", "Banarasi", "Kanchipuram", "Tussar", "Chanderi"],
    },
    {
        label: "Lehenga",
        value: "lehenga",
        subs: ["Bridal", "Party Wear", "Festive"],
    },
    {
        label: "Dupatta",
        value: "dupatta",
        subs: ["Silk Dupatta", "Cotton Dupatta", "Bandhani Dupatta"],
    },
    {
        label: "Dress Material",
        value: "dress_material",
        subs: ["Unstitched Suit", "Salwar Set", "Churidar Material"],
    },
    {
        label: "Kurta",
        value: "kurta",
        subs: ["Casual Kurta", "Formal Kurta", "Designer Kurta"],
    },
    {
        label: "Blouse Piece",
        value: "blouse_piece",
        subs: [],
    },
    {
        label: "Raw Fabric",
        value: "raw_fabric",
        subs: ["Silk Fabric", "Cotton Fabric", "Linen Fabric"],
    },
    {
        label: "Top",
        value: "top",
        subs: [],
    },
    {
        label: "Bottom",
        value: "bottom",
        subs: [],
    },
    {
        label: "Stole",
        value: "stole",
        subs: [],
    },
];

export default function Navbar() {
    const router = useRouter();
    const supabase = createClient();
    const [open, setOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSeller, setIsSeller] = useState(false);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [mobileProductExpand, setMobileProductExpand] = useState(false);
    const dropdownTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        axios.get("/api/user/me").then((res) => {
            setIsAdmin(res.data?.user?.isAdmin === true);
            setIsSeller(res.data?.user?.isApprovedSeller === true);
        }).catch(() => { });
    }, []);

    async function handleLogout() {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            router.push("/login");
        }
    }

    const openDropdown = () => {
        if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
        setShowProductDropdown(true);
    };
    const closeDropdown = () => {
        dropdownTimeout.current = setTimeout(() => setShowProductDropdown(false), 200);
    };

    return (
        <header
            className="w-full"
            style={{
                backgroundColor: "var(--color-bg-dark)",
                borderBottom: "2px solid var(--color-border)",
            }}
        >
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-32">

                    {/* Logo */}
                    <a href="/" className="relative flex items-center">
                        <div style={{ position: "relative", height: 120, width: 400, maxWidth: "60vw" }}>
                            <Image
                                src="/logo.png"
                                alt="Srinibas Vastra"
                                fill
                                priority
                                sizes="(max-width: 768px) 240px, 420px"
                                style={{ objectFit: "contain" }}
                            />
                        </div>
                    </a>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6">
                        <NavLink href="/home" Icon={Home}>Home</NavLink>

                        {/* Products with dropdown */}
                        <div
                            className="relative"
                            onMouseEnter={openDropdown}
                            onMouseLeave={closeDropdown}
                        >
                            <a
                                href="/products"
                                style={{
                                    color: "var(--color-text-light)",
                                    textDecoration: "none",
                                    transition: "color .2s ease",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "6px 8px",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-light)")}
                            >
                                <ShoppingBag size={20} />
                                <span style={{ fontSize: 13, lineHeight: "1", display: "flex", alignItems: "center", gap: 3 }}>
                                    Products <ChevronDown size={12} />
                                </span>
                            </a>

                            {/* Mega dropdown */}
                            {showProductDropdown && (
                                <div
                                    className="absolute top-full left-1/2 pt-2"
                                    style={{ transform: "translateX(-50%)", zIndex: 100 }}
                                >
                                    <div
                                        style={{
                                            background: "#fff",
                                            borderRadius: 12,
                                            boxShadow: "0 12px 40px rgba(0,0,0,.18)",
                                            border: "1px solid #e5e5e5",
                                            padding: "20px 24px",
                                            minWidth: 540,
                                            maxWidth: 700,
                                        }}
                                    >
                                        <div
                                            className="grid gap-x-6 gap-y-4"
                                            style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
                                        >
                                            {PRODUCT_MENU.map((cat) => (
                                                <div key={cat.value}>
                                                    <a
                                                        href={`/products?category=${cat.value}`}
                                                        style={{
                                                            fontWeight: 600,
                                                            fontSize: 14,
                                                            color: "#1a1a1a",
                                                            textDecoration: "none",
                                                            display: "block",
                                                            marginBottom: 6,
                                                        }}
                                                        onMouseEnter={(e) => (e.currentTarget.style.color = "#7b2d8e")}
                                                        onMouseLeave={(e) => (e.currentTarget.style.color = "#1a1a1a")}
                                                    >
                                                        {cat.label}
                                                    </a>
                                                    {cat.subs.length > 0 && (
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                                            {cat.subs.map((sub) => (
                                                                <a
                                                                    key={sub}
                                                                    href={`/products?category=${cat.value}&search=${encodeURIComponent(sub)}`}
                                                                    style={{
                                                                        fontSize: 12,
                                                                        color: "#666",
                                                                        textDecoration: "none",
                                                                        padding: "2px 0",
                                                                        transition: "color .15s",
                                                                    }}
                                                                    onMouseEnter={(e) => (e.currentTarget.style.color = "#7b2d8e")}
                                                                    onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
                                                                >
                                                                    {sub}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {/* View All link */}
                                        <div style={{ borderTop: "1px solid #eee", marginTop: 16, paddingTop: 12, textAlign: "center" }}>
                                            <a
                                                href="/products"
                                                style={{
                                                    fontSize: 13,
                                                    color: "var(--color-primary)",
                                                    fontWeight: 600,
                                                    textDecoration: "none",
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                                                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                                            >
                                                View All Products →
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <NavLink href="/cart" Icon={ShoppingCart}>Cart</NavLink>
                        <NavLink href="/profile" Icon={User}>Profile</NavLink>
                        <NavLink href="/orders" Icon={List}>Orders</NavLink>
                        {isSeller && <NavLink href="/seller/products" Icon={Package}>Your Products</NavLink>}
                        {isSeller && <NavLink href="/seller/orders" Icon={ClipboardList}>Your Orders</NavLink>}
                        {isAdmin && <NavLink href="/admin/sellers" Icon={Shield}>Sellers</NavLink>}

                        <button
                            onClick={handleLogout}
                            className="ml-6"
                            style={{
                                background: "transparent",
                                color: "var(--color-text-light)",
                                border: "1px solid var(--color-primary)",
                                padding: "6px 14px",
                                borderRadius: 8,
                                cursor: "pointer",
                                transition: "all .2s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "var(--color-primary)";
                                e.currentTarget.style.color = "#2B1A12";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = "var(--color-text-light)";
                            }}
                        >
                            Logout
                        </button>
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setOpen((s) => !s)}
                            aria-label="Toggle menu"
                            aria-expanded={open}
                            className="inline-flex items-center justify-center p-2 rounded-md"
                            style={{ color: "var(--color-text-light)" }}
                        >
                            <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
                <div className="md:hidden" style={{ backgroundColor: "var(--color-bg-dark)", borderTop: "1px solid var(--color-border)" }}>
                    <div className="px-4 pt-4 pb-4 space-y-2">
                        <MobileLink href="/home" onClick={() => setOpen(false)} Icon={Home}>Home</MobileLink>

                        {/* Products with expandable categories */}
                        <div>
                            <button
                                onClick={() => setMobileProductExpand((s) => !s)}
                                className="w-full py-3 flex items-center justify-between"
                                style={{ color: "var(--color-text-light)", background: "transparent" }}
                            >
                                <span className="flex items-center gap-2">
                                    <ShoppingBag size={18} /> Products
                                </span>
                                <ChevronDown
                                    size={16}
                                    style={{
                                        transition: "transform .2s",
                                        transform: mobileProductExpand ? "rotate(180deg)" : "rotate(0deg)",
                                    }}
                                />
                            </button>
                            {/* View All link */}
                            {mobileProductExpand && (
                                <div className="pl-7 pb-2 space-y-1">
                                    <a
                                        href="/products"
                                        onClick={() => setOpen(false)}
                                        style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--color-primary)", textDecoration: "none", padding: "4px 0" }}
                                    >
                                        View All Products
                                    </a>
                                    {PRODUCT_MENU.map((cat) => (
                                        <div key={cat.value}>
                                            <a
                                                href={`/products?category=${cat.value}`}
                                                onClick={() => setOpen(false)}
                                                style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--color-text-light)", textDecoration: "none", padding: "5px 0 2px" }}
                                            >
                                                {cat.label}
                                            </a>
                                            {cat.subs.map((sub) => (
                                                <a
                                                    key={sub}
                                                    href={`/products?category=${cat.value}&search=${encodeURIComponent(sub)}`}
                                                    onClick={() => setOpen(false)}
                                                    style={{ display: "block", fontSize: 12, color: "#999", textDecoration: "none", padding: "2px 0 2px 12px" }}
                                                >
                                                    {sub}
                                                </a>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <MobileLink href="/cart" onClick={() => setOpen(false)} Icon={ShoppingCart}>Cart</MobileLink>
                        <MobileLink href="/profile" onClick={() => setOpen(false)} Icon={User}>Profile</MobileLink>
                        <MobileLink href="/orders" onClick={() => setOpen(false)} Icon={List}>Orders</MobileLink>
                        {isSeller && <MobileLink href="/seller/products" onClick={() => setOpen(false)} Icon={Package}>Your Products</MobileLink>}
                        {isSeller && <MobileLink href="/seller/orders" onClick={() => setOpen(false)} Icon={ClipboardList}>Your Orders</MobileLink>}
                        {isAdmin && <MobileLink href="/admin/sellers" onClick={() => setOpen(false)} Icon={Shield}>Sellers</MobileLink>}

                        <button
                            onClick={() => { setOpen(false); handleLogout(); }}
                            className="w-full text-left py-3"
                            style={{ color: "var(--color-text-light)", background: "transparent" }}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}

function NavLink({ href, children, Icon }: { href: string; children: React.ReactNode; Icon?: any }) {
    return (
        <a
            href={href}
            style={{
                color: "var(--color-text-light)",
                textDecoration: "none",
                transition: "color .2s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "6px 8px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-light)")}
        >
            {Icon ? <Icon size={20} color="currentColor" /> : null}
            <span style={{ fontSize: 13, lineHeight: "1" }}>{children}</span>
        </a>
    );
}

function MobileLink({ href, children, onClick, Icon }: { href: string; children: React.ReactNode; onClick?: () => void; Icon?: any }) {
    return (
        <a
            href={href}
            onClick={onClick}
            className="block py-3"
            style={{ color: "var(--color-text-light)", textDecoration: "none", transition: "color .2s ease", display: "flex", alignItems: "center", gap: 8 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-light)")}
        >
            {Icon ? <Icon size={18} color="currentColor" /> : null}
            {children}
        </a>
    );
}
