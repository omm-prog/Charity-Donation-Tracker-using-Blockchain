import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, signOut } from '../firebaseConfig';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const safeSetState = (setter) => {
    if (mounted.current) {
      setter();
    }
  };

  useEffect(() => {
    try {
      // Check if user data exists in session storage
      const userData = sessionStorage.getItem('userData');
      if (userData) {
        safeSetState(() => setCurrentUser(JSON.parse(userData)));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setError(error.message);
    } finally {
      safeSetState(() => setLoading(false));
    }
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      safeSetState(() => setCurrentUser(null));
      sessionStorage.removeItem('userData');
      localStorage.removeItem('userData');
    } catch (error) {
      console.error("Error logging out:", error);
      setError(error.message);
      throw error; // Propagate error to handle it in components
    }
  };

  const value = {
    currentUser,
    setCurrentUser: (user) => safeSetState(() => setCurrentUser(user)),
    loading,
    error,
    logout
  };

  if (error) {
    return (
      <div className="auth-error">
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <button onClick={() => setError(null)}>Dismiss</button>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 