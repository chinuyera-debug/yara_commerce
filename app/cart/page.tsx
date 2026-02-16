"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import styles from "./cart.module.css";
import { Loader2, Package, Trash2, Plus, Minus } from "lucide-react";

interface Product {
    id: string;
    name: string;
    price: number;
    images: string[];
    seller: { shopName: string | null } | null;
}

interface CartItem {
    id: string;
    productId: string;
    quantity: number;
    product: Product | null;
}

export default function CartPage() {
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<{ id: string; items: CartItem[] } | null>(null);
    const [updating, setUpdating] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const res = await axios.get("/api/user/cart");
                if (res.data?.cart) setCart(res.data.cart);
            } catch (err: any) {
                // ignore for now; unauthenticated users will see empty state
            } finally {
                setLoading(false);
            }
        };
        fetchCart();
    }, []);

    const updateQuantity = async (productId: string, qty: number) => {
        if (!cart) return;
        setUpdating((s) => ({ ...s, [productId]: true }));
        try {
            const res = await axios.patch("/api/user/cart", { productId, quantity: qty });
            if (res.data?.item) {
                setCart((c) => {
                    if (!c) return c;
                    const items = c.items.map((it) => (it.productId === productId ? { ...it, quantity: res.data.item.quantity } : it));
                    return { ...c, items };
                });
            } else if (res.data?.removed) {
                setCart((c) => ({ id: c!.id, items: c!.items.filter((it) => it.productId !== productId) }));
            }
        } catch (err: any) {
            alert(err?.response?.data?.error || "Could not update cart");
        } finally {
            setUpdating((s) => ({ ...s, [productId]: false }));
        }
    };

    const removeItem = async (productId: string) => {
        if (!cart) return;
        setUpdating((s) => ({ ...s, [productId]: true }));
        try {
            await axios.delete(`/api/user/cart?productId=${encodeURIComponent(productId)}`);
            setCart((c) => ({ id: c!.id, items: c!.items.filter((it) => it.productId !== productId) }));
        } catch (err: any) {
            alert(err?.response?.data?.error || "Could not remove item");
        } finally {
            setUpdating((s) => ({ ...s, [productId]: false }));
        }
    };

    const total = cart?.items.reduce((s, it) => s + (it.product?.price || 0) * it.quantity, 0) ?? 0;

    if (loading) return (
        <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader2 className="animate-spin" size={28} />
        </main>
    );

    if (!cart || cart.items.length === 0) return (
        <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <Package size={56} style={{ color: "var(--color-border)" }} />
            <h2 style={{ color: "var(--color-bg-dark)" }}>Your cart is empty</h2>
            <Link href="/products" style={{ color: "var(--color-primary)", fontWeight: 700 }}>Browse products</Link>
        </main>
    );

    return (
        <main className={styles.container}>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Your Cart</h1>
            <div className={styles.grid}>
                <div className={styles.itemsCol}>
                    {cart.items.map((it) => (
                        <div key={it.id} className={styles.itemCard} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 12, border: "1px solid #e8dcc8", marginBottom: 12, alignItems: "center" }}>
                            <div className={styles.itemImage} style={{ width: 96, height: 96, borderRadius: 8, overflow: "hidden", background: "#f5eee0", flexShrink: 0 }}>
                                {it.product?.images?.[0] ? (
                                    <img src={it.product.images[0]} alt={it.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Package size={32} style={{ color: "var(--color-border)" }} />
                                    </div>
                                )}
                            </div>
                            <div className={styles.itemContent} style={{ flex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{it.product?.name}</h3>
                                        {it.product?.seller?.shopName && <div style={{ fontSize: 12, color: "#8a7560" }}>{it.product.seller.shopName}</div>}
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontWeight: 800, color: "var(--color-secondary)", fontSize: 16 }}>₹{(it.product?.price || 0).toLocaleString()}</div>
                                        <div style={{ fontSize: 12, color: "#8a7560" }}>₹{((it.product?.price || 0) * it.quantity).toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className={styles.controls} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                                    <button disabled={updating[it.productId]} onClick={() => updateQuantity(it.productId, Math.max(1, it.quantity - 1))} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #e8dcc8", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                        <Minus size={14} />
                                    </button>
                                    <input value={it.quantity} onChange={(e) => {
                                        const v = Number(e.target.value || 0);
                                        if (Number.isInteger(v) && v >= 0) updateQuantity(it.productId, v);
                                    }} style={{ width: 56, textAlign: "center", padding: "8px", borderRadius: 8, border: "1px solid #e8dcc8" }} />
                                    <button disabled={updating[it.productId]} onClick={() => updateQuantity(it.productId, it.quantity + 1)} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #e8dcc8", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                        <Plus size={14} />
                                    </button>

                                    <button disabled={updating[it.productId]} onClick={() => removeItem(it.productId)} style={{ marginLeft: 8, color: "#c0392b", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                                        <Trash2 size={14} /> Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <aside className={styles.aside}>
                    <h3 style={{ marginTop: 0 }}>Order Summary</h3>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                        <span style={{ color: "#8a7560" }}>Subtotal</span>
                        <strong>₹{total.toLocaleString()}</strong>
                    </div>
                    <div style={{ marginTop: 16 }}>
                        <Link href="/checkout" style={{ display: "block", textAlign: "center", padding: "12px 16px", background: "var(--color-primary)", color: "var(--color-bg-dark)", borderRadius: 8, fontWeight: 700 }}>Proceed to Checkout</Link>
                    </div>
                </aside>
            </div>
        </main>
    );
}