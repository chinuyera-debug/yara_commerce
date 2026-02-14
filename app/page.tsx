// ---------- Boutique Style Additions ----------
"use client";
const heroPatternOverlay = {
  position: "relative" as const,
  zIndex: 1,
  width: "100%",
  height: "100%",
  backgroundImage:
    "repeating-linear-gradient(135deg, rgba(224,161,27,0.07) 0px, rgba(224,161,27,0.07) 2px, transparent 2px, transparent 20px)",
  padding: 0,
};

const heroUnderline = {
  display: "block",
  width: 120,
  height: 6,
  margin: "18px auto 0 auto",
  background: "linear-gradient(90deg, #E0A11B 60%, #F2C94C 100%)",
  borderRadius: 6,
};

const btnPrimaryHover = {
  background: "linear-gradient(90deg, #C88912 60%, #E0A11B 100%)",
};

const categoryCardHover = {
  boxShadow: "0 6px 24px 0 rgba(224,161,27,0.18)",
  border: "2.5px solid #E0A11B",
};

const productCardHover = {
  boxShadow: "0 8px 32px 0 rgba(224,161,27,0.18)",
  border: "2.5px solid #E0A11B",
};

const productCardTexture = {
  backgroundImage: "repeating-linear-gradient(135deg, rgba(224,161,27,0.04) 0px, rgba(224,161,27,0.04) 2px, transparent 2px, transparent 18px)",
};

import Link from "next/link";
import { useRef, useEffect } from "react";
import gsap from "gsap";

