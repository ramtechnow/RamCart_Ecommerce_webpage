import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, Search } from 'lucide-react';

export const NotFound: React.FC = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <main 
      className="container" 
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "70vh", 
        textAlign: "center",
        padding: "var(--space-12) var(--space-4)"
      }}
    >
      <div style={{ position: "relative", marginBottom: "var(--space-4)" }}>
        <h1 
          style={{ 
            fontSize: "clamp(80px, 15vw, 120px)", 
            fontWeight: "900", 
            lineHeight: "1", 
            margin: "0",
            background: "linear-gradient(135deg, var(--accent-pink), #8b5cf6)", 
            WebkitBackgroundClip: "text", 
            WebkitTextFillColor: "transparent" 
          }}
        >
          404
        </h1>
      </div>
      
      <h2 
        style={{ 
          fontSize: "var(--text-2xl)", 
          fontWeight: "800", 
          marginBottom: "var(--space-2)",
          color: "var(--text-primary)"
        }}
      >
        We Couldn't Find That Page
      </h2>
      
      <p 
        style={{ 
          fontSize: "var(--text-sm)", 
          color: "var(--text-secondary)", 
          maxWidth: "460px", 
          lineHeight: "1.6",
          marginBottom: "var(--space-6)"
        }}
      >
        The product or link you are looking for may have moved or is temporarily unavailable. Try searching the catalog or browse our curated collections.
      </p>

      {/* Quick Search */}
      <form 
        onSubmit={handleSearch} 
        style={{ 
          display: "flex", 
          width: "100%", 
          maxWidth: "400px", 
          marginBottom: "var(--space-6)",
          gap: "8px" 
        }}
      >
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search items, categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              height: "42px",
              paddingLeft: "36px",
              paddingRight: "12px",
              borderRadius: "4px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-secondary)",
              fontSize: "13px"
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            height: "42px",
            padding: "0 18px",
            backgroundColor: "var(--text-primary)",
            color: "var(--bg-secondary)",
            borderRadius: "4px",
            border: "none",
            fontWeight: "700",
            fontSize: "13px",
            cursor: "pointer"
          }}
        >
          Search
        </button>
      </form>
      
      <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", justifyContent: "center" }}>
        <Link 
          to="/" 
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "var(--space-2)", 
            backgroundColor: "var(--accent-pink)", 
            color: "#ffffff", 
            padding: "10px 20px", 
            borderRadius: "4px", 
            fontWeight: "700", 
            fontSize: "var(--text-sm)",
            textDecoration: "none"
          }}
        >
          <Home size={16} />
          Back to Home
        </Link>
        <Link 
          to="/catalog" 
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "var(--space-2)", 
            backgroundColor: "var(--bg-secondary)", 
            color: "var(--text-primary)", 
            padding: "10px 20px", 
            borderRadius: "4px", 
            fontWeight: "700", 
            fontSize: "var(--text-sm)",
            textDecoration: "none",
            border: "1px solid var(--border-color)"
          }}
        >
          <ShoppingBag size={16} />
          Explore Catalog
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
