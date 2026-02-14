"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, Package, Star, ArrowRight } from "lucide-react";
import Link from "next/link";

const formatLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    mrp: number | null;
    category: string;
    fabricType: string | null;
    origin: string | null;
    images: string[];
    seller: { shopName: string | null };
    productReviews: { rating: number }[];
}

export default function HomePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [featured, setFeatured] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [allRes, featRes] = await Promise.all([
                    axios.get("/api/products?sort=newest"),
                    axios.get("/api/products?featured=true"),
                ]);
                setProducts(allRes.data.products || []);
                setFeatured(featRes.data.products || []);
            } catch {
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const avgRating = (reviews: { rating: number }[]) => {
        if (!reviews.length) return null;
        return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
    };

    return (
        <main style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-light)" }}>
            {/* Heritage Hero */}
            <section
                style={{
                    background: "linear-gradient(135deg, var(--color-bg-dark) 0%, #4A2A14 50%, var(--color-bg-card) 100%)",
                    padding: "80px 24px 70px",
                    textAlign: "center",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Decorative pattern overlay */}
                <div style={{
                    position: "absolute", inset: 0, opacity: 0.06,
                    backgroundImage: "radial-gradient(circle at 20% 50%, var(--color-primary) 1px, transparent 1px), radial-gradient(circle at 80% 50%, var(--color-primary) 1px, transparent 1px)",
                    backgroundSize: "60px 60px",
                }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                    <p style={{
                        color: "var(--color-primary)",
                        fontSize: "0.85rem",
                        letterSpacing: "3px",
                        textTransform: "uppercase",
                        marginBottom: 12,
                        fontWeight: 500,
                    }}>
                        ✦ Handcrafted with Heritage ✦
                    </p>
                    <h1 style={{
                        color: "var(--color-text-light)",
                        fontSize: "clamp(2rem, 5vw, 3.2rem)",
                        fontWeight: 700,
                        marginBottom: 16,
                        lineHeight: 1.2,
                    }}>
                        Discover Authentic<br />Indian Textiles
                    </h1>
                    <p style={{
                        color: "var(--color-text-muted)",
                        fontSize: "1.05rem",
                        maxWidth: 550,
                        margin: "0 auto 36px",
                        lineHeight: 1.6,
                    }}>
                        Handpicked sarees, fabrics &amp; more from master weavers and artisans across India
                    </p>
                    <Link
                        href="/products"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "14px 32px",
                            backgroundColor: "var(--color-primary)",
                            color: "var(--color-bg-dark)",
                            borderRadius: 50,
                            fontWeight: 600,
                            fontSize: "0.95rem",
                            textDecoration: "none",
                            transition: "all .2s",
                            boxShadow: "0 4px 20px rgba(224,161,27,0.35)",
                        }}
                    >
                        Browse Collection <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

            {/* Featured Products */}
            {featured.length > 0 && (
                <section style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-bg-dark)", display: "flex", alignItems: "center", gap: 8 }}>
                            <Star size={20} style={{ color: "var(--color-primary)" }} /> Featured Collection
                        </h2>
                        <Link href="/products" style={{ fontSize: "0.85rem", color: "var(--color-primary)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                            View all <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                        {featured.slice(0, 4).map((p) => (
                            <ProductCard key={p.id} product={p} avgRating={avgRating} />
                        ))}
                    </div>
                </section>
            )}

            {/* All Products */}
            <section style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 64px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-bg-dark)", display: "flex", alignItems: "center", gap: 8 }}>
                        <Package size={20} /> All Products
                    </h2>
                    <Link href="/products" style={{ fontSize: "0.85rem", color: "var(--color-primary)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                        View all <ArrowRight size={14} />
                    </Link>
                </div>

                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
                        <Loader2 className="animate-spin" size={32} style={{ color: "var(--color-primary)" }} />
                    </div>
                ) : products.length === 0 ? (
                    <div style={{
                        textAlign: "center",
                        padding: "64px 0",
                        backgroundColor: "rgba(224,161,27,0.06)",
                        borderRadius: 16,
                        border: "1px dashed var(--color-border)",
                    }}>
                        <Package size={48} style={{ color: "var(--color-border)", marginBottom: 12 }} />
                        <p style={{ color: "#8a7560" }}>No products available yet</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                        {products.map((p) => (
                            <ProductCard key={p.id} product={p} avgRating={avgRating} />
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

function ProductCard({
    product,
    avgRating,
}: {
    product: Product;
    avgRating: (r: { rating: number }[]) => string | null;
}) {
    const rating = avgRating(product.productReviews);
    const discount =
        product.mrp && product.mrp > product.price
            ? Math.round((1 - product.price / product.mrp) * 100)
            : null;

    return (
        <Link href={`/products/${product.id}`} style={{ textDecoration: "none" }}>
            <div style={{
                border: "1px solid #e8dcc8",
                borderRadius: 12,
                backgroundColor: "var(--color-bg-light)",
                overflow: "hidden",
                transition: "box-shadow .25s, transform .25s",
                cursor: "pointer",
            }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(90,58,34,0.15)";
                    e.currentTarget.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                }}
            >
                <div style={{ position: "relative", aspectRatio: "3/4", backgroundColor: "#f0e6d3", overflow: "hidden" }}>
                    {product.images[0] ? (
                        <img
                            src={product.images[0]}
                            alt={product.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s" }}
                        />
                    ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Package size={36} style={{ color: "var(--color-border)" }} />
                        </div>
                    )}
                    {discount && (
                        <span style={{
                            position: "absolute", top: 8, right: 8,
                            fontSize: 10, fontWeight: 600,
                            backgroundColor: "var(--color-secondary)", color: "#fff",
                            padding: "2px 8px", borderRadius: 50,
                        }}>
                            {discount}% OFF
                        </span>
                    )}
                </div>
                <div style={{ padding: 12 }}>
                    {product.seller.shopName && (
                        <p style={{ fontSize: 10, color: "#a09080", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>
                            {product.seller.shopName}
                        </p>
                    )}
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-bg-dark)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {product.name}
                    </h3>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--color-secondary)" }}>₹{product.price}</span>
                        {product.mrp && product.mrp > product.price && (
                            <span style={{ fontSize: 12, color: "#b0a090", textDecoration: "line-through" }}>₹{product.mrp}</span>
                        )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            <span style={{
                                fontSize: 10, padding: "2px 8px", borderRadius: 50,
                                backgroundColor: "rgba(224,161,27,0.12)", color: "#9a7520",
                            }}>
                                {formatLabel(product.category)}
                            </span>
                            {product.fabricType && (
                                <span style={{
                                    fontSize: 10, padding: "2px 8px", borderRadius: 50,
                                    backgroundColor: "rgba(90,58,34,0.08)", color: "#7a5a3a",
                                }}>
                                    {formatLabel(product.fabricType)}
                                </span>
                            )}
                        </div>
                        {rating && (
                            <span style={{ fontSize: 10, color: "var(--color-primary)", fontWeight: 600 }}>⭐ {rating}</span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
