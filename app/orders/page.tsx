"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, Package, ShoppingBag, CheckCircle2, Truck, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface OrderItem {
  id: string;
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

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  totalAmount: number;
  finalAmount: number;
  createdAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  cancelledAt: string | null;
  items: OrderItem[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "rgba(241,196,15,0.12)", text: "#d4a017" },
  confirmed: { bg: "rgba(52,152,219,0.12)", text: "#2980b9" },
  processing: { bg: "rgba(155,89,182,0.12)", text: "#8e44ad" },
  shipped: { bg: "rgba(142,68,173,0.12)", text: "#7d3c98" },
  out_for_delivery: { bg: "rgba(230,126,34,0.12)", text: "#d35400" },
  delivered: { bg: "rgba(46,204,113,0.12)", text: "#27ae60" },
  cancelled: { bg: "rgba(231,76,60,0.12)", text: "#c0392b" },
  returned: { bg: "rgba(149,165,166,0.12)", text: "#7f8c8d" },
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null;

const formatLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const justPlaced = searchParams.get("placed") === "1";

  useEffect(() => {
    axios.get("/api/orders")
      .then((res) => setOrders(res.data?.orders || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 className="animate-spin" size={28} style={{ color: "var(--color-primary)" }} />
    </main>
  );

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 64px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Your Orders</h1>

      {justPlaced && (
        <div style={{
          background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.25)",
          color: "#27ae60", padding: "14px 18px", borderRadius: 12, marginBottom: 20,
          fontWeight: 600, fontSize: 14,
        }}>
          Order placed successfully! The seller will review your order shortly.
        </div>
      )}

      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <ShoppingBag size={56} style={{ color: "#d4c4a8", marginBottom: 12 }} />
          <h3 style={{ color: "#5a4a3a" }}>No orders yet</h3>
          <Link href="/products" style={{ color: "var(--color-primary)", fontWeight: 700, fontSize: 14 }}>
            Start shopping →
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {orders.map((order) => {
            const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
            return (
              <div
                key={order.id}
                style={{
                  border: "1px solid #e8dcc8", borderRadius: 14,
                  overflow: "hidden", background: "#fff",
                }}
              >
                {/* Header */}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 20px", background: "#fdfaf4", borderBottom: "1px solid #f0e6d3",
                  flexWrap: "wrap", gap: 8,
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#8a7560" }}>
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 12, color: "#b0a090", marginTop: 2 }}>
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "4px 12px",
                      borderRadius: 50, background: sc.bg, color: sc.text,
                      textTransform: "uppercase", letterSpacing: "0.5px",
                    }}>
                      {formatLabel(order.status)}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: 16, color: "var(--color-secondary)" }}>
                      ₹{order.finalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Timeline */}
                {order.status !== "cancelled" ? (
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0e6d3" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
                      {/* Ordered */}
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", margin: "0 auto 6px",
                          background: "#27ae60", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <CheckCircle2 size={16} color="#fff" />
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#27ae60" }}>Ordered</div>
                        <div style={{ fontSize: 10, color: "#8a7560", marginTop: 2 }}>
                          {fmtDate(order.createdAt)}
                        </div>
                      </div>
                      {/* Connector */}
                      <div style={{
                        flex: 0.6, height: 3, marginTop: 15, borderRadius: 2,
                        background: order.confirmedAt ? "#27ae60" : "#e8dcc8",
                      }} />
                      {/* Accepted */}
                      <div style={{ flex: 1, textAlign: "center", opacity: order.confirmedAt ? 1 : 0.4 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", margin: "0 auto 6px",
                          background: order.confirmedAt ? "#27ae60" : "#e8dcc8",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {order.confirmedAt
                            ? <CheckCircle2 size={16} color="#fff" />
                            : <Clock size={14} color="#8a7560" />}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: order.confirmedAt ? "#27ae60" : "#8a7560" }}>Accepted</div>
                        <div style={{ fontSize: 10, color: "#8a7560", marginTop: 2 }}>
                          {fmtDate(order.confirmedAt) || "Pending"}
                        </div>
                      </div>
                      {/* Connector */}
                      <div style={{
                        flex: 0.6, height: 3, marginTop: 15, borderRadius: 2,
                        background: order.shippedAt ? "#27ae60" : "#e8dcc8",
                      }} />
                      {/* Dispatched */}
                      <div style={{ flex: 1, textAlign: "center", opacity: order.shippedAt ? 1 : 0.4 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", margin: "0 auto 6px",
                          background: order.shippedAt ? "#27ae60" : "#e8dcc8",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {order.shippedAt
                            ? <Truck size={16} color="#fff" />
                            : <Truck size={14} color="#8a7560" />}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: order.shippedAt ? "#27ae60" : "#8a7560" }}>Dispatched</div>
                        <div style={{ fontSize: 10, color: "#8a7560", marginTop: 2 }}>
                          {fmtDate(order.shippedAt) || "Pending"}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: "12px 20px", borderBottom: "1px solid #f0e6d3",
                    display: "flex", alignItems: "center", gap: 8,
                    color: "#c0392b", fontSize: 13, fontWeight: 600,
                  }}>
                    <XCircle size={16} /> Order cancelled
                    {order.cancelledAt && (
                      <span style={{ fontWeight: 400, color: "#8a7560", marginLeft: 4 }}>
                        on {fmtDate(order.cancelledAt)}
                      </span>
                    )}
                  </div>
                )}

                {/* Items */}
                <div style={{ padding: "12px 20px" }}>
                  {order.items.map((item) => (
                    <div key={item.id} style={{ display: "flex", gap: 12, padding: "8px 0", alignItems: "center", borderBottom: "1px solid #f5eee0" }}>
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
                          Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString()}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>₹{item.totalPrice.toLocaleString()}</div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div style={{
                  padding: "10px 20px", background: "#fdfaf4", borderTop: "1px solid #f0e6d3",
                  fontSize: 12, color: "#8a7560", display: "flex", justifyContent: "space-between",
                }}>
                  <span>💵 {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod}</span>
                  <span style={{ fontWeight: 600, color: STATUS_COLORS[order.paymentStatus]?.text || "#8a7560" }}>
                    {formatLabel(order.paymentStatus)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}