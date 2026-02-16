"use client";

import { useEffect, useState, use } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    Loader2, ArrowLeft, Star, ShoppingCart, Zap, Package, MapPin, Truck,
    Shield, ChevronLeft, ChevronRight, Heart, Share2, Tag, Ruler, Weight,
    Palette, Sparkles, Scissors, Plus, Minus,
} from "lucide-react";
import styles from "./product.module.css";

const formatLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

interface Review {
    id: string;
    rating: number;
    comment: string;
    pictures: string[];
    createdAt: string;
    user: {
        userProfile: {
            firstName: string | null;
            lastName: string | null;
        } | null;
    };
}

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    mrp: number | null;
    stock: number;
    category: string;
    subCategory: string | null;
    fabricType: string | null;
    weaveType: string | null;
    occasion: string[];
    color: string | null;
    pattern: string | null;
    length: number | null;
    width: number | null;
    weight: number | null;
    blouseIncluded: boolean;
    washCare: string | null;
    origin: string | null;
    images: string[];
    isAvailable: boolean;
    isFeatured: boolean;
    tags: string[];
    sku: string | null;
    seller: {
        shopName: string | null;
        sellerAddress: { city: string | null; state: string | null } | null;
    };
    productReviews: Review[];
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [avgRating, setAvgRating] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [authenticated, setAuthenticated] = useState(false);
    const [adding, setAdding] = useState(false);
    const [cartQty, setCartQty] = useState<number | null>(null);
    const [imgZoom, setImgZoom] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`/api/products/${id}`);
                setProduct(res.data.product);
                setAvgRating(res.data.avgRating);
            } catch (err: any) {
                setError(err?.response?.data?.error || "Product not found");
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();

        // Check auth
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => setAuthenticated(Boolean(data?.user)));
    }, [id]);

    useEffect(() => {
        if (!authenticated) {
            setCartQty(null);
            return;
        }

        const fetchCartStatus = async () => {
            try {
                const res = await axios.get(`/api/user/cart`);
                const items = res.data?.cart?.items || [];
                const found = items.find((it: any) => it.productId === id);
                setCartQty(found ? found.quantity : 0);
            } catch (err) {
                setCartQty(0);
            }
        };
        fetchCartStatus();
    }, [authenticated, id]);

    const handleCartAction = async () => {
        if (!authenticated) {
            router.push("/login");
            return;
        }
        if (!inStock) return;
        if (cartQty && cartQty > 0) {
            alert("Already added to cart");
            return;
        }
        try {
            setAdding(true);
            await axios.post(`/api/user/cart`, { productId: id, quantity: 1 });
            // simple feedback; can be replaced with toast later
            alert("Added to cart");
            setCartQty(1);
        } catch (err: any) {
            alert(err?.response?.data?.error || "Could not add to cart");
        } finally {
            setAdding(false);
        }
    };

    const changeQuantity = async (newQty: number) => {
        if (!authenticated) {
            router.push("/login");
            return;
        }
        if (!inStock && newQty > 0) return;
        try {
            setAdding(true);
            const res = await axios.patch(`/api/user/cart`, { productId: id, quantity: newQty });
            if (res.data?.removed) {
                setCartQty(0);
            } else if (res.data?.item) {
                setCartQty(res.data.item.quantity);
            }
        } catch (err: any) {
            alert(err?.response?.data?.error || "Could not update cart");
        } finally {
            setAdding(false);
        }
    };

    const handleBuyNow = async () => {
        if (!authenticated) {
            router.push("/login");
            return;
        }
        try {
            setAdding(true);
            // Add to cart if not already there
            if (!cartQty || cartQty === 0) {
                await axios.post(`/api/user/cart`, { productId: id, quantity: 1 });
                setCartQty(1);
            }
            router.push("/checkout");
        } catch (err: any) {
            alert(err?.response?.data?.error || "Could not proceed to checkout");
        } finally {
            setAdding(false);
        }
    };

    if (loading) {
        return (
            <main style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Loader2 className="animate-spin" size={36} style={{ color: "var(--color-primary)" }} />
            </main>
        );
    }

    if (error || !product) {
        return (
            <main style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <Package size={56} style={{ color: "var(--color-border)", marginBottom: 16 }} />
                    <h2 style={{ color: "var(--color-bg-dark)", fontSize: 20, marginBottom: 8 }}>{error || "Product not found"}</h2>
                    <Link href="/products" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
                        ← Back to Products
                    </Link>
                </div>
            </main>
        );
    }

    const discount = product.mrp && product.mrp > product.price
        ? Math.round((1 - product.price / product.mrp) * 100)
        : null;

    const inStock = product.stock > 0 && product.isAvailable;

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                size={14}
                style={{
                    color: i < Math.round(rating) ? "var(--color-primary)" : "#d4c4a8",
                    fill: i < Math.round(rating) ? "var(--color-primary)" : "none",
                }}
            />
        ));
    };

    // Detail row helper
    const DetailRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(224,161,27,0.08)" }}>
            <span style={{ color: "var(--color-primary)", flexShrink: 0 }}>{icon}</span>
            <span style={{ fontSize: 13, color: "#8a7560", fontWeight: 600, minWidth: 100 }}>{label}</span>
            <span style={{ fontSize: 13, color: "var(--color-bg-dark)" }}>{value}</span>
        </div>
    );

    return (
        <main style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-light)" }}>

            {/* Breadcrumb */}
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 24px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8a7560" }}>
                    <Link href="/home" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>Home</Link>
                    <span>›</span>
                    <Link href="/products" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>Products</Link>
                    <span>›</span>
                    <Link href={`/products?category=${product.category}`} style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>
                        {formatLabel(product.category)}
                    </Link>
                    <span>›</span>
                    <span style={{ color: "var(--color-bg-dark)" }}>{product.name}</span>
                </div>
            </div>

            {/* Main Product Section */}
            <div className={styles.productGrid}>

                {/* ═══ LEFT: Image Gallery ═══ */}
                <div className={styles.imageSection}>
                    {/* Main Image */}
                    <div className={styles.mainImage} onClick={() => setImgZoom(!imgZoom)}>
                        {product.images[selectedImage] ? (
                            <img
                                src={product.images[selectedImage]}
                                alt={product.name}
                                style={{
                                    width: "100%", height: "100%", objectFit: imgZoom ? "contain" : "cover",
                                    transition: "all .3s ease",
                                    transform: imgZoom ? "scale(1.5)" : "scale(1)",
                                }}
                            />
                        ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Package size={64} style={{ color: "var(--color-border)" }} />
                            </div>
                        )}

                        {/* Discount badge */}
                        {discount && (
                            <span style={{
                                position: "absolute", top: 12, left: 12,
                                backgroundColor: "var(--color-secondary)", color: "#fff",
                                padding: "4px 12px", borderRadius: 50,
                                fontSize: 12, fontWeight: 700,
                            }}>
                                {discount}% OFF
                            </span>
                        )}

                        {/* Featured badge */}
                        {product.isFeatured && (
                            <span style={{
                                position: "absolute", top: 12, right: 12,
                                backgroundColor: "var(--color-primary)", color: "var(--color-bg-dark)",
                                padding: "4px 12px", borderRadius: 50,
                                fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4,
                            }}>
                                <Sparkles size={12} /> Featured
                            </span>
                        )}

                        {/* Image nav arrows */}
                        {product.images.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1)); }}
                                    style={{
                                        position: "absolute", top: "50%", left: 8, transform: "translateY(-50%)",
                                        width: 36, height: 36, borderRadius: "50%",
                                        backgroundColor: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                    }}
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedImage((prev) => (prev + 1) % product.images.length); }}
                                    style={{
                                        position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)",
                                        width: 36, height: 36, borderRadius: "50%",
                                        backgroundColor: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                    }}
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {product.images.length > 1 && (
                        <div className={styles.thumbnails}>
                            {product.images.map((img, i) => (
                                <div
                                    key={i}
                                    onClick={() => setSelectedImage(i)}
                                    style={{
                                        width: 64, height: 64, borderRadius: 10, overflow: "hidden",
                                        border: selectedImage === i ? "2px solid var(--color-primary)" : "1px solid #e8dcc8",
                                        cursor: "pointer", flexShrink: 0,
                                        opacity: selectedImage === i ? 1 : 0.6,
                                        transition: "all .2s",
                                    }}
                                >
                                    <img src={img} alt={`${product.name} ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ═══ RIGHT: Product Info ═══ */}
                <div className={styles.infoSection}>
                    {/* Seller */}
                    {product.seller.shopName && (
                        <p style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                            {product.seller.shopName}
                        </p>
                    )}

                    {/* Name */}
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-bg-dark)", marginBottom: 8, lineHeight: 1.3 }}>
                        {product.name}
                    </h1>

                    {/* Ratings */}
                    {avgRating !== null && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                            <div style={{ display: "flex", gap: 2 }}>{renderStars(avgRating)}</div>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-bg-dark)" }}>{avgRating.toFixed(1)}</span>
                            <span style={{ fontSize: 12, color: "#8a7560" }}>({product.productReviews.length} {product.productReviews.length === 1 ? "review" : "reviews"})</span>
                        </div>
                    )}

                    {/* Price */}
                    <div style={{
                        padding: "16px 20px", borderRadius: 12,
                        backgroundColor: "rgba(224,161,27,0.06)", border: "1px solid rgba(224,161,27,0.12)",
                        marginBottom: 20,
                    }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                            <span style={{ fontSize: 28, fontWeight: 800, color: "var(--color-secondary)" }}>₹{product.price.toLocaleString()}</span>
                            {product.mrp && product.mrp > product.price && (
                                <>
                                    <span style={{ fontSize: 16, color: "#b0a090", textDecoration: "line-through" }}>₹{product.mrp.toLocaleString()}</span>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: "#2d6a2d", backgroundColor: "rgba(34,139,34,0.08)", padding: "2px 10px", borderRadius: 50 }}>
                                        Save {discount}%
                                    </span>
                                </>
                            )}
                        </div>
                        <p style={{ fontSize: 11, color: "#8a7560", marginTop: 4 }}>Inclusive of all taxes</p>
                    </div>

                    {/* Stock Status */}
                    <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                            width: 8, height: 8, borderRadius: "50%",
                            backgroundColor: inStock ? "#2d6a2d" : "#c0392b",
                        }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: inStock ? "#2d6a2d" : "#c0392b" }}>
                            {inStock ? (product.stock <= 5 ? `Only ${product.stock} left!` : "In Stock") : "Out of Stock"}
                        </span>
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ fontSize: 14, lineHeight: 1.7, color: "#5a4a3a" }}>
                            {product.description}
                        </p>
                    </div>

                    {/* Quick Tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
                        <span style={tagStyle}>{formatLabel(product.category)}</span>
                        {product.subCategory && <span style={tagStyle}>{formatLabel(product.subCategory)}</span>}
                        {product.fabricType && <span style={tagStyle}>{formatLabel(product.fabricType)}</span>}
                        {product.weaveType && <span style={tagStyle}>{formatLabel(product.weaveType)}</span>}
                        {product.color && <span style={tagStyle}>{formatLabel(product.color)}</span>}
                        {product.pattern && <span style={tagStyle}>{formatLabel(product.pattern)}</span>}
                        {product.occasion.map((o) => <span key={o} style={tagStyle}>{formatLabel(o)}</span>)}
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.actionButtons}>
                        {cartQty && cartQty > 0 ? (
                            <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1 }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <div style={{ fontSize: 12, color: "#8a7560", fontWeight: 700 }}>Already in cart</div>
                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <button
                                            onClick={() => changeQuantity(Math.max(0, (cartQty || 0) - 1))}
                                            disabled={adding}
                                            style={{ width: 44, height: 40, borderRadius: 10, border: "1px solid #e8dcc8", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <input
                                            value={cartQty}
                                            onChange={(e) => {
                                                const v = Number(e.target.value || 0);
                                                if (!Number.isNaN(v)) changeQuantity(Math.max(0, Math.floor(v)));
                                            }}
                                            style={{ width: 64, textAlign: "center", padding: "10px", borderRadius: 10, border: "1px solid #e8dcc8" }}
                                        />
                                        <button
                                            onClick={() => changeQuantity((cartQty || 0) + 1)}
                                            disabled={adding}
                                            style={{ width: 44, height: 40, borderRadius: 10, border: "1px solid #e8dcc8", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleCartAction}
                                disabled={!inStock || adding}
                                style={{
                                    flex: 1, padding: "14px 24px", borderRadius: 12,
                                    border: "2px solid var(--color-primary)", backgroundColor: "transparent",
                                    color: "var(--color-primary)", fontWeight: 700, fontSize: 14,
                                    cursor: inStock ? "pointer" : "not-allowed",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    opacity: inStock ? 1 : 0.5, transition: "all .2s",
                                }}
                                onMouseEnter={(e) => { if (inStock) { e.currentTarget.style.backgroundColor = "rgba(224,161,27,0.08)"; } }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                            >
                                <ShoppingCart size={18} /> Add to Cart
                            </button>
                        )}

                        <button
                            onClick={handleBuyNow}
                            disabled={!inStock || adding}
                            style={{
                                flex: 1, padding: "14px 24px", borderRadius: 12,
                                border: "none", backgroundColor: "var(--color-primary)",
                                color: "var(--color-bg-dark)", fontWeight: 700, fontSize: 14,
                                cursor: inStock ? "pointer" : "not-allowed",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                opacity: inStock ? 1 : 0.5, transition: "all .2s",
                                boxShadow: "0 4px 15px rgba(224,161,27,0.3)",
                            }}
                            onMouseEnter={(e) => { if (inStock) { e.currentTarget.style.transform = "translateY(-1px)"; } }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                        >
                            <Zap size={18} /> Buy Now
                        </button>
                    </div>

                    {/* Trust badges */}
                    <div style={{ display: "flex", gap: 16, padding: "16px 0", borderTop: "1px solid #e8dcc8", borderBottom: "1px solid #e8dcc8", marginBottom: 20 }}>
                        {[
                            { icon: <Truck size={16} />, text: "Free Shipping" },
                            { icon: <Shield size={16} />, text: "Authentic Product" },
                            { icon: <Package size={16} />, text: "Easy Returns" },
                        ].map((item, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#8a7560", fontWeight: 600 }}>
                                <span style={{ color: "var(--color-primary)" }}>{item.icon}</span>
                                {item.text}
                            </div>
                        ))}
                    </div>

                    {/* Seller info */}
                    {product.seller.shopName && (
                        <div style={{
                            padding: 14, borderRadius: 10,
                            backgroundColor: "rgba(224,161,27,0.04)", border: "1px solid rgba(224,161,27,0.1)",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <MapPin size={14} style={{ color: "var(--color-primary)" }} />
                                <span style={{ fontSize: 13, color: "var(--color-bg-dark)", fontWeight: 600 }}>
                                    Sold by {product.seller.shopName}
                                </span>
                                {product.seller.sellerAddress && (
                                    <span style={{ fontSize: 11, color: "#8a7560" }}>
                                        • {[product.seller.sellerAddress.city, product.seller.sellerAddress.state].filter(Boolean).join(", ")}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ PRODUCT DETAILS TABLE ═══ */}
            <div className={styles.detailsWrapper}>
                <div className={styles.detailsCard}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-bg-dark)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                        <Tag size={18} style={{ color: "var(--color-primary)" }} /> Product Details
                    </h2>
                    <div className={styles.detailsGrid}>
                        <DetailRow icon={<Package size={14} />} label="Category" value={formatLabel(product.category)} />
                        {product.subCategory && <DetailRow icon={<Tag size={14} />} label="Sub-category" value={formatLabel(product.subCategory)} />}
                        {product.fabricType && <DetailRow icon={<Scissors size={14} />} label="Fabric" value={formatLabel(product.fabricType)} />}
                        {product.weaveType && <DetailRow icon={<Sparkles size={14} />} label="Weave" value={formatLabel(product.weaveType)} />}
                        {product.color && <DetailRow icon={<Palette size={14} />} label="Color" value={formatLabel(product.color)} />}
                        {product.pattern && <DetailRow icon={<Sparkles size={14} />} label="Pattern" value={formatLabel(product.pattern)} />}
                        {product.origin && <DetailRow icon={<MapPin size={14} />} label="Origin" value={product.origin} />}
                        {product.length && <DetailRow icon={<Ruler size={14} />} label="Length" value={`${product.length} m`} />}
                        {product.width && <DetailRow icon={<Ruler size={14} />} label="Width" value={`${product.width} m`} />}
                        {product.weight && <DetailRow icon={<Weight size={14} />} label="Weight" value={`${product.weight} g`} />}
                        <DetailRow icon={<Package size={14} />} label="Blouse" value={product.blouseIncluded ? "Included" : "Not included"} />
                        {product.washCare && <DetailRow icon={<Shield size={14} />} label="Wash Care" value={product.washCare} />}
                        {product.occasion.length > 0 && <DetailRow icon={<Star size={14} />} label="Occasion" value={product.occasion.map(formatLabel).join(", ")} />}
                        {product.sku && <DetailRow icon={<Tag size={14} />} label="SKU" value={product.sku} />}
                    </div>

                    {/* Tags */}
                    {product.tags.length > 0 && (
                        <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(224,161,27,0.1)" }}>
                            <span style={{ fontSize: 12, color: "#8a7560", fontWeight: 600 }}>Tags: </span>
                            {product.tags.map((t) => (
                                <span key={t} style={{
                                    display: "inline-block", fontSize: 11, padding: "2px 10px",
                                    borderRadius: 50, backgroundColor: "rgba(224,161,27,0.08)",
                                    color: "#9a7520", marginRight: 6, marginBottom: 4,
                                }}>
                                    {t}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ REVIEWS SECTION ═══ */}
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 64px" }}>
                <div style={{
                    backgroundColor: "var(--color-bg-light)", border: "1px solid #e8dcc8",
                    borderRadius: 16, padding: "28px 32px",
                }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-bg-dark)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                        <Star size={18} style={{ color: "var(--color-primary)" }} /> Customer Reviews
                        <span style={{ fontSize: 13, fontWeight: 400, color: "#8a7560" }}>
                            ({product.productReviews.length})
                        </span>
                    </h2>

                    {product.productReviews.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 0", color: "#8a7560" }}>
                            <Star size={32} style={{ color: "var(--color-border)", marginBottom: 8 }} />
                            <p>No reviews yet. Be the first to review this product!</p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: 16 }}>
                            {product.productReviews.map((review) => {
                                const name = review.user?.userProfile
                                    ? `${review.user.userProfile.firstName ?? ""} ${review.user.userProfile.lastName ?? ""}`.trim()
                                    : "Anonymous";
                                return (
                                    <div key={review.id} style={{
                                        padding: 16, borderRadius: 12,
                                        backgroundColor: "rgba(224,161,27,0.03)", border: "1px solid rgba(224,161,27,0.08)",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                {/* Avatar */}
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: "50%",
                                                    backgroundColor: "rgba(224,161,27,0.12)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: 14, fontWeight: 700, color: "var(--color-primary)",
                                                }}>
                                                    {name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-bg-dark)" }}>{name}</p>
                                                    <div style={{ display: "flex", gap: 2, marginTop: 2 }}>{renderStars(review.rating)}</div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: 11, color: "#a09080" }}>
                                                {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#5a4a3a" }}>{review.comment}</p>
                                        {review.pictures.length > 0 && (
                                            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                                                {review.pictures.map((pic, i) => (
                                                    <a key={i} href={pic} target="_blank" rel="noopener noreferrer">
                                                        <img src={pic} alt="Review" style={{ width: 72, height: 72, borderRadius: 8, objectFit: "cover", border: "1px solid #e8dcc8" }} />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

/* ── Reusable tag style ── */
const tagStyle: React.CSSProperties = {
    fontSize: 11, padding: "3px 12px",
    borderRadius: 50,
    backgroundColor: "rgba(224,161,27,0.1)",
    color: "#9a7520", fontWeight: 600,
};
