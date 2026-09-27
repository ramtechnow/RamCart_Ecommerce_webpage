import React from "react";
import { Link } from "react-router-dom";
import { Mail, CreditCard } from "lucide-react";
import "../Styles/footer.css";

export const Footer: React.FC = () => {
  return (
    <footer className="footer-container" aria-label="Footer Navigation">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand-column">
            <div className="footer-logo-row" style={{ display: "flex", alignItems: "center" }}>
              <img src="/RamCart_logo_v2.png" alt="RamCart Logo" style={{ height: "36px", objectFit: "contain" }} />
            </div>
            <p className="footer-brand-description">
              RamCart is your modern fashion and lifestyle shopping destination. Discover premium apparel, contemporary trends, and wardrobe essentials crafted for quality and comfort.
            </p>
            <div className="footer-social-list">
              <a href="https://github.com/ramtechnow/RamCart_Ecommerce_webpage" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="GitHub Repository">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="LinkedIn Profile">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
              <a href="mailto:ramtechnow@gmail.com" className="footer-social-btn" aria-label="Email Customer Support">
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-links-column">
            <h4 className="footer-column-title">Collections</h4>
            <ul className="footer-links-list">
              <li><Link to="/catalog">Shop All Catalog</Link></li>
              <li><Link to="/mens">Men's Apparel</Link></li>
              <li><Link to="/womens">Women's Apparel</Link></li>
              <li><Link to="/kids">Kids Collection</Link></li>
            </ul>
          </div>

          {/* Customer Area */}
          <div className="footer-links-column">
            <h4 className="footer-column-title">Customer Care</h4>
            <ul className="footer-links-list">
              <li><Link to="/profile">My Account</Link></li>
              <li><Link to="/orders">Track Orders</Link></li>
              <li><Link to="/cart">Shopping Bag</Link></li>
              <li><Link to="/wishlist">Saved Wishlist</Link></li>
            </ul>
          </div>

          {/* Trust & Support Area */}
          <div className="footer-contact-column">
            <h4 className="footer-column-title">Support & Trust</h4>
            <div className="footer-contact-item" style={{ marginBottom: "10px" }}>
              <Mail size={16} style={{ color: "var(--accent-pink)", flexShrink: 0 }} />
              <span>
                Support Desk:<br />
                <a href="mailto:ramtechnow@gmail.com" style={{ fontWeight: "700", color: "var(--text-primary)" }}>ramtechnow@gmail.com</a>
              </span>
            </div>
            <div className="footer-contact-item" style={{ marginBottom: "10px" }}>
              {/* WhatsApp Icon */}
              <svg style={{ height: "16px", width: "16px", fill: "#25D366", flexShrink: 0 }} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.835-4.86c1.62.962 3.41 1.47 5.267 1.472 5.518 0 10.006-4.487 10.01-10.007.002-2.673-1.036-5.186-2.924-7.078-1.889-1.891-4.407-2.934-7.086-2.936-5.524 0-10.012 4.488-10.017 10.008-.002 1.897.501 3.75 1.458 5.389L1.936 21.052l5.127-1.348-.17-.164zm10.155-7.798c-.29-.145-1.72-.848-1.986-.944-.265-.096-.459-.144-.652.146-.193.29-.748.944-.917 1.137-.168.193-.338.217-.628.072-.29-.145-1.226-.452-2.335-1.442-.863-.77-1.446-1.72-1.615-2.01-.17-.29-.018-.448.127-.592.13-.13.29-.338.434-.507.145-.168.193-.29.29-.483.096-.193.048-.361-.024-.507-.072-.145-.652-1.57-.893-2.149-.235-.567-.476-.49-.652-.499-.17-.008-.361-.01-.554-.01-.193 0-.507.072-.772.361-.265.29-1.013.99-1.013 2.415 0 1.423 1.037 2.799 1.18 2.992.145.193 2.04 3.114 4.939 4.363.69.298 1.229.476 1.648.609.692.22 1.323.19 1.82.115.553-.083 1.72-.703 1.961-1.382.242-.678.242-1.26.17-1.382-.072-.12-.265-.193-.555-.338z"/>
              </svg>
              <span>
                Chat Support:<br />
                <a href="https://wa.me/919080339752" target="_blank" rel="noopener noreferrer" style={{ color: "#25D366", fontWeight: "800", textDecoration: "underline" }}>Live WhatsApp Support</a>
              </span>
            </div>
            <div className="footer-contact-item">
              <span style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.5" }}>
                ✓ 100% Original Products<br />
                ✓ Free shipping above ₹499<br />
                ✓ 30-Day Easy Exchange Policy
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <span className="footer-copyright">
            &copy; {new Date().getFullYear()} RamCart. All rights reserved.
          </span>
          <div className="footer-payment-logos" aria-label="Accepted payment options">
            <CreditCard size={18} />
            <span>100% ENCRYPTED SSL CHECKOUT | ALL MAJOR CARDS &amp; UPI ACCEPTED</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
