import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export function useSocket() {
    return useContext(SocketContext);
}

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Use environment variable for WebSocket URL
        // In production (Railway), this will be the backend domain
        // In development, fallback to localhost:3001
        const wsUrl = import.meta.env.VITE_WS_URL || `${window.location.protocol}//${window.location.hostname}:3001`;

        // Log detailed info for debugging
        const debugInfo = {
            windowLocation: window.location.href,
            windowHostname: window.location.hostname,
            envWsUrl: import.meta.env.VITE_WS_URL,
            finalWsUrl: wsUrl,
            isProduction: !!import.meta.env.VITE_WS_URL
        };

        console.log('[SOCKET CONTEXT] Socket URL resolution:', debugInfo);
        console.log('[SOCKET CONTEXT] Connecting to:', wsUrl);

        const newSocket = io(wsUrl, {
            auth: { token },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
            transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
            upgrade: true,
            rememberUpgrade: true
        });

        newSocket.on('connect', () => {
            console.log('[SOCKET CONTEXT] Socket connected successfully', {
                socketId: newSocket.id,
                url: wsUrl
            });
            setConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            console.warn('[SOCKET CONTEXT] Socket disconnected', {
                reason,
                socketId: newSocket.id,
                url: wsUrl,
                willReconnect: newSocket.active
            });
            setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('[SOCKET CONTEXT] Connection error:', error);
            console.error('[SOCKET CONTEXT] Error details:', {
                message: error.message,
                type: error.type,
                description: error.description,
                url: wsUrl
            });

            // If authentication error, try to refresh token
            if (error.message.includes('Authentication')) {
                console.error('[SOCKET CONTEXT] Authentication failed - check token');
                const currentToken = localStorage.getItem('token');

                // Try reconnecting with fresh auth after a delay
                setTimeout(() => {
                    if (currentToken) {
                        console.log('[SOCKET CONTEXT] Retrying connection with token...');
                        newSocket.auth = { token: currentToken };
                        newSocket.connect();
                    }
                }, 2000);
            }
        });

        // Handle visibility change (important for mobile)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('[SOCKET CONTEXT] Page became visible, checking connection...');
                if (!newSocket.connected) {
                    console.log('[SOCKET CONTEXT] Reconnecting...');
                    newSocket.connect();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Periodic connection check (every 10 seconds)
        const connectionCheckInterval = setInterval(() => {
            if (!newSocket.connected && newSocket.active) {
                console.warn('[SOCKET CONTEXT] Socket not connected but active, attempting reconnect...');
                newSocket.connect();
            } else if (!newSocket.connected && !newSocket.active) {
                console.error('[SOCKET CONTEXT] Socket not connected and not active!');
                // Force reconnection with fresh token
                const currentToken = localStorage.getItem('token');
                if (currentToken) {
                    console.log('[SOCKET CONTEXT] Attempting to reconnect with token...');
                    newSocket.auth = { token: currentToken };
                    newSocket.connect();
                }
            } else {
                console.log('[SOCKET CONTEXT] Connection check OK - socket connected');
            }
        }, 10000); // Check every 10 seconds

        setSocket(newSocket);

        return () => {
            clearInterval(connectionCheckInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            newSocket.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
}
