"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, Package, CheckCircle, XCircle, Clock, ShoppingBag, Truck } from "lucide-react";

interface SellerOrderItem {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: {
        name: string;
        images: string[];
        price: number;
        category: string;
    } | null;
}

interface SellerOrder {
    id: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string | null;
    totalAmount: number;
    finalAmount: number;
    createdAt: string;
    updatedAt: string;
    buyer: {
        name: string;
        email: string;
        phone: string | null;
    };
    items: SellerOrderItem[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    pending: { bg: "rgba(241,196,15,0.12)", text: "#d4a017" },
    confirmed: { bg: "rgba(52,152,219,0.12)", text: "#2980b9" },
    processing: { bg: "rgba(155,89,182,0.12)", text: "#8e44ad" },
    shipped: { bg: "rgba(142,68,173,0.12)", text: "#7d3c98" },
    delivered: { bg: "rgba(46,204,113,0.12)", text: "#27ae60" },
    cancelled: { bg: "rgba(231,76,60,0.12)", text: "#c0392b" },
};

const formatLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function SellerOrdersPage() {
    const [orders, setOrders] = useState<SellerOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<Record<string, boolean>>({});

    useEffect(() => {
        axios.get("/api/seller/orders")
            .then((res) => setOrders(res.data?.orders || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleAction = async (orderId: string, action: "confirmed" | "cancelled" | "shipped") => {
        setUpdating((s) => ({ ...s, [orderId]: true }));
        try {
            const res = await axios.patch("/api/seller/orders", { orderId, action });
            setOrders((prev) =>
                prev.map((o) => o.id === orderId ? { ...o, status: action } : o)
            );
        } catch (e: any) {
            alert(e?.response?.data?.error || `Failed to update order`);
        } finally {
            setUpdating((s) => ({ ...s, [orderId]: false }));
        }
    };

    if (loading) return (
        <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader2 className="animate-spin" size={28} style={{ color: "var(--color-primary)" }} />
        </main>
    );

    return (
        <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 64px" }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Incoming Orders</h1>
            <p style={{ color: "#8a7560", fontSize: 14, marginBottom: 24 }}>
                Manage orders placed for your products. Accept or reject pending orders.
            </p>

            {orders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "64px 0" }}>
                    <ShoppingBag size={56} style={{ color: "#d4c4a8", marginBottom: 12 }} />
                    <h3 style={{ color: "#5a4a3a" }}>No orders yet</h3>
                    <p style={{ color: "#8a7560", fontSize: 14 }}>Orders for your products will appear here.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    {orders.map((order) => {
                        const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                        const isPending = order.status === "pending";
                        const isConfirmed = order.status === "confirmed";
                        const isUpdating = updating[order.id];

                        return (
                            <div key={order.id} style={{
                                border: "1px solid #e8dcc8", borderRadius: 14,
                                overflow: "hidden", background: "#fff",
                            }}>
                                {/* Header */}
                                <div style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "16px 20px", background: "#fdfaf4", borderBottom: "1px solid #f0e6d3",
                                    flexWrap: "wrap", gap: 8,
                                }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-bg-dark)" }}>
                                            Order #{order.id.slice(0, 8).toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: 12, color: "#8a7560", marginTop: 2 }}>
                                            {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: 11, fontWeight: 700, padding: "4px 14px",
                                        borderRadius: 50, background: sc.bg, color: sc.text,
                                        textTransform: "uppercase", letterSpacing: "0.5px",
                                    }}>
                                        {formatLabel(order.status)}
                                    </span>
                                </div>

                                {/* Buyer info */}
                                <div style={{
                                    padding: "12px 20px", borderBottom: "1px solid #f0e6d3",
                                    display: "flex", gap: 24, fontSize: 13, flexWrap: "wrap",
                                }}>
                                    <div>
                                        <span style={{ color: "#8a7560" }}>Buyer: </span>
                                        <strong>{order.buyer.name}</strong>
                                    </div>
                                    {/* donot show the email and number */}
                                    {/* <div>
                                        <span style={{ color: "#8a7560" }}>Email: </span>
                                        <span>{order.buyer.email}</span>
                                    </div> */}
                                    {/* {order.buyer.phone && (
                                        <div>
                                            <span style={{ color: "#8a7560" }}>Phone: </span>
                                            <span>{order.buyer.phone}</span>
                                        </div>
                                    )} */}
                                </div>

                                {/* Items */}
                                <div style={{ padding: "12px 20px" }}>
                                    {order.items.map((item) => (
                                        <div key={item.id} style={{
                                            display: "flex", gap: 12, padding: "8px 0",
                                            alignItems: "center", borderBottom: "1px solid #f5eee0",
                                        }}>
                                            <div style={{ width: 52, height: 52, borderRadius: 8, overflow: "hidden", background: "#f5eee0", flexShrink: 0 }}>
                                                {item.product?.images?.[0] ? (
                                                    <img src={item.product.images[0]} alt={item.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                ) : (
                                                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <Package size={18} style={{ color: "#d4c4a8" }} />
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 14, fontWeight: 600 }}>{item.product?.name || "Product"}</div>
                                                <div style={{ fontSize: 12, color: "#8a7560" }}>
                                                    {formatLabel(item.product?.category || "")} · Qty: {item.quantity}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-secondary)" }}>
                                                    ₹{item.totalPrice.toLocaleString()}
                                                </div>
                                                <div style={{ fontSize: 11, color: "#b0a090" }}>
                                                    ₹{item.unitPrice.toLocaleString()} each
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer with actions */}
                                <div style={{
                                    padding: "14px 20px", background: "#fdfaf4", borderTop: "1px solid #f0e6d3",
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    flexWrap: "wrap", gap: 10,
                                }}>
                                    <div style={{ fontSize: 13 }}>
                                        <span style={{ color: "#8a7560" }}>Payment: </span>
                                        <strong>💵 {order.paymentMethod === "cod" ? "COD" : order.paymentMethod}</strong>
                                        <span style={{ marginLeft: 16, color: "#8a7560" }}>Total: </span>
                                        <strong style={{ color: "var(--color-secondary)" }}>₹{order.finalAmount.toLocaleString()}</strong>
                                    </div>

                                    {isPending && (
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button
                                                onClick={() => handleAction(order.id, "confirmed")}
                                                disabled={isUpdating}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: 6,
                                                    padding: "8px 20px", borderRadius: 8,
                                                    background: "#27ae60", color: "#fff",
                                                    border: "none", fontWeight: 700, fontSize: 13,
                                                    cursor: isUpdating ? "wait" : "pointer",
                                                    opacity: isUpdating ? 0.6 : 1,
                                                }}
                                            >
                                                {isUpdating ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleAction(order.id, "cancelled")}
                                                disabled={isUpdating}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: 6,
                                                    padding: "8px 20px", borderRadius: 8,
                                                    background: "transparent", color: "#c0392b",
                                                    border: "1px solid rgba(192,57,43,0.3)",
                                                    fontWeight: 700, fontSize: 13,
                                                    cursor: isUpdating ? "wait" : "pointer",
                                                    opacity: isUpdating ? 0.6 : 1,
                                                }}
                                            >
                                                {isUpdating ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={14} />}
                                                Reject
                                            </button>
                                        </div>
                                    )}

                                    {isConfirmed && (
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button
                                                onClick={() => handleAction(order.id, "shipped")}
                                                disabled={isUpdating}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: 6,
                                                    padding: "8px 20px", borderRadius: 8,
                                                    background: "#8e44ad", color: "#fff",
                                                    border: "none", fontWeight: 700, fontSize: 13,
                                                    cursor: isUpdating ? "wait" : "pointer",
                                                    opacity: isUpdating ? 0.6 : 1,
                                                }}
                                            >
                                                {isUpdating ? <Loader2 className="animate-spin" size={14} /> : <Truck size={14} />}
                                                Dispatch Order
                                            </button>
                                            <button
                                                onClick={() => handleAction(order.id, "cancelled")}
                                                disabled={isUpdating}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: 6,
                                                    padding: "8px 20px", borderRadius: 8,
                                                    background: "transparent", color: "#c0392b",
                                                    border: "1px solid rgba(192,57,43,0.3)",
                                                    fontWeight: 700, fontSize: 13,
                                                    cursor: isUpdating ? "wait" : "pointer",
                                                    opacity: isUpdating ? 0.6 : 1,
                                                }}
                                            >
                                                {isUpdating ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={14} />}
                                                Cancel
                                            </button>
                                        </div>
                                    )}

                                    {!["pending", "confirmed"].includes(order.status) && (
                                        <div style={{
                                            display: "flex", alignItems: "center", gap: 6,
                                            fontSize: 13, fontWeight: 600,
                                            color: sc.text,
                                        }}>
                                            {order.status === "shipped" && <Truck size={14} />}
                                            {order.status === "cancelled" && <XCircle size={14} />}
                                            {order.status === "delivered" && <CheckCircle size={14} />}
                                            {!["shipped", "cancelled", "delivered"].includes(order.status) && <Clock size={14} />}
                                            {formatLabel(order.status)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
