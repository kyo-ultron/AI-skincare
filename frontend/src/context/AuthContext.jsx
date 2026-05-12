import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Changed "skincare_token" to "token" to match CheckoutPage and standards
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  /**
   * Helper to set/remove Authorization header globally
   */
  const setAuthHeader = useCallback((token) => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, []);

  // Update headers whenever the token state changes
  useEffect(() => {
    setAuthHeader(token);
  }, [token, setAuthHeader]);

  /**
   * Verify token on mount to keep user logged in across refreshes
   */
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        // Ensure the global header is set before the verification call
        setAuthHeader(token);
        const res = await axios.get("/api/auth/me");
        setUser(res.data.user);
      } catch (err) {
        console.error("Token verification failed:", err.message);
        // If the token is invalid/expired, clear everything
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token, setAuthHeader]);

  /**
   * Login Function
   */
  const login = async (email, password) => {
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      const { token: newToken, user: newUser } = res.data;

      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(newUser);
      
      return res.data;
    } catch (err) {
      throw err; // Pass error to the LoginPage
    }
  };

  /**
   * Register Function
   */
  const register = async (name, email, password) => {
    try {
      const res = await axios.post("/api/auth/register", { name, email, password });
      const { token: newToken, user: newUser } = res.data;

      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(newUser);

      return res.data;
    } catch (err) {
      throw err; // Pass error to the RegisterPage
    }
  };

  /**
   * Logout Function
   */
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setAuthHeader(null);
  }, [setAuthHeader]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};