"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
    Package, Plus, Minus, X, Upload, Loader2, Eye, EyeOff,
    ArrowLeft, Check, Tag, Ruler, Weight, Scissors, MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Enum options from the schema
const CATEGORIES = [
    { value: "saree", label: "Saree" },
    { value: "lehenga", label: "Lehenga" },
    { value: "dupatta", label: "Dupatta" },
    { value: "dress_material", label: "Dress Material" },
    { value: "blouse_piece", label: "Blouse Piece" },
    { value: "raw_fabric", label: "Raw Fabric" },
    { value: "kurta", label: "Kurta" },
    { value: "top", label: "Top" },
    { value: "bottom", label: "Bottom" },
    { value: "stole", label: "Stole" },
];

const FABRIC_TYPES = [
    "silk", "cotton", "linen", "chiffon", "georgette", "crepe", "satin",
    "velvet", "net", "organza", "banarasi", "tussar", "chanderi", "jute",
    "polyester", "rayon", "khadi", "muslin",
];

const WEAVE_TYPES = [
    "handloom", "powerloom", "machine_made", "hand_embroidered",
    "block_print", "screen_print", "digital_print",
];

const OCCASIONS = [
    "wedding", "festive", "casual", "party", "office", "daily_wear", "bridal", "puja",
];

const COLORS = [
    "red", "blue", "green", "yellow", "orange", "pink", "purple", "white",
    "black", "maroon", "gold", "silver", "beige", "cream", "brown",
    "multi_color", "off_white", "magenta", "turquoise", "peach", "coral",
    "teal", "navy", "olive", "lavender", "rust", "wine", "emerald", "sky_blue", "pastel",
];

const PATTERNS = [
    "plain", "printed", "woven", "embroidered", "zari", "sequin", "bandhani",
    "ikat", "patola", "kalamkari", "block_print", "floral", "geometric",
    "abstract", "traditional", "paisley", "checked", "striped",
];

const formatLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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
    createdAt: string;
    productReviews: { rating: number }[];
}

