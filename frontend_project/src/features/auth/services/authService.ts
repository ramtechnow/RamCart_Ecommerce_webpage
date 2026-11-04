import { User as FirebaseUser } from "firebase/auth";
import { UserState } from "../../../store/slices/authSlice";
import { BACKEND_URL } from "../../../config";

// Fetch or create user profile in MongoDB via Express backend
export const syncUserProfile = async (firebaseUser: FirebaseUser, customName?: string): Promise<UserState> => {
  const payload = {
    email: firebaseUser.email,
    uid: firebaseUser.uid,
    name: customName || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Customer",
    phone: firebaseUser.phoneNumber || undefined
  };

  const response = await fetch(`${BACKEND_URL}/auth/firebase-sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Failed to sync user profile with backend database");
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.errors || "Failed to sync user profile");
  }

  // Save the JWT token to localStorage
  if (result.token) {
    localStorage.setItem("auth-token", result.token);
  }

  return {
    uid: firebaseUser.uid,
    email: result.user.email || firebaseUser.email || null,
    name: result.user.name || payload.name,
    role: (result.user?.isAdmin || firebaseUser.email?.toLowerCase() === "bvhss20@gmail.com") ? "admin" : "customer",
    emailVerified: firebaseUser.emailVerified
  };
};