const categories = [
  { name: "Sarees", image: "/cottonSaree.jpg", href: "/products?category=saree" },
  { name: "Men Wear", image: "/kurti.jpg", href: "/products?category=men" },
  { name: "Women Wear", image: "/fork.jpg", href: "/products?category=women" },
  { name: "Accessories", image: "/scarf.jpg", href: "/products?category=accessories" },
  { name: "Handkerchiefs", image: "/hanckerchief.jpg", href: "/products?category=handkerchief" },
  
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Background movement
      gsap.to(bgRef.current, {
        backgroundPosition: "100px 100px",
        duration: 20,
        repeat: -1,
        ease: "none",
      });

      // Text entrance
      const tl = gsap.timeline();
      tl.from(".hero-text", {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power4.out",
      });

      // Floating elements animation
      gsap.to(".floater", {
        y: "random(-20, 20)",
        x: "random(-10, 10)",
        rotation: "random(-15, 15)",
        duration: "random(2, 4)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: {
          amount: 1,
          from: "random",
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <main>
      {/* HERO */}
      <section style={{ ...heroSection, position: "relative", overflow: "hidden" }} ref={heroRef}>
        {/* Animated Background Overlay */}
        <div
          ref={bgRef}
          style={{
            position: "absolute",
            top: -50, left: -50, right: -50, bottom: -50,
            backgroundImage: "radial-gradient(circle at center, rgba(224, 161, 27, 0.15) 2px, transparent 2px)",
            backgroundSize: "40px 40px",
            opacity: 0.6,
            zIndex: 0,
          }}
        />

        {/* Floating Decorative Elements */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="floater"
            style={{
              position: "absolute",
              top: `${Math.random() * 80 + 10}%`,
              left: `${Math.random() * 90 + 5}%`,
              fontSize: `${Math.random() * 2 + 1}rem`,
              opacity: 0.2,
              color: "#E0A11B",
              zIndex: 0,
              pointerEvents: "none",
            }}
          >
            {["✨", "🏵️", "🧵", "⚜️"][i % 4]}
          </div>
        ))}

        <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "auto" }} ref={textRef}>
          <h1 style={heroTitle} className="hero-text">
            Srinibas Vastra
            <span style={heroUnderline}></span>
          </h1>
          <p style={heroSubtitle} className="hero-text">
            Where Tradition Meets Trend. Curated Sarees & Fashion for Every Occasion.
          </p>
          <div className="hero-text">
            <Link href="/home">
              <button
                style={btnPrimary}
                onMouseOver={e => {
                  e.currentTarget.style.background = btnPrimaryHover.background;
                  gsap.to(e.currentTarget, { scale: 1.05, duration: 0.3 });
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = btnPrimary.background;
                  gsap.to(e.currentTarget, { scale: 1, duration: 0.3 });
                }}
              >
                Shop Now →
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Divider />

      {/* CATEGORIES */}
      <section style={{ padding: "60px 0", overflow: "hidden" }}>
        <h2 style={sectionTitle}>Shop by Category</h2>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee-track { display: flex; gap: 24px; animation: marquee 20s linear infinite; width: max-content; }
          .marquee-track:hover { animation-play-state: paused; }
          .cat-card { position: relative; width: 280px; height: 400px; border-radius: 18px; overflow: hidden; flex-shrink: 0; cursor: pointer; transition: transform 0.3s, box-shadow 0.3s; }
          .cat-card:hover { transform: scale(1.05); box-shadow: 0 12px 40px rgba(224,161,27,0.25); }
          .cat-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
          .cat-card:hover img { transform: scale(1.1); }
          .cat-card .overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(43,26,18,0.85) 0%, rgba(43,26,18,0.2) 60%, transparent 100%); display: flex; flex-direction: column; justify-content: flex-end; padding: 20px; }
          .cat-card .overlay h3 { color: #F5E6C8; font-size: 1.2rem; font-weight: 700; margin: 0 0 4px; }
          .cat-card .overlay span { color: #E0A11B; font-size: 0.85rem; font-weight: 600; }
        `}</style>
        <div style={{ marginTop: 30, padding: "0 20px" }}>
          <div className="marquee-track">
            {[...categories, ...categories].map((cat, i) => (
              <Link href={cat.href} key={i} className="cat-card" style={{ textDecoration: "none" }}>
                <img src={cat.image} alt={cat.name} />
                <div className="overlay">
                  <h3>{cat.name}</h3>
                  <span>Explore →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* FEATURED */}
      <section style={section}>
        <h2 style={sectionTitle}>Featured Collection</h2>
        <div style={grid}>
          <ProductCard name="Silk Saree" price="" image="/Silk_Saree.jpg" texture />
          <ProductCard name="Cotton Kurta" price="" image="/CottonKurta.jpg" texture />
          <ProductCard name="Designer Blouse" price="" image="/DesignerBlouse.jpg" texture />
          <ProductCard name="Casual Shirt" price="" image="/CasualShirt.jpg" texture />
        </div>
      </section>

      <Divider />

      {/* ABOUT */}
      <section style={aboutSection}>
        <h2 style={sectionTitle}>Why Srinibas Vastra?</h2>
        <p style={aboutText}>
          We bring curated fashion that balances tradition and modern style.<br />
          Quality fabrics, fair prices, and designs you’ll actually wear.
        </p>
      </section>
    </main>
  );
}

/* ---------- Components ---------- */


function ProductCard({ name, price, texture, image }: { name: string; price: string; texture?: boolean; image?: string }) {
  return (
    <div style={{ ...productCard, ...(texture ? productCardTexture : {}) }}
      onMouseOver={e => {
        e.currentTarget.style.boxShadow = productCardHover.boxShadow;
        e.currentTarget.style.border = productCardHover.border;
      }}
      onMouseOut={e => {
        e.currentTarget.style.boxShadow = productCard.boxShadow;
        e.currentTarget.style.border = productCard.border;
      }}
    >
      <div style={imagePlaceholder}>
        {image && <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} />}
      </div>
      <h4 style={{ margin: "12px 0 5px", fontSize: "1rem", color: "#2B1A12" }}>{name}</h4>
      <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "#A51212" }}>{price}</p>
    </div>
  );
}

function Divider() {
  return (
    <div style={{
      width: "100%",
      height: 0,
      borderBottom: "2px dashed #E0A11B",
      margin: "40px 0 30px 0",
      opacity: 0.25,
    }} />
  );
}

/* ---------- Styles ---------- */

const heroSection = {
  padding: "100px 20px 80px",
  textAlign: "center" as const,
  background: "linear-gradient(135deg, #2B1A12 0%, #3A2416 100%)",
  color: "#F5E6C8",
};

const heroTitle = {
  fontSize: "3.5rem",
  marginBottom: 15,
  fontWeight: 700,
  letterSpacing: "-1px",
  color: "#E0A11B",
};

const heroSubtitle = {
  fontSize: "1.3rem",
  marginBottom: 35,
  opacity: 0.95,
  fontWeight: 300,
};

const section = {
  padding: "60px 20px",
  maxWidth: 1200,
  margin: "auto",
};

const sectionTitle = {
  fontSize: "2rem",
  marginBottom: 10,
  fontWeight: 600,
  textAlign: "center" as const,
  color: "#2B1A12",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 25,
  marginTop: 30,
};

const categoryCard = {
  background: "#FFF8E7",
  border: "2px solid #EAD7B0",
  borderRadius: 16,
  padding: 30,
  textAlign: "center" as const,
  textDecoration: "none",
  color: "#3A2416",
  transition: "all 0.3s ease",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(230, 161, 27, 0.1)",
} as const;

const categoryIcon = {
  fontSize: "2.5rem",
  marginBottom: 10,
};

const productCard = {
  background: "#FFF8E7",
  border: "1px solid #EAD7B0",
  borderRadius: 12,
  padding: 15,
  textAlign: "center" as const,
  transition: "all 0.3s ease",
  cursor: "pointer",
  boxShadow: "0 2px 12px rgba(224, 161, 27, 0.08)",
} as const;

const imagePlaceholder = {
  height: 180,
  borderRadius: 10,
  marginBottom: 10,
  overflow: "hidden" as const,
  background: "linear-gradient(135deg, #EAD7B0 0%, #E0A11B 100%)",
};

const btnPrimary = {
  padding: "14px 32px",
  background: "#E0A11B",
  color: "#2B1A12",
  border: "none",
  borderRadius: 25,
  cursor: "pointer",
  fontSize: "1rem",
  fontWeight: 600,
  transition: "all 0.3s ease",
  boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
};

const aboutSection = {
  padding: "60px 20px",
  textAlign: "center" as const,
  background: "#FFF8E7",
};

const aboutText = {
  maxWidth: 700,
  margin: "20px auto",
  lineHeight: 1.8,
  fontSize: "1.1rem",
  color: "#3A2416",
};
