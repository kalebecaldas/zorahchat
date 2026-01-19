const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const jwt = require('jsonwebtoken');
const { initializeDatabase } = require('./database');
const authRoutes = require('./routes/auth');
const workspaceRoutes = require('./routes/workspaces');
const channelRoutes = require('./routes/channels');
const messageRoutes = require('./routes/messages');
const uploadRoutes = require('./routes/upload');
const directMessageRoutes = require('./routes/directMessages');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');

// Load environment variables
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Environment variables
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_in_production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS configuration
const corsOrigin = NODE_ENV === 'production' ? FRONTEND_URL : '*';

const io = socketIo(server, {
    cors: {
        origin: corsOrigin,
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'], // Allow fallback to polling for mobile
    allowEIO3: true, // Compatibility
    pingTimeout: 60000,
    pingInterval: 25000,
    // Add connection state recovery to handle disconnections better
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true
    }
});

// Log all connection attempts (before auth)
io.engine.on('connection_error', (err) => {
    console.error('[SOCKET ENGINE] Connection error:', err);
});

app.use(cors({
    origin: corsOrigin,
    credentials: true
}));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize Database
initializeDatabase().then(async () => {
    // REMOVED: Don't reset user statuses on startup
    // This was causing users to lose their away/busy status
    // Users will be set to online when they actually connect via socket
    console.log('[DATABASE] Database initialized - preserving user statuses');
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

// Socket.io authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        console.error('[SOCKET AUTH] No token provided');
        return next(new Error('Authentication error: No token'));
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.userId = decoded.userId;
        console.log(`[SOCKET AUTH] User ${decoded.userId} authenticated successfully`);
        next();
    } catch (err) {
        console.error('[SOCKET AUTH] Token verification failed:', err.message);
        next(new Error(`Authentication error: ${err.message}`));
    }
});

const { getDb } = require('./database');

