import Link from "next/link";

export default function Home() {
  return (
    <main>

      {/* HERO */}
      <section style={heroSection}>
        <div style={{ maxWidth: 900, margin: "auto" }}>
          <h1 style={heroTitle}>
            y-commerce
          </h1>
          <p style={heroSubtitle}>
            Elegant clothes, sarees and everyday fashion
          </p>

          <Link href="/home">
            <button style={btnPrimary}>Shop Now →</button>
          </Link>
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={section}>
        <h2 style={sectionTitle}>Shop by Category</h2>

        <div style={grid}>
          <Category name="Sarees" href="/products?category=saree" />
          <Category name="Men Wear" href="/products?category=men" />
          <Category name="Women Wear" href="/products?category=women" />
          <Category name="Accessories" href="/products?category=accessories" />
        </div>
      </section>

      {/* FEATURED */}
      <section style={section}>
        <h2 style={sectionTitle}>Featured Collection</h2>

        <div style={grid}>
          <ProductCard name="Silk Saree" price="₹2,499" />
          <ProductCard name="Cotton Kurta" price="₹999" />
          <ProductCard name="Designer Blouse" price="₹799" />
          <ProductCard name="Casual Shirt" price="₹1,199" />
        </div>
      </section>

      {/* ABOUT */}
      <section style={aboutSection}>
        <h2 style={sectionTitle}>Why y-commerce?</h2>
        <p style={aboutText}>
          We bring curated fashion that balances tradition and modern style.
          Quality fabrics, fair prices, and designs you’ll actually wear.
        </p>
      </section>

    </main>
  );
}

/* ---------- Components ---------- */

function Category({ name, href }: { name: string; href: string }) {
  return (
    <Link href={href} style={categoryCard}>
      <div style={categoryIcon}>🛍️</div>
      <h3 style={{ margin: "10px 0 5px", fontSize: "1.1rem" }}>{name}</h3>
      <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>Explore →</p>
    </Link>
  );
}

function ProductCard({ name, price }: { name: string; price: string }) {
  return (
    <div style={productCard}>
      <div style={imagePlaceholder}></div>
      <h4 style={{ margin: "12px 0 5px", fontSize: "1rem" }}>{name}</h4>
      <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "#000" }}>{price}</p>
    </div>
  );
}

/* ---------- Styles ---------- */

const heroSection = {
  padding: "100px 20px 80px",
  textAlign: "center" as const,
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
};

const heroTitle = {
  fontSize: "3.5rem",
  marginBottom: 15,
  fontWeight: 700,
  letterSpacing: "-1px",
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
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 25,
  marginTop: 30,
};

const categoryCard = {
  background: "white",
  border: "2px solid #f0f0f0",
  borderRadius: 16,
  padding: 30,
  textAlign: "center" as const,
  textDecoration: "none",
  color: "inherit",
  transition: "all 0.3s ease",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
} as const;

const categoryIcon = {
  fontSize: "2.5rem",
  marginBottom: 10,
};

const productCard = {
  background: "white",
  border: "1px solid #e8e8e8",
  borderRadius: 12,
  padding: 15,
  textAlign: "center" as const,
  transition: "all 0.3s ease",
  cursor: "pointer",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
} as const;

const imagePlaceholder = {
  height: 180,
  background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
  borderRadius: 10,
  marginBottom: 10,
};

const btnPrimary = {
  padding: "14px 32px",
  background: "white",
  color: "#667eea",
  border: "none",
  borderRadius: 25,
  cursor: "pointer",
  fontSize: "1rem",
  fontWeight: 600,
  transition: "all 0.3s ease",
  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
};

const aboutSection = {
  padding: "60px 20px",
  textAlign: "center" as const,
  background: "#f9fafb",
};

const aboutText = {
  maxWidth: 700,
  margin: "20px auto",
  lineHeight: 1.8,
  fontSize: "1.1rem",
  color: "#555",
};