export default function SellerProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [updatingStock, setUpdatingStock] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/api/seller/products");
            setProducts(res.data.products || []);
        } catch (err: any) {
            if (err?.response?.status === 403) {
                setError("You are not an approved seller.");
            } else {
                setError("Failed to load products.");
            }
        } finally {
            setLoading(false);
        }
    };

    const avgRating = (reviews: { rating: number }[]) => {
        if (!reviews.length) return null;
        return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
    };

    const updateStock = async (productId: string, newStock: number) => {
        if (newStock < 0) return;
        setUpdatingStock((s) => ({ ...s, [productId]: true }));
        const prev = products.find((p) => p.id === productId)?.stock ?? 0;
        // Optimistic update
        setProducts((ps) => ps.map((p) => p.id === productId ? { ...p, stock: newStock } : p));
        try {
            await axios.patch("/api/seller/products", { productId, stock: newStock });
        } catch (err: any) {
            // Rollback on error
            setProducts((ps) => ps.map((p) => p.id === productId ? { ...p, stock: prev } : p));
            alert(err?.response?.data?.error || "Failed to update stock");
        } finally {
            setUpdatingStock((s) => ({ ...s, [productId]: false }));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin" size={32} style={{ color: "var(--color-primary)" }} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div style={{ backgroundColor: "rgba(165,18,18,0.06)", border: "1px solid rgba(165,18,18,0.15)" }} className="rounded-xl p-8 text-center">
                    <Package className="mx-auto mb-3" size={40} style={{ color: "var(--color-secondary-soft)" }} />
                    <p style={{ color: "var(--color-secondary)" }} className="font-medium">{error}</p>
                </div>
            </div>
        );
    }

    if (showForm) {
        return (
            <AddProductForm
                onBack={() => setShowForm(false)}
                onSuccess={() => {
                    setShowForm(false);
                    fetchProducts();
                }}
            />
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Package size={28} style={{ color: "var(--color-primary)" }} />
                    <h1 className="text-2xl font-bold" style={{ color: "var(--color-bg-dark)" }}>Your Products</h1>
                    <span className="text-sm" style={{ color: "#a09080" }}>({products.length})</span>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium"
                    style={{ backgroundColor: "var(--color-primary)", color: "var(--color-bg-dark)" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-primary-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--color-primary)"}
                >
                    <Plus size={16} />
                    Add Product
                </button>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-16 rounded-xl" style={{ backgroundColor: "rgba(224,161,27,0.06)", border: "1px dashed var(--color-border)" }}>
                    <Package className="mx-auto mb-4" size={48} style={{ color: "var(--color-border)" }} />
                    <p className="mb-4" style={{ color: "#8a7560" }}>You haven&apos;t added any products yet.</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 rounded-lg text-sm font-medium"
                        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-bg-dark)" }}
                    >
                        Add Your First Product
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                            style={{ border: "1px solid #e8dcc8", backgroundColor: "var(--color-bg-light)" }}
                        >
                            {/* Image */}
                            <div className="relative h-48" style={{ backgroundColor: "#f0e6d3" }}>
                                {product.images[0] ? (
                                    <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <Package size={40} />
                                    </div>
                                )}
                                {/* Badges */}
                                <div className="absolute top-2 left-2 flex gap-1.5">
                                    {!product.isAvailable && (
                                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-secondary)", color: "#fff" }}>Unavailable</span>
                                    )}
                                    {product.isFeatured && (
                                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-primary)", color: "var(--color-bg-dark)" }}>Featured</span>
                                    )}
                                </div>
                                {product.mrp && product.mrp > product.price && (
                                    <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-secondary)", color: "#fff" }}>
                                        {Math.round((1 - product.price / product.mrp) * 100)}% OFF
                                    </span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-4 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-semibold line-clamp-1" style={{ color: "var(--color-bg-dark)" }}>{product.name}</h3>
                                    {avgRating(product.productReviews) && (
                                        <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: "rgba(224,161,27,0.12)", color: "var(--color-primary)" }}>
                                            ⭐ {avgRating(product.productReviews)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm line-clamp-2" style={{ color: "#8a7560" }}>{product.description}</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-bold" style={{ color: "var(--color-secondary)" }}>₹{product.price}</span>
                                    {product.mrp && product.mrp > product.price && (
                                        <span className="text-sm line-through" style={{ color: "#b0a090" }}>₹{product.mrp}</span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(224,161,27,0.12)", color: "#9a7520" }}>{formatLabel(product.category)}</span>
                                    {product.fabricType && (
                                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(90,58,34,0.08)", color: "#7a5a3a" }}>{formatLabel(product.fabricType)}</span>
                                    )}
                                    {product.origin && (
                                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(224,161,27,0.08)", color: "#9a7520" }}>{product.origin}</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between pt-2 text-xs" style={{ borderTop: "1px solid #e8dcc8", color: "#a09080" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <span>Stock:</span>
                                        <button
                                            onClick={() => updateStock(product.id, product.stock - 1)}
                                            disabled={updatingStock[product.id] || product.stock <= 0}
                                            style={{
                                                width: 24, height: 24, borderRadius: 6,
                                                border: "1px solid #e8dcc8", background: "#fdfaf4",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                cursor: updatingStock[product.id] || product.stock <= 0 ? "not-allowed" : "pointer",
                                                opacity: updatingStock[product.id] || product.stock <= 0 ? 0.4 : 1,
                                            }}
                                        >
                                            <Minus size={12} />
                                        </button>
                                        <span style={{ fontWeight: 700, fontSize: 14, color: product.stock === 0 ? "var(--color-secondary)" : "var(--color-bg-dark)", minWidth: 20, textAlign: "center" }}>
                                            {product.stock}
                                        </span>
                                        <button
                                            onClick={() => updateStock(product.id, product.stock + 1)}
                                            disabled={updatingStock[product.id]}
                                            style={{
                                                width: 24, height: 24, borderRadius: 6,
                                                border: "1px solid #e8dcc8", background: "#fdfaf4",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                cursor: updatingStock[product.id] ? "not-allowed" : "pointer",
                                                opacity: updatingStock[product.id] ? 0.4 : 1,
                                            }}
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                    {product.weaveType && <span>{formatLabel(product.weaveType)}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── Add Product Form ──────────────────────────────────── */

function AddProductForm({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadingImages, setUploadingImages] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [mrp, setMrp] = useState("");
    const [stock, setStock] = useState("");
    const [category, setCategory] = useState("");
    const [subCategory, setSubCategory] = useState("");
    const [fabricType, setFabricType] = useState("");
    const [weaveType, setWeaveType] = useState("");
    const [occasion, setOccasion] = useState<string[]>([]);
    const [color, setColor] = useState("");
    const [pattern, setPattern] = useState("");
    const [length, setLength] = useState("");
    const [width, setWidth] = useState("");
    const [weight, setWeight] = useState("");
    const [blouseIncluded, setBlouseIncluded] = useState(false);
    const [washCare, setWashCare] = useState("");
    const [origin, setOrigin] = useState("");
    const [tags, setTags] = useState("");
    const [sku, setSku] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    const toggleOccasion = (o: string) => {
        setOccasion((prev) =>
            prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]
        );
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setUploadingImages(true);
        setError(null);
        const newPreviews: string[] = [];
        const newUrls: string[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                newPreviews.push(URL.createObjectURL(file));

                const fd = new FormData();
                fd.append("file", file);
                const res = await axios.post("/api/seller/upload-image", fd);
                newUrls.push(res.data.url);
            }
            setImagePreviews((prev) => [...prev, ...newPreviews]);
            setImages((prev) => [...prev, ...newUrls]);
        } catch {
            setError("Failed to upload one or more images");
        } finally {
            setUploadingImages(false);
        }
    };

    const removeImage = (idx: number) => {
        setImages((prev) => prev.filter((_, i) => i !== idx));
        setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) return setError("Product name is required");
        if (!description.trim()) return setError("Description is required");
        if (!price || parseFloat(price) <= 0) return setError("Valid price is required");
        if (!stock || parseInt(stock) < 0) return setError("Valid stock is required");
        if (!category) return setError("Category is required");
        if (images.length === 0) return setError("At least one image is required");

        try {
            setSubmitting(true);
            await axios.post("/api/seller/products", {
                name,
                description,
                price: parseFloat(price),
                mrp: mrp ? parseFloat(mrp) : null,
                stock: parseInt(stock),
                category,
                subCategory: subCategory || null,
                fabricType: fabricType || null,
                weaveType: weaveType || null,
                occasion,
                color: color || null,
                pattern: pattern || null,
                length: length ? parseFloat(length) : null,
                width: width ? parseFloat(width) : null,
                weight: weight ? parseFloat(weight) : null,
                blouseIncluded,
                washCare: washCare || null,
                origin: origin || null,
                images,
                tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
                sku: sku || null,
            });
            onSuccess();
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to create product");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-gray-500 hover:text-black mb-4 text-sm"
            >
                <ArrowLeft size={16} /> Back to Products
            </button>

            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Plus size={24} /> Add New Product
            </h1>

            {error && (
                <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* ─── Basic Info ─── */}
                <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Package size={18} /> Basic Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Sambalpuri Silk Saree"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the product, its features, material quality, etc."
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹) *</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0"
                                step="0.01"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹)</label>
                            <input
                                type="number"
                                value={mrp}
                                onChange={(e) => setMrp(e.target.value)}
                                placeholder="Original price for discount display"
                                step="0.01"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                            <input
                                type="number"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                placeholder="Available quantity"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                            <input
                                type="text"
                                value={sku}
                                onChange={(e) => setSku(e.target.value)}
                                placeholder="Unique stock code"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            />
                        </div>
                    </div>
                </section>

                {/* ─── Category & Classification ─── */}
                <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Tag size={18} /> Category &amp; Classification
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 bg-white"
                            >
                                <option value="">Select category</option>
                                {CATEGORIES.map((c) => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
                            <input
                                type="text"
                                value={subCategory}
                                onChange={(e) => setSubCategory(e.target.value)}
                                placeholder="e.g. Bomkai, Pasapalli"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fabric Type</label>
                            <select
                                value={fabricType}
                                onChange={(e) => setFabricType(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 bg-white"
                            >
                                <option value="">Select fabric</option>
                                {FABRIC_TYPES.map((f) => (
                                    <option key={f} value={f}>{formatLabel(f)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Weave Type</label>
                            <select
                                value={weaveType}
                                onChange={(e) => setWeaveType(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 bg-white"
                            >
                                <option value="">Select weave</option>
                                {WEAVE_TYPES.map((w) => (
                                    <option key={w} value={w}>{formatLabel(w)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                            <select
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 bg-white"
                            >
                                <option value="">Select color</option>
                                {COLORS.map((c) => (
                                    <option key={c} value={c}>{formatLabel(c)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pattern</label>
                            <select
                                value={pattern}
                                onChange={(e) => setPattern(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 bg-white"
                            >
                                <option value="">Select pattern</option>
                                {PATTERNS.map((p) => (
                                    <option key={p} value={p}>{formatLabel(p)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Occasion multi-select */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Occasion (select multiple)</label>
                        <div className="flex flex-wrap gap-2">
                            {OCCASIONS.map((o) => (
                                <button
                                    key={o}
                                    type="button"
                                    onClick={() => toggleOccasion(o)}
                                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${occasion.includes(o)
                                        ? "bg-black text-white border-black"
                                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                                        }`}
                                >
                                    {occasion.includes(o) && <Check size={10} className="inline mr-1" />}
                                    {formatLabel(o)}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── Measurements & Details ─── */}
                <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Ruler size={18} /> Measurements &amp; Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Length (meters)</label>
                            <input
                                type="number"
                                value={length}
                                onChange={(e) => setLength(e.target.value)}
                                placeholder="e.g. 5.5"
                                step="0.1"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Width (meters)</label>
                            <input
                                type="number"
                                value={width}
                                onChange={(e) => setWidth(e.target.value)}
                                placeholder="e.g. 1.2"
                                step="0.1"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (grams)</label>
                            <input
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="e.g. 400"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Origin / Region</label>
                            <input
                                type="text"
                                value={origin}
                                onChange={(e) => setOrigin(e.target.value)}
                                placeholder="e.g. Sambalpuri, Banarasi, Kanchipuram"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Wash Care</label>
                            <input
                                type="text"
                                value={washCare}
                                onChange={(e) => setWashCare(e.target.value)}
                                placeholder="e.g. Dry Clean Only, Hand Wash"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={blouseIncluded}
                                onChange={(e) => setBlouseIncluded(e.target.checked)}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-gray-700">Blouse piece included</span>
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="e.g. handloom, wedding, premium, gift"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                        />
                    </div>
                </section>

                {/* ─── Images ─── */}
                <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Upload size={18} /> Product Images *
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {imagePreviews.map((src, idx) => (
                            <div key={idx} className="relative group">
                                <img
                                    src={src}
                                    alt={`Product ${idx + 1}`}
                                    className="w-full h-28 object-cover rounded-lg border border-gray-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-500 transition-colors">
                            {uploadingImages ? (
                                <Loader2 className="animate-spin text-gray-400" size={20} />
                            ) : (
                                <>
                                    <Upload size={20} className="text-gray-400 mb-1" />
                                    <span className="text-xs text-gray-400">Add Images</span>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={uploadingImages}
                            />
                        </label>
                    </div>
                </section>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        <><Loader2 className="animate-spin" size={18} /> Creating Product...</>
                    ) : (
                        <><Check size={18} /> Create Product</>
                    )}
                </button>
            </form>
        </div>
    );
}