// Socket.io connection handling
io.on('connection', async (socket) => {
    const userId = socket.userId;
    const socketId = socket.id;
    console.log(`[SOCKET] User ${userId} connected with socket ID: ${socketId}`);
    console.log(`[SOCKET DEBUG] Connection details:`, {
        userId,
        socketId,
        transport: socket.conn.transport.name,
        remoteAddress: socket.handshake.address,
        headers: socket.handshake.headers['user-agent']
    });
    const db = getDb();

    // Get current user status and handle connection
    try {
        const currentUser = await db.get('SELECT status FROM users WHERE id = ?', [userId]);
        let userStatus = currentUser?.status || 'online';

        // If user was offline, set to online (they just connected)
        // But preserve away/busy status (user explicitly set these)
        if (!userStatus || userStatus === 'offline') {
            await db.run('UPDATE users SET status = ? WHERE id = ?', ['online', userId]);
            userStatus = 'online';
            console.log(`[SOCKET] User ${userId} connected, setting from ${currentUser?.status} to online`);
        } else {
            console.log(`[SOCKET] User ${userId} connected with preserved status: ${userStatus}`);
        }

        // Get all connected sockets for debugging
        const allSockets = await io.fetchSockets();
        const connectedUserIds = allSockets.map(s => s.userId);
        console.log(`[SOCKET] Total connected users: ${allSockets.length}`, {
            userIds: connectedUserIds,
            socketIds: allSockets.map(s => s.id),
            uniqueUserIds: [...new Set(connectedUserIds)]
        });

        console.log(`[SOCKET] Emitting user-status-change for user ${userId} to status: ${userStatus}`);
        io.emit('user-status-change', { userId, status: userStatus });
        console.log(`[SOCKET] ✓ user-status-change event emitted to all clients`);
    } catch (err) {
        console.error('Error setting user online:', err);
    }

    // Join workspace room
    socket.on('join-workspace', (workspaceId) => {
        socket.join(`workspace-${workspaceId}`);
        console.log(`User ${userId} joined workspace ${workspaceId}`);
    });

    // Join channel room
    socket.on('join-channel', async (channelId) => {
        socket.join(`channel-${channelId}`);

        // Also ensure user is in the workspace room
        // Get workspace_id from channel
        try {
            const channel = await db.get('SELECT workspace_id FROM channels WHERE id = ?', [channelId]);
            if (channel) {
                socket.join(`workspace-${channel.workspace_id}`);
                console.log(`User ${userId} also joined workspace ${channel.workspace_id}`);
            }
        } catch (err) {
            console.error('Error joining workspace for channel:', err);
        }

        const socketsInRoom = await io.in(`channel-${channelId}`).fetchSockets();
        const userIdsInRoom = socketsInRoom.map(s => s.userId);
        console.log(`User ${userId} joined channel ${channelId}`);
        console.log(`Users currently in channel-${channelId}:`, userIdsInRoom);
    });

    // Join DM room
    socket.on('join-dm', async (dmId) => {
        socket.join(`dm-${dmId}`);

        // Get all sockets in this room for debugging
        const socketsInRoom = await io.in(`dm-${dmId}`).fetchSockets();
        const userIdsInRoom = socketsInRoom.map(s => s.userId);

        console.log(`User ${userId} joined DM ${dmId}`);
        console.log(`Users currently in dm-${dmId}:`, userIdsInRoom);
    });

    // Leave channel room
    socket.on('leave-channel', (channelId) => {
        socket.leave(`channel-${channelId}`);
    });

    // Leave DM room
    socket.on('leave-dm', (dmId) => {
        socket.leave(`dm-${dmId}`);
    });

    // Typing indicator
    socket.on('typing', ({ channelId, userName }) => {
        socket.to(`channel-${channelId}`).emit('user-typing', { userName });
    });

    socket.on('stop-typing', ({ channelId }) => {
        socket.to(`channel-${channelId}`).emit('user-stop-typing');
    });

    socket.on('disconnect', async () => {
        console.log(`[SOCKET] User ${userId} disconnected (socket ID: ${socket.id})`);

        // Check if user has other active connections
        const activeSockets = await io.fetchSockets();
        const stillConnected = activeSockets.some(s => s.userId === userId);

        console.log(`[SOCKET] User ${userId} still connected: ${stillConnected}`, {
            remainingSockets: activeSockets.map(s => ({ userId: s.userId, socketId: s.id }))
        });

        if (!stillConnected) {
            try {
                // Only set to offline if user was 'online' - preserve away/busy status
                const currentUser = await db.get('SELECT status FROM users WHERE id = ?', [userId]);

                if (currentUser?.status === 'online') {
                    console.log(`[SOCKET] User ${userId} has no other connections, setting to offline`);
                    await db.run(
                        'UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
                        ['offline', userId]
                    );
                    console.log(`[SOCKET] Emitting user-status-change for user ${userId} to status: offline`);
                    io.emit('user-status-change', { userId, status: 'offline' });
                    console.log(`[SOCKET] ✓ user-status-change (offline) event emitted to all clients`);
                } else {
                    console.log(`[SOCKET] User ${userId} disconnected but status is ${currentUser?.status}, preserving it`);
                    // Just update last_seen, don't change status
                    await db.run('UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
                }
            } catch (err) {
                console.error('Error setting user offline:', err);
            }
        } else {
            console.log(`[SOCKET] User ${userId} still has other active connections, keeping online`);
        }
    });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dm', directMessageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Healthcheck endpoint for Railway
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.get('/', (req, res) => {
    res.send('ZORAH CHAT Backend Running with WebSocket');
});

// Periodic connection status check (every 30 seconds) - useful for monitoring
setInterval(async () => {
    try {
        const allSockets = await io.fetchSockets();
        const connectedUserIds = [...new Set(allSockets.map(s => s.userId))];
        console.log(`[SOCKET STATUS] Periodic check - Connected users:`, {
            count: connectedUserIds.length,
            userIds: connectedUserIds,
            totalSockets: allSockets.length
        });
    } catch (err) {
        console.error('[SOCKET STATUS] Error checking connections:', err);
    }
}, 30000); // Every 30 seconds

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Network access: http://0.0.0.0:${PORT}`);
    console.log(`WebSocket server ready`);
    console.log(`[SOCKET STATUS] Periodic connection monitoring enabled (every 30s)`);
});
