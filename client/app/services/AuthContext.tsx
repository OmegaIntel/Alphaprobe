// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { API_BASE_URL } from "~/constant";

interface User {
    email: string;
    email_verified: boolean;
    name: string;
    nickname: string;
    picture: string;
    sub: string;
    updated_at: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        // Fetch user info from Auth0's /userinfo endpoint
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token"); // Retrieve the access token
                if (!token) {
                    setUser(null);
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/userinfo`, {
                    headers: {
                        Authorization: `Bearer ${token}`, // Include the token in the Authorization header
                    },
                });

                if (response.ok) {
                    const userData: User = await response.json();
                    setUser(userData);
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error("Failed to fetch user info:", err);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, []);

    const logout = async () => {
        try {
            await fetch(`${API_BASE_URL}/api/logout`, { method: "POST", credentials: "include" });
            localStorage.removeItem("token"); // Clear the token from localStorage
            setUser(null);
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                setUser,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
