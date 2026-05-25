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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  accessToken: null,
  setAccessToken: () => {},
  login: async () => null,
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);

  const setAccessToken = (token: string | null) => {
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

  const handleLogout = async () => {
    await logout();
    setAccessTokenState(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Restricted to specific admin emails
        setIsAdmin(
          ["jaigogroups@gmail.com", "venimurugesh@gmail.com"].includes(
            user.email || "",
          ),
        );
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
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
