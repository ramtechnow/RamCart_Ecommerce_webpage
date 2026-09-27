import React from "react";
import { Truck, ShieldCheck, RefreshCw } from "lucide-react";

const ProcessSteps = () => {
  const steps = [
    {
      icon: <Truck size={32} style={{ color: "var(--accent-pink)" }} />,
      title: "Fast Doorstep Delivery",
      description: "Quick, dependable shipping across India with real-time tracking updates."
    },
    {
      icon: <ShieldCheck size={32} style={{ color: "var(--accent-pink)" }} />,
      title: "100% Secure Payments",
      description: "256-bit encrypted checkout supporting UPI, NetBanking, and all major cards."
    },
    {
      icon: <RefreshCw size={32} style={{ color: "var(--accent-pink)" }} />,
      title: "Easy 30-Day Returns",
      description: "Not the perfect fit? Enjoy hassle-free exchanges or refunds within 30 days."
    }
  ];

  return (
    <div 
      style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", 
        gap: "var(--space-6)", 
        margin: "var(--space-10) 0",
        padding: "var(--space-6) var(--space-4)",
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--border-radius-md)",
        boxShadow: "var(--shadow-sm)"
      }}
    >
      {steps.map((step, index) => (
        <div 
          key={index}
          className="process-step-card"
          style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            textAlign: "center", 
            padding: "var(--space-4) var(--space-3)",
            gap: "var(--space-2)",
            borderRadius: "12px",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(255, 63, 108, 0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{
            marginBottom: "var(--space-2)",
            padding: "12px",
            borderRadius: "50%",
            background: "rgba(184, 0, 53, 0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.3s ease"
          }}>
            {step.icon}
          </div>
          <h3 style={{ fontSize: "var(--text-md)", fontWeight: "700", color: "var(--text-primary)" }}>
            {step.title}
          </h3>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", maxWidth: "260px", lineHeight: "1.5" }}>
            {step.description}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ProcessSteps;
