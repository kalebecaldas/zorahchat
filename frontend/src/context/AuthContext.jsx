import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Invalid token');
                })
                .then(userData => setUser(userData))
                .catch(() => localStorage.removeItem('token'))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            setUser(data.user);
            return { success: true };
        } else {
            return { success: false, error: data.error };
        }
    };

    const register = async (formData) => {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            setUser(data.user);
            return { success: true };
        } else {
            return { success: false, error: data.error };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const updateUser = (updates) => {
        setUser(prev => prev ? { ...prev, ...updates } : null);
    };

    const value = {
        user,
        login,
        register,
        logout,
        updateUser,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
