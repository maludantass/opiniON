import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AuthUser {
    id: number;
    email: string;
    username: string | null;
    avatarUrl: string | null;
    bio?: string | null;
}

interface AuthContextType {
    token: string | null;
    user: AuthUser | null;
    login: (token: string, user: AuthUser) => void;
    logout: () => void;
    updateUserLocal: (updates: Partial<AuthUser>) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function parseStoredUser(): AuthUser | null {
    try {
        return JSON.parse(localStorage.getItem('user') ?? 'null') as AuthUser | null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
    const [user, setUser] = useState<AuthUser | null>(parseStoredUser);

    const login = useCallback((newToken: string, newUser: AuthUser) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    }, []);

    const updateUserLocal = useCallback((updates: Partial<AuthUser>) => {
        setUser((prev) => {
            if (!prev) return null;
            const updated = { ...prev, ...updates };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    }, []);

    return (
        <AuthContext.Provider value={{ token, user, login, logout, updateUserLocal, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
    return ctx;
}
