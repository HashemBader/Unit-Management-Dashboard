
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// This is a simple authentication hook for demo purposes
// In a real app, this would use JWT or other token-based auth

export function useAuth() {
  // In a real app, we would check for a token in localStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    // For demo purposes, just simulate a check
    const checkAuth = () => {
      const path = window.location.pathname;
      // If we're not on the login page, redirect there
      if (path !== "/login") {
        // This would be a real auth check in a production app
        // For demo, just allow access as if they're authenticated
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const login = (username: string, password: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // Simulate API call
      setTimeout(() => {
        if (username === "admin" && password === "password") {
          setIsAuthenticated(true);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 1000);
    });
  };

  const logout = () => {
    setIsAuthenticated(false);
    navigate("/login");
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout
  };
}
