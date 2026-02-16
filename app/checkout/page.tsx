"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
    Loader2, MapPin, CreditCard, ShoppingBag, ChevronRight,
    CheckCircle2, Package, Truck, Plus,
} from "lucide-react";
import Link from "next/link";
import styles from "./checkout.module.css";

interface Address {
    id: string;
    street: string | null;
    city: string | null;
    district: string | null;
    state: string | null;
    zipCode: string | null;
    country: string | null;
    isDefault: boolean;
}

interface CartProduct {
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
    product: CartProduct | null;
}

const STEPS = ["Address", "Payment", "Review"] as const;
type Step = (typeof STEPS)[number];

export default function CheckoutPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [cart, setCart] = useState<{ id: string; items: CartItem[] } | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<string>("");
    const [step, setStep] = useState<Step>("Address");
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState("");

    // New address form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newAddr, setNewAddr] = useState({ street: "", city: "", district: "", state: "", zipCode: "", country: "India" });
    const [savingAddr, setSavingAddr] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const [addrRes, cartRes] = await Promise.all([
                    axios.get("/api/user/adress"),
                    axios.get("/api/user/cart"),
                ]);
                const addrs: Address[] = addrRes.data?.addresses || [];
                setAddresses(addrs);
                const defaultAddr = addrs.find((a) => a.isDefault);
                if (defaultAddr) setSelectedAddress(defaultAddr.id);
                else if (addrs.length) setSelectedAddress(addrs[0].id);

                setCart(cartRes.data?.cart || null);
            } catch {
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const saveNewAddress = async () => {
        if (!newAddr.street?.trim() || !newAddr.city?.trim() || !newAddr.state?.trim() || !newAddr.zipCode?.trim()) {
            setError("Please fill in street, city, state and zip code");
            return;
        }
        setSavingAddr(true);
        setError("");
        try {
            const res = await axios.post("/api/user/adress", newAddr);
            const saved: Address = res.data.address;
            setAddresses((prev) => [...prev, saved]);
            setSelectedAddress(saved.id);
            setShowAddForm(false);
            setNewAddr({ street: "", city: "", district: "", state: "", zipCode: "", country: "India" });
        } catch (e: any) {
            setError(e?.response?.data?.error || "Failed to save address");
        } finally {
            setSavingAddr(false);
        }
    };

    const subtotal = cart?.items.reduce((s, it) => s + (it.product?.price || 0) * it.quantity, 0) ?? 0;

    const placeOrder = async () => {
        if (!selectedAddress) { setError("Please select an address"); return; }
        setPlacing(true);
        setError("");
        try {
            await axios.post("/api/orders", {
                addressId: selectedAddress,
                paymentMethod: "cod",
            });
            router.push("/orders?placed=1");
        } catch (e: any) {
            setError(e?.response?.data?.error || "Order failed. Please try again.");
            setPlacing(false);
        }
    };

    const fmtAddr = (a: Address) =>
        [a.street, a.city, a.district, a.state, a.zipCode, a.country].filter(Boolean).join(", ");

    // ── Loading / empty ──
    if (loading) return (
        <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader2 className="animate-spin" size={28} style={{ color: "var(--color-primary)" }} />
        </main>
    );

    if (!cart || cart.items.length === 0) return (
        <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <ShoppingBag size={56} style={{ color: "var(--color-border)" }} />
            <h2 style={{ color: "var(--color-bg-dark)" }}>Your cart is empty</h2>
            <Link href="/products" style={{ color: "var(--color-primary)", fontWeight: 700 }}>Browse products</Link>
        </main>
    );

    const stepIndex = STEPS.indexOf(step);

    return (
        <main className={styles.container}>
            {/* ── Stepper ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 36 }}>
                {STEPS.map((s, i) => (
                    <div key={s} style={{ display: "flex", alignItems: "center" }}>
                        <div
                            onClick={() => { if (i < stepIndex) setStep(s); }}
                            style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "10px 20px", borderRadius: 50,
                                background: i <= stepIndex ? "var(--color-primary)" : "#f0e6d3",
                                color: i <= stepIndex ? "var(--color-bg-dark)" : "#8a7560",
                                fontWeight: 700, fontSize: 14,
                                cursor: i < stepIndex ? "pointer" : "default",
                                transition: "all .2s",
                            }}
                        >
                            {i < stepIndex ? <CheckCircle2 size={16} /> : <span style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>{i + 1}</span>}
                            {s}
                        </div>
                        {i < STEPS.length - 1 && (
                            <ChevronRight size={18} style={{ margin: "0 4px", color: "#ccc" }} />
                        )}
                    </div>
                ))}
            </div>

            {error && (
                <div style={{
                    background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.2)",
                    color: "#c0392b", padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14,
                }}>
                    {error}
                </div>
            )}

            <div className={styles.grid}>
                {/* ── Left panel ── */}
                <div className={styles.left}>
                    {/* Address step */}
                    {step === "Address" && (
                        <section className={styles.sectionCard}>
                            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
                                <MapPin size={20} style={{ color: "var(--color-primary)" }} /> Select Delivery Address
                            </h2>

                            {addresses.length === 0 && !showAddForm && (
                                <div style={{ textAlign: "center", padding: 32, color: "#8a7560" }}>
                                    <MapPin size={40} style={{ color: "#d4c4a8", marginBottom: 8 }} />
                                    <p>No saved addresses. Add one to continue.</p>
                                </div>
                            )}

                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {addresses.map((a) => (
                                    <label
                                        key={a.id}
                                        style={{
                                            display: "flex", alignItems: "flex-start", gap: 12,
                                            padding: 16, borderRadius: 12,
                                            border: selectedAddress === a.id ? "2px solid var(--color-primary)" : "1px solid #e8dcc8",
                                            background: selectedAddress === a.id ? "rgba(224,161,27,0.06)" : "#fff",
                                            cursor: "pointer", transition: "all .15s",
                                        }}
                                    >
                                        <input
                                            type="radio" name="address"
                                            checked={selectedAddress === a.id}
                                            onChange={() => setSelectedAddress(a.id)}
                                            style={{ marginTop: 3, accentColor: "var(--color-primary)" }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{fmtAddr(a)}</div>
                                            {a.isDefault && (
                                                <span style={{
                                                    display: "inline-block", marginTop: 4,
                                                    fontSize: 10, padding: "2px 8px", borderRadius: 50,
                                                    background: "rgba(224,161,27,0.15)", color: "#9a7520", fontWeight: 600,
                                                }}>
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>

                            {/* Add new address */}
                            {!showAddForm ? (
                                <button onClick={() => setShowAddForm(true)} style={{
                                    marginTop: 16, display: "flex", alignItems: "center", gap: 6,
                                    background: "transparent", border: "1px dashed #d4c4a8",
                                    borderRadius: 10, padding: "12px 20px",
                                    color: "var(--color-primary)", fontWeight: 600, fontSize: 14,
                                    cursor: "pointer", width: "100%", justifyContent: "center",
                                }}>
                                    <Plus size={16} /> Add New Address
                                </button>
                            ) : (
                                <div style={{ marginTop: 16, padding: 16, border: "1px solid #e8dcc8", borderRadius: 12, background: "#fdfaf4" }}>
                                    <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700 }}>New Address</h4>
                                    <div className={styles.addressGrid}>
                                        {(["street", "city", "district", "state", "zipCode", "country"] as const).map((f) => (
                                            <input
                                                key={f}
                                                placeholder={f.charAt(0).toUpperCase() + f.slice(1).replace(/([A-Z])/g, " $1")}
                                                value={newAddr[f]}
                                                onChange={(e) => setNewAddr((p) => ({ ...p, [f]: e.target.value }))}
                                                style={{
                                                    padding: "10px 12px", borderRadius: 8,
                                                    border: "1px solid #e8dcc8", fontSize: 14,
                                                    gridColumn: f === "street" ? "1 / -1" : undefined,
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                                        <button onClick={saveNewAddress} disabled={savingAddr} style={{
                                            padding: "10px 24px", borderRadius: 8,
                                            background: "var(--color-primary)", color: "var(--color-bg-dark)",
                                            fontWeight: 700, border: "none", cursor: "pointer",
                                        }}>
                                            {savingAddr ? "Saving…" : "Save Address"}
                                        </button>
                                        <button onClick={() => setShowAddForm(false)} style={{
                                            padding: "10px 20px", borderRadius: 8,
                                            background: "transparent", border: "1px solid #e8dcc8",
                                            cursor: "pointer", color: "#8a7560",
                                        }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => { if (!selectedAddress) { setError("Please select an address"); return; } setError(""); setStep("Payment"); }}
                                style={{
                                    marginTop: 20, width: "100%", padding: "14px",
                                    borderRadius: 10, background: "var(--color-primary)", color: "var(--color-bg-dark)",
                                    fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                }}
                            >
                                Continue to Payment <ChevronRight size={18} />
                            </button>
                        </section>
                    )}

                    {/* Payment step */}
                    {step === "Payment" && (
                        <section className={styles.sectionCard}>
                            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
                                <CreditCard size={20} style={{ color: "var(--color-primary)" }} /> Payment Method
                            </h2>

                            <label style={{
                                display: "flex", alignItems: "center", gap: 12,
                                padding: 16, borderRadius: 12,
                                border: "2px solid var(--color-primary)",
                                background: "rgba(224,161,27,0.06)",
                                cursor: "pointer",
                            }}>
                                <input type="radio" name="payment" checked readOnly style={{ accentColor: "var(--color-primary)" }} />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 15 }}>💵 Cash on Delivery</div>
                                    <div style={{ fontSize: 12, color: "#8a7560", marginTop: 2 }}>Pay when your order arrives</div>
                                </div>
                            </label>

                            <div style={{
                                margin: "16px 0", padding: "12px 16px", borderRadius: 10,
                                background: "rgba(224,161,27,0.08)", fontSize: 13, color: "#7a5a3a",
                            }}>
                                <Truck size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
                                More payment options (UPI, Card) coming soon!
                            </div>

                            <button
                                onClick={() => { setError(""); setStep("Review"); }}
                                style={{
                                    marginTop: 12, width: "100%", padding: "14px",
                                    borderRadius: 10, background: "var(--color-primary)", color: "var(--color-bg-dark)",
                                    fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                }}
                            >
                                Review Order <ChevronRight size={18} />
                            </button>
                        </section>
                    )}

                    {/* Review step */}
                    {step === "Review" && (
                        <section className={styles.sectionCard}>
                            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
                                <Package size={20} style={{ color: "var(--color-primary)" }} /> Review Your Order
                            </h2>

                            {/* Address summary */}
                            <div style={{ padding: 14, borderRadius: 10, background: "#fdfaf4", marginBottom: 16 }}>
                                <div style={{ fontSize: 12, color: "#8a7560", fontWeight: 600, marginBottom: 4 }}>DELIVERING TO</div>
                                <div style={{ fontSize: 14, fontWeight: 600 }}>
                                    {fmtAddr(addresses.find((a) => a.id === selectedAddress)!)}
                                </div>
                            </div>

                            {/* Payment summary */}
                            <div style={{ padding: 14, borderRadius: 10, background: "#fdfaf4", marginBottom: 16 }}>
                                <div style={{ fontSize: 12, color: "#8a7560", fontWeight: 600, marginBottom: 4 }}>PAYMENT</div>
                                <div style={{ fontSize: 14, fontWeight: 600 }}>💵 Cash on Delivery</div>
                            </div>

                            {/* Items */}
                            <div style={{ fontSize: 12, color: "#8a7560", fontWeight: 600, marginBottom: 8 }}>ITEMS ({cart.items.length})</div>
                            {cart.items.map((it) => (
                                <div key={it.id} style={{
                                    display: "flex", gap: 12, padding: 10,
                                    borderBottom: "1px solid #f0e6d3", alignItems: "center",
                                }}>
                                    <div style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", background: "#f5eee0", flexShrink: 0 }}>
                                        {it.product?.images?.[0] ? (
                                            <img src={it.product.images[0]} alt={it.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <Package size={20} style={{ color: "#d4c4a8" }} />
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600 }}>{it.product?.name}</div>
                                        <div style={{ fontSize: 12, color: "#8a7560" }}>Qty: {it.quantity}</div>
                                    </div>
                                    <div style={{ fontWeight: 700, color: "var(--color-secondary)", fontSize: 15 }}>
                                        ₹{((it.product?.price || 0) * it.quantity).toLocaleString()}
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={placeOrder}
                                disabled={placing}
                                style={{
                                    marginTop: 24, width: "100%", padding: "16px",
                                    borderRadius: 10, background: placing ? "#c4a55a" : "var(--color-primary)",
                                    color: "var(--color-bg-dark)",
                                    fontWeight: 800, fontSize: 16, border: "none", cursor: placing ? "wait" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    boxShadow: "0 4px 20px rgba(224,161,27,0.35)",
                                }}
                            >
                                {placing ? (
                                    <><Loader2 className="animate-spin" size={18} /> Placing Order…</>
                                ) : (
                                    <>Place Order — ₹{subtotal.toLocaleString()}</>
                                )}
                            </button>
                        </section>
                    )}
                </div>

                {/* ── Right sidebar — Order Summary ── */}
                <aside className={styles.right}>
                    <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>Order Summary</h3>

                    {cart.items.map((it) => (
                        <div key={it.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                            <span style={{ color: "#5a4a3a" }}>{it.product?.name} × {it.quantity}</span>
                            <span style={{ fontWeight: 600 }}>₹{((it.product?.price || 0) * it.quantity).toLocaleString()}</span>
                        </div>
                    ))}

                    <div style={{ borderTop: "1px solid #e8dcc8", margin: "12px 0", padding: 0 }} />

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                        <span style={{ color: "#8a7560" }}>Subtotal</span>
                        <strong>₹{subtotal.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginTop: 6 }}>
                        <span style={{ color: "#8a7560" }}>Shipping</span>
                        <span style={{ color: "#2ecc71", fontWeight: 600 }}>FREE</span>
                    </div>

                    <div style={{ borderTop: "1px solid #e8dcc8", margin: "12px 0" }} />

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800 }}>
                        <span>Total</span>
                        <span style={{ color: "var(--color-secondary)" }}>₹{subtotal.toLocaleString()}</span>
                    </div>

                    <div style={{
                        marginTop: 16, padding: "10px 14px", borderRadius: 10,
                        background: "rgba(46,204,113,0.08)", fontSize: 12, color: "#27ae60",
                        display: "flex", alignItems: "center", gap: 6,
                    }}>
                        <Truck size={14} /> Free delivery on all orders
                    </div>
                </aside>
            </div>
        </main>
    );
}
