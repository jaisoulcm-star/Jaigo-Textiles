import React, { createContext, useContext, useState, useEffect } from "react";
import { User, onAuthStateChanged, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, signInWithGoogle, logout } from "../firebase";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  login: () => Promise<string | null>;
  loginAsDemoUser: (role: "customer" | "admin") => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  accessToken: null,
  setAccessToken: () => {},
  login: async () => null,
  loginAsDemoUser: async () => null,
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = sessionStorage.getItem("jaigo_demo_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("jaigo_demo_is_admin") === "true";
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessTokenState] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem("jaigo_demo_access_token") || null;
    } catch {
      return null;
    }
  });

  const setAccessToken = (token: string | null) => {
    try {
      if (token) {
        sessionStorage.setItem("jaigo_demo_access_token", token);
      } else {
        sessionStorage.removeItem("jaigo_demo_access_token");
      }
    } catch {}
    setAccessTokenState(token);
  };

  const login = async () => {
    const result = await signInWithGoogle();
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      setAccessTokenState(token);
      return token;
    }
    return null;
  };

  const loginAsDemoUser = async (role: "customer" | "admin") => {
    if (role === "admin") {
      const mockUser = {
        uid: "demo-admin-456",
        displayName: "Veni Murugesh (Staff)",
        email: "venimurugesh@gmail.com",
        photoURL: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150",
        emailVerified: true,
        phoneNumber: null,
        isAnonymous: false,
      } as any;
      try {
        sessionStorage.setItem("jaigo_demo_user", JSON.stringify(mockUser));
        sessionStorage.setItem("jaigo_demo_is_admin", "true");
        sessionStorage.setItem("jaigo_demo_access_token", "demo-token-admin");
      } catch {}
      setUser(mockUser);
      setIsAdmin(true);
      setAccessTokenState("demo-token-admin");
      return "demo-token-admin";
    } else {
      const mockUser = {
        uid: "demo-customer-123",
        displayName: "Demo Customer",
        email: "customer@jaigotextiles.in",
        photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150",
        emailVerified: true,
        phoneNumber: null,
        isAnonymous: false,
      } as any;
      try {
        sessionStorage.setItem("jaigo_demo_user", JSON.stringify(mockUser));
        sessionStorage.setItem("jaigo_demo_is_admin", "false");
        sessionStorage.setItem("jaigo_demo_access_token", "demo-token-customer");
      } catch {}
      setUser(mockUser);
      setIsAdmin(false);
      setAccessTokenState("demo-token-customer");
      return "demo-token-customer";
    }
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem("jaigo_demo_user");
      sessionStorage.removeItem("jaigo_demo_is_admin");
      sessionStorage.removeItem("jaigo_demo_access_token");
    } catch {}
    await logout();
    setUser(null);
    setIsAdmin(false);
    setAccessTokenState(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (sessionStorage.getItem("jaigo_demo_user")) {
          setLoading(false);
          return;
        }
      } catch {}

      setUser(firebaseUser);
      if (firebaseUser) {
        // Restricted to specific admin email
        setIsAdmin(firebaseUser.email === "venimurugesh@gmail.com");
      } else {
        setIsAdmin(false);
        setAccessTokenState(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        accessToken,
        setAccessToken,
        login,
        loginAsDemoUser,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
