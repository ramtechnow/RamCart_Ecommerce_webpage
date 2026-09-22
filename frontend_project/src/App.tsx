import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import MobileBottomNav from "./Components/MobileBottomNav";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { ToastContainer } from "./Components/ui/ToastContainer";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebase";
import { syncUserProfile } from "./features/auth/services/authService";
import { setUser, setAuthLoading, setAuthError, clearAuth } from "./store/slices/authSlice";
import { useAppDispatch } from "./store/hooks";
import Pattern from "./Components/Pattern";
import ScrollToTop from "./Components/ScrollToTop";
import { fetchActivePromo } from "./features/catalog/services/promoService";
import { SeasonalPromo } from "./features/catalog/types/promoTypes";
import AnnouncementMarquee from "./Components/AnnouncementMarquee";
import FestiveParticles from "./Components/FestiveParticles";

// Lazy load pages for code splitting and optimized bundles
const Home = lazy(() => import("./Pages/Home"));
const Shop = lazy(() => import("./Pages/Shop"));
const ProductDetail = lazy(() => import("./Pages/ProductDetail"));
const Cart = lazy(() => import("./Pages/Cart"));
const Wishlist = lazy(() => import("./Pages/Wishlist"));
const Checkout = lazy(() => import("./Pages/Checkout"));
const Orders = lazy(() => import("./Pages/Orders"));
const Login = lazy(() => import("./Pages/Login"));
const AdminPanel = lazy(() => import("./Pages/AdminPanel"));
const NotFound = lazy(() => import("./Pages/NotFound"));
const Profile = lazy(() => import("./Pages/Profile"));
const ProductDemo = lazy(() => import("./Pages/ProductDemo"));
const TestimonialsDemo = lazy(() => import("./Pages/TestimonialsDemo"));

const FestiveParticlesWrapper: React.FC<{ promo: SeasonalPromo | null }> = ({ promo }) => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");
  if (isAdminPage || !promo || !promo.enableParticles) return null;
  return <FestiveParticles type={promo.particleType} enable={true} />;
};

const StorefrontChrome: React.FC = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");

  if (isAdminPage) return null;

  return (
    <>
      <div style={{ position: "relative", zIndex: 10 }}>
        <Navbar />
      </div>
      <Suspense fallback={null}>
        <div style={{ position: "relative", zIndex: 10 }}>
          <Footer />
        </div>
      </Suspense>
      <div style={{ position: "relative", zIndex: 100 }}>
        <MobileBottomNav />
      </div>
    </>
  );
};

export const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const [activePromo, setActivePromo] = useState<SeasonalPromo | null>(null);

  useEffect(() => {
    dispatch(setAuthLoading(true));
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await syncUserProfile(firebaseUser);
          dispatch(setUser(profile));
        } catch (err: any) {
          console.error("Failed to sync user profile:", err);
          dispatch(setAuthError(err.message || "Failed to load user profile"));
        }
      } else {
        dispatch(clearAuth());
      }
    });

    // Load active seasonal settings on mount
    fetchActivePromo().then(setActivePromo).catch(() => {});

    return () => unsubscribe();
  }, [dispatch]);

  return (
    <BrowserRouter>
      {activePromo && (
        <AnnouncementMarquee 
          text={activePromo.announcementText} 
          bg={activePromo.announcementBg} 
        />
      )}
      <FestiveParticlesWrapper promo={activePromo} />
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          minHeight: "100vh",
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Global Animated Background Patterns (Grid / Stars) */}
        <Pattern />

        <StorefrontChrome />
        
        {/* Main Content Viewport with Suspense fallback */}
        <div style={{ flexGrow: 1, position: "relative", zIndex: 2 }}>
          <Suspense 
            fallback={
              <div className="min-h-[60vh] flex items-center justify-center bg-bg-primary text-text-primary">
                <div className="w-10 h-10 border-4 border-border border-t-accent-pink rounded-full animate-spin" />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/catalog" element={<Shop />} />
              <Route path="/mens" element={<Shop category="men" />} />
              <Route path="/womens" element={<Shop category="women" />} />
              <Route path="/kids" element={<Shop category="kid" />} />
              <Route path="/product/:productId" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />
              
              {/* Protected Customer Routes */}
              <Route 
                path="/checkout" 
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/orders" 
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />

              {/* Public/Auth Page */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected Administrator Route */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminPanel />
                  </ProtectedRoute>
                } 
              />
              
              
              <Route path="/product-demo" element={<ProductDemo />} />
              <Route path="/testimonials-demo" element={<TestimonialsDemo />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
        
      </div>

      {/* Scroll to Top — global floating button */}
      <ScrollToTop />

      {/* Global Toast Notification System */}
      <ToastContainer />
    </BrowserRouter>
  );
};

export default App;
