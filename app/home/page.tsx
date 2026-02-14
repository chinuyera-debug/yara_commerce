"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import gsap from "gsap";
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

/* ── Particle system for canvas background ── */
interface Particle {
    x: number; y: number; vx: number; vy: number;
    radius: number; opacity: number; hue: number;
    pulse: number; pulseSpeed: number;
}

function createParticles(w: number, h: number, count: number): Particle[] {
    return Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.3 - 0.15,
        radius: Math.random() * 2.5 + 0.8,
        opacity: Math.random() * 0.5 + 0.15,
        hue: 30 + Math.random() * 20,          // gold-amber range
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.008 + Math.random() * 0.015,
    }));
}

export default function HomePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [featured, setFeatured] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const heroRef = useRef<HTMLDivElement | null>(null);
    const heroOverlayRef = useRef<HTMLDivElement | null>(null);
    const meshRef = useRef<HTMLDivElement | null>(null);
    const shimmer1Ref = useRef<HTMLDivElement | null>(null);
    const shimmer2Ref = useRef<HTMLDivElement | null>(null);
    const orbRefs = useRef<HTMLDivElement[]>([]);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const rafRef = useRef<number>(0);

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

    /* ── Canvas particle animation loop ── */
    const animateParticles = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const w = canvas.width;
        const h = canvas.height;
        const particles = particlesRef.current;

        ctx.clearRect(0, 0, w, h);

        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.pulse += p.pulseSpeed;

            // wrap around edges
            if (p.x < -10) p.x = w + 10;
            if (p.x > w + 10) p.x = -10;
            if (p.y < -10) p.y = h + 10;
            if (p.y > h + 10) p.y = -10;

            const currentOpacity = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));
            const currentRadius = p.radius * (0.85 + 0.15 * Math.sin(p.pulse * 1.3));

            // glow
            ctx.beginPath();
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentRadius * 4);
            grad.addColorStop(0, `hsla(${p.hue}, 80%, 65%, ${currentOpacity * 0.6})`);
            grad.addColorStop(1, `hsla(${p.hue}, 80%, 65%, 0)`);
            ctx.fillStyle = grad;
            ctx.arc(p.x, p.y, currentRadius * 4, 0, Math.PI * 2);
            ctx.fill();

            // core
            ctx.beginPath();
            ctx.fillStyle = `hsla(${p.hue}, 85%, 72%, ${currentOpacity})`;
            ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw faint connecting lines between nearby particles
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(224,161,27,${0.06 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        rafRef.current = requestAnimationFrame(animateParticles);
    }, []);

    /* ── Init canvas + resize handler ── */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const resize = () => {
            const heroEl = heroRef.current;
            if (!heroEl) return;
            const rect = heroEl.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            particlesRef.current = createParticles(rect.width, rect.height, 60);
        };
        resize();
        window.addEventListener("resize", resize);
        rafRef.current = requestAnimationFrame(animateParticles);
        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(rafRef.current);
        };
    }, [animateParticles]);

    /* ── GSAP orchestration ── */
    useEffect(() => {
        if (typeof window === "undefined") return;
        const heroOverlay = heroOverlayRef.current;
        const mesh = meshRef.current;
        const shimmer1 = shimmer1Ref.current;
        const shimmer2 = shimmer2Ref.current;
        const orbs = orbRefs.current.filter(Boolean);

        const tl = gsap.timeline({ defaults: { ease: "sine.inOut" } });

        /* pattern overlay drift & breathe */
        if (heroOverlay) {
            tl.to(heroOverlay, { backgroundPosition: "70% 35%", duration: 18, repeat: -1, yoyo: true }, 0);
            tl.to(heroOverlay, { opacity: 0.18, duration: 10, repeat: -1, yoyo: true }, 0);
        }

        /* gradient mesh morph */
        if (mesh) {
            gsap.to(mesh, {
                backgroundPosition: "100% 100%",
                duration: 20, repeat: -1, yoyo: true, ease: "sine.inOut",
            });
            gsap.to(mesh, {
                opacity: 0.35, duration: 8, repeat: -1, yoyo: true, ease: "sine.inOut",
            });
        }

        /* shimmer sweeps */
        if (shimmer1) {
            gsap.fromTo(shimmer1,
                { x: "-120%", opacity: 0.25 },
                { x: "220%", opacity: 0, duration: 4, repeat: -1, repeatDelay: 3, ease: "power1.inOut" }
            );
        }
        if (shimmer2) {
            gsap.fromTo(shimmer2,
                { x: "220%", opacity: 0.2 },
                { x: "-120%", opacity: 0, duration: 5, repeat: -1, repeatDelay: 5, ease: "power1.inOut", delay: 2 }
            );
        }

        /* orbs — larger, more dramatic motion paths */
        if (orbs.length) {
            gsap.set(orbs, { transformOrigin: "50% 50%" });

            // primary wandering motion — much bigger sweeps
            orbs.forEach((orb, i) => {
                const dir = i % 2 === 0 ? 1 : -1;
                const duration = 7 + i * 2;
                gsap.to(orb, {
                    keyframes: [
                        { x: `+=${dir * 60}`, y: "-=40", rotation: dir * 8, duration: duration * 0.5 },
                        { x: `-=${dir * 30}`, y: "+=55", rotation: -dir * 6, duration: duration * 0.3 },
                        { x: `+=${dir * 10}`, y: "-=15", rotation: 0, duration: duration * 0.2 },
                    ],
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    force3D: true,
                });
            });

            // scale + opacity pulse — more visible
            gsap.to(orbs, {
                scale: 1.15,
                opacity: 1,
                duration: 5,
                repeat: -1,
                yoyo: true,
                stagger: { each: 0.5, from: "center" },
                ease: "sine.inOut",
            });

            // dramatic reveal entrance
            gsap.from(orbs, {
                opacity: 0,
                scale: 0.4,
                duration: 1.8,
                stagger: 0.12,
                ease: "expo.out",
            });
        }

        if (!loading) {
            gsap.from('[data-anim="card"]', { opacity: 0, y: 18, scale: 0.985, duration: 0.6, stagger: 0.06, ease: "power2.out" });
        }

        return () => {
            tl.kill();
            gsap.killTweensOf(orbs);
            if (mesh) gsap.killTweensOf(mesh);
            if (shimmer1) gsap.killTweensOf(shimmer1);
            if (shimmer2) gsap.killTweensOf(shimmer2);
        };
    }, [loading, products.length, featured.length]);

    const avgRating = (reviews: { rating: number }[]) => {
        if (!reviews.length) return null;
        return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
    };

    return (
        <main style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-light)" }}>
            {/* Heritage Hero */}
            <section
                ref={heroRef}
                style={{
                    background: "linear-gradient(135deg, var(--color-bg-dark) 0%, #4A2A14 40%, #5A3A22 65%, var(--color-bg-card) 100%)",
                    padding: "100px 24px 90px",
                    textAlign: "center",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* ── Canvas particle layer ── */}
                <canvas
                    ref={canvasRef}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
                />

                {/* ── Morphing gradient mesh ── */}
                <div ref={meshRef} style={{
                    position: "absolute", inset: 0,
                    background: "radial-gradient(ellipse at 20% 30%, rgba(224,161,27,0.18) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(200,140,90,0.14) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(150,100,50,0.1) 0%, transparent 60%)",
                    backgroundSize: "200% 200%",
                    backgroundPosition: "0% 0%",
                    opacity: 0.22,
                    pointerEvents: "none",
                    mixBlendMode: "screen",
                }} />

                {/* ── Decorative pattern overlay ── */}
                <div ref={heroOverlayRef} style={{
                    position: "absolute", inset: 0, opacity: 0.14,
                    backgroundImage:
                        "radial-gradient(circle at 20% 50%, var(--color-primary) 1px, transparent 1px), radial-gradient(circle at 80% 50%, var(--color-primary) 1px, transparent 1px), radial-gradient(circle at 50% 20%, rgba(224,161,27,0.5) 0.5px, transparent 0.5px)",
                    backgroundSize: "90px 90px, 90px 90px, 60px 60px",
                    backgroundPosition: "50% 50%",
                    transition: "background-position .6s, opacity .9s",
                    mixBlendMode: "normal",
                }} />

                {/* ── Animated shimmer streaks ── */}
                <div ref={shimmer1Ref} style={{
                    position: "absolute", top: "30%", left: 0,
                    width: "35%", height: 1,
                    background: "linear-gradient(90deg, transparent, rgba(224,161,27,0.4), transparent)",
                    pointerEvents: "none", opacity: 0,
                    transform: "rotate(-8deg)",
                }} />
                <div ref={shimmer2Ref} style={{
                    position: "absolute", top: "65%", left: 0,
                    width: "25%", height: 1,
                    background: "linear-gradient(90deg, transparent, rgba(255,200,100,0.3), transparent)",
                    pointerEvents: "none", opacity: 0,
                    transform: "rotate(5deg)",
                }} />

                {/* ── Floating decorative orbs — 6 total ── */}
                {/* Orb 1 — large gold, top-left */}
                <div
                    ref={(el) => { if (el) orbRefs.current[0] = el; }}
                    style={{ position: "absolute", left: "3%", top: "10%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, rgba(224,161,27,0.45), transparent 50%), rgba(224,161,27,0.15)", filter: "blur(10px)", pointerEvents: "none", opacity: 0.95, transform: "translateZ(0)", boxShadow: "0 30px 80px rgba(224,161,27,0.2)" }}
                />
                {/* Orb 2 — warm brown, right */}
                <div
                    ref={(el) => { if (el) orbRefs.current[1] = el; }}
                    style={{ position: "absolute", right: "5%", top: "18%", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle at 40% 40%, rgba(200,140,90,0.4), transparent 50%), rgba(74,42,20,0.15)", filter: "blur(12px)", pointerEvents: "none", opacity: 0.88, transform: "translateZ(0)", boxShadow: "0 24px 60px rgba(200,140,90,0.15)" }}
                />
                {/* Orb 3 — muted amber, bottom-left */}
                <div
                    ref={(el) => { if (el) orbRefs.current[2] = el; }}
                    style={{ position: "absolute", left: "18%", bottom: "0%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, rgba(150,120,80,0.38), transparent 50%), rgba(150,120,80,0.1)", filter: "blur(10px)", pointerEvents: "none", opacity: 0.88, transform: "translateZ(0)", boxShadow: "0 20px 40px rgba(150,120,80,0.15)" }}
                />
                {/* Orb 4 — deep gold, center-right */}
                <div
                    ref={(el) => { if (el) orbRefs.current[3] = el; }}
                    style={{ position: "absolute", right: "22%", bottom: "8%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle at 50% 50%, rgba(224,180,60,0.35), transparent 55%)", filter: "blur(14px)", pointerEvents: "none", opacity: 0.8, transform: "translateZ(0)", boxShadow: "0 16px 50px rgba(224,180,60,0.12)" }}
                />
                {/* Orb 5 — small bright spark, top-center */}
                <div
                    ref={(el) => { if (el) orbRefs.current[4] = el; }}
                    style={{ position: "absolute", left: "48%", top: "5%", width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,210,100,0.5), transparent 60%)", filter: "blur(6px)", pointerEvents: "none", opacity: 0.75, transform: "translateZ(0)" }}
                />
                {/* Orb 6 — tiny ruby accent, bottom-center */}
                <div
                    ref={(el) => { if (el) orbRefs.current[5] = el; }}
                    style={{ position: "absolute", left: "55%", bottom: "15%", width: 90, height: 90, borderRadius: "50%", background: "radial-gradient(circle, rgba(180,80,60,0.35), transparent 55%)", filter: "blur(8px)", pointerEvents: "none", opacity: 0.7, transform: "translateZ(0)" }}
                />

                {/* ── Hero text content ── */}
                <div style={{ position: "relative", zIndex: 2 }}>
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
            <div data-anim="card" style={{
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
