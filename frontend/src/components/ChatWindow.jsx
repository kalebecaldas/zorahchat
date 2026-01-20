import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import FileModal from './FileModal';
import MentionAutocomplete from './MentionAutocomplete';
import '../chat-premium.css';

const EMOJI_PICKER = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🚀', '👀'];

export default function ChatWindow({ workspaceId, channelId, dmId }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [channelName, setChannelName] = useState('');
    const [dmUser, setDmUser] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [mentionState, setMentionState] = useState(null); // { query, position, startIndex }
    const [channelMembers, setChannelMembers] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(null); // ID do separador de data ativo
    const [selectedDate, setSelectedDate] = useState(null); // Data selecionada para navegação
    const endRef = useRef(null);
    const fileInputRef = useRef(null);
    const messageInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const channelCacheRef = useRef({}); // Cache para nomes de canais: { channelId: name }
    const dmCacheRef = useRef({}); // Cache para info de DMs: { dmId: { name, avatar, status } }
    const { user } = useAuth();
    const { socket, connected } = useSocket();
    const [connectionDebug, setConnectionDebug] = useState('');
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const location = useLocation(); // 🚀 Access navigation state

    const isDM = !!dmId;

    useEffect(() => {
        if (!channelId && !dmId) return;
        if (!socket) return;

        console.log('[SOCKET] Setting up room and listeners for:', { channelId, dmId });

        setMessages([]); // Clear stale messages

        // 🚀 INSTANT LOAD: Check navigation state first, then cache

        let hasInstantData = false;

        // 1. Channel Name
        if (!isDM && channelId) {
            if (location.state?.channelName) {
                setChannelName(location.state.channelName);
                channelCacheRef.current[channelId] = location.state.channelName; // Update cache
                hasInstantData = true;
            } else if (channelCacheRef.current[channelId]) {
                setChannelName(channelCacheRef.current[channelId]);
                hasInstantData = true;
            } else {
                setChannelName(''); // Don't clear if we're fetching soon, but strictly usually safe
            }
        }

        // 2. DM User Info
        if (isDM && dmId) {
            if (location.state?.dmInfo) {
                setDmUser(location.state.dmInfo);
                dmCacheRef.current[dmId] = location.state.dmInfo; // Update cache
                hasInstantData = true;
            } else if (dmCacheRef.current[dmId]) {
                setDmUser(dmCacheRef.current[dmId]);
                hasInstantData = true;
            } else {
                setDmUser(null);
            }
        }

        // Helper function to mark channel/DM as read
        const markAsRead = async () => {
            console.log('[CHAT] markAsRead called:', { channelId, dmId });
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('[CHAT] No token available for markAsRead');
                return;
            }

            if (channelId) {
                try {
                    console.log(`[CHAT] Marking channel ${channelId} as read...`);
                    const res = await fetch(`/api/messages/channels/${channelId}/read`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (res.ok) {
                        console.log(`[CHAT] ✓ Successfully marked channel ${channelId} as read:`, data);
                        // Notify sidebar to update unread counts
                        if (socket) {
                            socket.emit('channel-marked-read', channelId);
                        }
                    } else {
                        console.error(`[CHAT] ✗ Failed to mark channel as read:`, data);
                    }
                } catch (err) {
                    console.error('[CHAT] Error marking channel as read:', err);
                }
            } else if (dmId) {
                try {
                    console.log(`[CHAT] Marking DM ${dmId} as read...`);
                    const res = await fetch(`/api/dm/${dmId}/read`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (res.ok) {
                        console.log(`[CHAT] ✓ Successfully marked DM ${dmId} as read:`, data);
                        // Notify sidebar to update unread counts
                        if (socket) {
                            socket.emit('dm-marked-read', dmId);
                        }
                    } else {
                        console.error(`[CHAT] ✗ Failed to mark DM as read:`, data);
                    }
                } catch (err) {
                    console.error('[CHAT] Error marking DM as read:', err);
                }
            } else {
                console.warn('[CHAT] markAsRead called but no channelId or dmId');
            }
        };

        // Fetch messages with AbortSignal
        const abortController = new AbortController();
        console.log('[CHAT] Fetching messages for:', { channelId, dmId });
        fetchMessages(abortController.signal);

        // Fetch channel members for mentions (only for channels, not DMs)
        if (channelId && !dmId) {
            fetchChannelMembers();
        }

        // Mark as read after messages are loaded
        console.log('[CHAT] Will mark as read after 500ms');
        setTimeout(() => {
            console.log('[CHAT] Calling markAsRead now');
            markAsRead();
        }, 500);

        const joinRoom = () => {
            if (socket) {
                if (channelId) {
                    socket.emit('join-channel', channelId);
                    console.log('Joined channel:', channelId);
                }
                if (dmId) {
                    socket.emit('join-dm', dmId);
                    console.log('Joined DM:', dmId);
                }
            }
        };

        // Initial join
        joinRoom();

        // Re-join on reconnect
        const handleReconnect = () => {
            console.log('[SOCKET] Connected, joining room...');
            joinRoom();
        };

        socket.on('connect', handleReconnect);

        // Set up message listener for THIS specific room
        const handleNewMessage = (message) => {
            console.log('[SOCKET] Received new-message in room listener:', {
                messageId: message.id,
                messageChannelId: message.channel_id,
                messageDmId: message.dm_id,
                currentChannelId: channelId,
                currentDmId: dmId,
                channelMatch: channelId && message.channel_id == channelId,
                dmMatch: dmId && message.dm_id == dmId,
                content: message.content?.substring(0, 50),
                userId: message.user_id,
                userName: message.user_name
            });

            // Only add message if it belongs to current channel/DM
            const belongsHere = (channelId && message.channel_id == channelId) ||
                (dmId && message.dm_id == dmId);

            if (!belongsHere) {
                console.log('[SOCKET] Message does not belong to current room, ignoring', {
                    reason: channelId ? `Expected channel ${channelId}, got ${message.channel_id}` : `Expected DM ${dmId}, got ${message.dm_id}`
                });
                return;
            }

            setMessages(prev => {
                if (prev.some(m => m.id === message.id)) {
                    console.log('[SOCKET] Duplicate message detected, skipping', { messageId: message.id });
                    return prev;
                }
                console.log('[SOCKET] ✓ Adding message to state', { messageId: message.id, totalMessages: prev.length + 1 });

                // Mark as read when new message arrives (user is viewing this channel/DM)
                setTimeout(() => {
                    markAsRead();
                }, 100);

                return [...prev, message];
            });
            scrollToBottom();

            // Browser Notification
            if (document.hidden && Number(message.user_id) !== Number(user?.id)) {
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(`Nova mensagem de ${message.user_name}`, {
                        body: message.content || '📎 Arquivo enviado',
                        icon: message.avatar_url || '/favicon.ico'
                    });
                }
            }
        };

        socket.on('new-message', handleNewMessage);
        console.log('[SOCKET] ✓ Listener "new-message" registered', {
            channelId,
            dmId,
            socketConnected: socket.connected,
            socketId: socket.id
        });

        // Periodic re-join for mobile reliability (every 30 seconds)
        const rejoinInterval = setInterval(() => {
            if (socket && socket.connected) {
                console.log('[SOCKET] Periodic room re-join (mobile reliability)');
                joinRoom();
            } else {
                console.log('[SOCKET] Skipping periodic re-join - socket not connected');
            }
        }, 30000);

        return () => {
            console.log('[SOCKET] Cleaning up room and listeners');
            abortController.abort(); // 🚀 Cancel pending fetches
            clearInterval(rejoinInterval);
            socket.off('connect', handleReconnect);
            socket.off('new-message', handleNewMessage);
            if (channelId) socket.emit('leave-channel', channelId);
            if (dmId) socket.emit('leave-dm', dmId);
        };
    }, [channelId, dmId, socket, user]);

    useEffect(() => {
        if (!socket) return;

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Listen for reactions
        socket.on('reaction-update', ({ messageId, reactions }) => {
            setMessages(prev => prev.map(msg =>
                msg.id === messageId ? { ...msg, reactions } : msg
            ));
        });

        // Listen for typing
        socket.on('user-typing', ({ userName }) => {
            setTypingUser(userName);
        });

        socket.on('user-stop-typing', () => {
            setTypingUser(null);
        });

        // Listen for status changes to update DM user status in real-time
        socket.on('user-status-change', ({ userId, status }) => {
            if (isDM && dmUser && dmUser.id === userId) {
                console.log('[CHAT] Updating DM user status:', { userId, status });
                setDmUser(prev => prev ? { ...prev, status } : null);
            }
        });

        // Listen for edited messages
        socket.on('message-edited', (updatedMessage) => {
            setMessages(prev => prev.map(msg =>
                msg.id === updatedMessage.id ? updatedMessage : msg
            ));
        });

        // Listen for deleted messages
        socket.on('message-deleted', ({ messageId }) => {
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
        });

        return () => {
            socket.off('reaction-update');
            socket.off('user-typing');
            socket.off('user-stop-typing');
            socket.off('message-edited');
            socket.off('message-deleted');
        };
    }, [socket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fechar dropdown de data ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showDatePicker && !e.target.closest('.date-separator-container')) {
                setShowDatePicker(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDatePicker]);

    const scrollToBottom = () => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchChannelMembers = async () => {
        if (!channelId || !workspaceId || isDM) return;
        const token = localStorage.getItem('token');
        try {
            // Get all workspace members (for @channel/@here mentions)
            const res = await fetch(`/api/users/${workspaceId}/members`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const members = await res.json();
                setChannelMembers(members);
            }
        } catch (err) {
            console.error('Error fetching channel members:', err);
        }
    };

    const fetchMessages = async (signal) => {
        const token = localStorage.getItem('token');
        setIsLoadingMessages(true);

        try {
            if (isDM) {
                // For DMs, fetch messages and DM info in parallel
                const [messagesRes, dmInfoRes] = await Promise.all([
                    fetch(`/api/dm/${dmId}/messages`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                        signal
                    }),
                    fetch(`/api/dm/${workspaceId}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                        signal
                    })
                ]);

                if (signal?.aborted) return;

                if (messagesRes.ok) {
                    const data = await messagesRes.json();
                    if (!signal?.aborted) setMessages(data);
                }

                if (dmInfoRes.ok) {
                    const dms = await dmInfoRes.json();
                    const currentDm = dms.find(d => d.id == dmId);
                    if (currentDm && !signal?.aborted) {
                        const dmUserData = {
                            name: currentDm.other_user_name,
                            avatar: currentDm.other_user_avatar,
                            status: currentDm.other_user_status
                        };
                        setDmUser(dmUserData);
                        // Save to cache for instant display next time
                        dmCacheRef.current[dmId] = dmUserData;
                    }
                }
            } else {
                // For channels:

                // 1. Fetch messages
                const messagesRes = await fetch(`/api/messages/${channelId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal
                });

                if (signal?.aborted) return;

                if (messagesRes.ok) {
                    const data = await messagesRes.json();
                    if (!signal?.aborted) setMessages(data);
                }

                // 2. Fetch channel info to confirm name (as backup/sync)
                // We use Promise.allSettled to not block messages if this fails/is slow
                // Or just separate fetch.
                const chRes = await fetch(`/api/channels/${workspaceId}/channel/${channelId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal
                });

                if (chRes.ok && !signal?.aborted) {
                    const channel = await chRes.json();
                    setChannelName(channel.name);
                    channelCacheRef.current[channelId] = channel.name;
                }
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('[CHAT] Error fetching messages:', error);
            }
        } finally {
            if (!signal?.aborted) setIsLoadingMessages(false);
        }
    };

    const handleTyping = () => {
        if (!socket || !channelId) return;

        if (!isTyping) {
            setIsTyping(true);
            socket.emit('typing', { channelId, userName: user?.name });
        }

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socket.emit('stop-typing', { channelId });
        }, 1000);
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setUploadedFile(data);
            } else {
                alert('Erro ao fazer upload do arquivo');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Erro ao fazer upload do arquivo');
        } finally {
            setUploading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !uploadedFile) return;

        const token = localStorage.getItem('token');
        const endpoint = isDM ? `/api/dm/${dmId}/messages` : '/api/messages';

        const body = isDM ? {
            content: newMessage,
            attachment_url: uploadedFile?.url,
            attachment_type: uploadedFile?.type,
            attachment_name: uploadedFile?.name
        } : {
            channelId,
            content: newMessage,
            attachment_url: uploadedFile?.url,
            attachment_type: uploadedFile?.type,
            attachment_name: uploadedFile?.name
        };

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            const sentMessage = await res.json();

            // Optimistically add message if not already present (prevents waiting for socket)
            setMessages(prev => {
                if (prev.some(m => m.id === sentMessage.id)) return prev;
                return [...prev, sentMessage];
            });
            scrollToBottom();

            setNewMessage('');
            setUploadedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

            if (socket && channelId) {
                socket.emit('stop-typing', { channelId });
                setIsTyping(false);
            }
        } else {
            const data = await res.json();
            alert(`Erro ao enviar mensagem: ${data.error || 'Erro desconhecido'}`);
        }
    };

    const handleReaction = async (messageId, emoji) => {
        const token = localStorage.getItem('token');
        await fetch(`/api/messages/${messageId}/reactions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ emoji })
        });
        setShowEmojiPicker(null);
    };

    const renderAttachment = (msg) => {
        if (!msg.attachment_url) return null;

        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const baseUrl = `${protocol}//${hostname}:3001`;
        const fullUrl = msg.attachment_url.startsWith('http') ? msg.attachment_url : `${baseUrl}${msg.attachment_url}`;

        const handleFileClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setSelectedFile(msg);
        };

        const getFileIcon = () => {
            const ext = msg.attachment_name?.split('.').pop()?.toLowerCase();
            if (['pdf'].includes(ext)) return '📄';
            if (['doc', 'docx'].includes(ext)) return '📝';
            if (['xls', 'xlsx'].includes(ext)) return '📊';
            if (['zip', 'rar', '7z'].includes(ext)) return '📦';
            if (['txt'].includes(ext)) return '📃';
            return '📎';
        };

        switch (msg.attachment_type) {
            case 'image':
                return (
                    <div
                        onClick={handleFileClick}
                        style={{
                            marginTop: '0.5rem',
                            cursor: 'pointer',
                            position: 'relative',
                            display: 'inline-block',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <img
                            src={fullUrl}
                            alt={msg.attachment_name}
                            style={{
                                maxWidth: '400px',
                                maxHeight: '300px',
                                borderRadius: 'var(--radius-sm)',
                                display: 'block',
                                objectFit: 'cover'
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                            padding: '8px',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                        }}>
                            {msg.attachment_name}
                        </div>
                    </div>
                );
            case 'video':
                return (
                    <div
                        onClick={handleFileClick}
                        style={{
                            marginTop: '0.5rem',
                            cursor: 'pointer',
                            position: 'relative',
                            display: 'inline-block',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <video
                            style={{
                                maxWidth: '400px',
                                maxHeight: '300px',
                                borderRadius: 'var(--radius-sm)',
                                display: 'block',
                                objectFit: 'cover',
                                pointerEvents: 'none'
                            }}
                        >
                            <source src={fullUrl} />
                        </video>
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0,0,0,0.3)'
                        }}>
                            <div style={{
                                background: 'rgba(0,0,0,0.7)',
                                borderRadius: '50%',
                                width: '60px',
                                height: '60px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px'
                            }}>▶️</div>
                        </div>
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                            padding: '8px',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                        }}>
                            {msg.attachment_name}
                        </div>
                    </div>
                );
            case 'audio':
                return (
                    <div
                        onClick={handleFileClick}
                        style={{
                            marginTop: '0.5rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            background: 'var(--zorah-surface)',
                            border: '1px solid var(--zorah-border)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-primary)',
                            transition: 'all 0.2s',
                            maxWidth: '400px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--zorah-surface-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--zorah-surface)'}
                    >
                        <span style={{ fontSize: '1.5rem' }}>🎵</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{msg.attachment_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Clique para visualizar</div>
                        </div>
                    </div>
                );
            default:
                // Check if it's a PDF or other previewable file
                const ext = msg.attachment_name?.split('.').pop()?.toLowerCase();
                const isPdf = ext === 'pdf' || msg.attachment_type === 'application' && ext === 'pdf';

                return (
                    <div
                        onClick={isPdf ? handleFileClick : undefined}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            background: 'var(--zorah-surface)',
                            border: '1px solid var(--zorah-border)',
                            borderRadius: 'var(--radius-sm)',
                            marginTop: '0.5rem',
                            color: 'var(--text-primary)',
                            transition: 'all 0.2s',
                            cursor: isPdf ? 'pointer' : 'default',
                            maxWidth: '400px'
                        }}
                        onMouseEnter={e => {
                            if (isPdf) e.currentTarget.style.background = 'var(--zorah-surface-hover)';
                        }}
                        onMouseLeave={e => {
                            if (isPdf) e.currentTarget.style.background = 'var(--zorah-surface)';
                        }}
                    >
                        <span style={{ fontSize: '1.5rem' }}>{getFileIcon()}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {msg.attachment_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                {isPdf ? 'Clique para visualizar' : 'Clique para baixar'}
                            </div>
                        </div>
                        {!isPdf && (
                            <a
                                href={fullUrl}
                                download={msg.attachment_name}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    padding: '4px 8px',
                                    background: 'var(--zorah-primary)',
                                    color: 'white',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--zorah-primary-hover)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'var(--zorah-primary)'}
                            >
                                ⬇️
                            </a>
                        )}
                    </div>
                );
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return '#10b981';
            case 'away': return '#f59e0b';
            case 'busy': return '#ef4444';
            case 'offline': return '#6b7280';
            default: return '#10b981';
        }
    };

    // Handle mention input detection
    const handleMentionInput = (value, inputElement) => {
        const cursorPosition = inputElement.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPosition);

        // Find last @ before cursor
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            // Check if there's a space after @ (if so, don't show autocomplete)
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
            if (textAfterAt.includes(' ') || textAfterAt.includes('\n')) {
                setMentionState(null);
                return;
            }

            // Get query (text after @)
            const query = textAfterAt.trim();

            // Calculate position for autocomplete (above input)
            const rect = inputElement.getBoundingClientRect();
            const position = {
                left: 0,
                bottom: 'calc(100% + 8px)'
            };

            setMentionState({
                query,
                position,
                startIndex: lastAtIndex
            });
        } else {
            setMentionState(null);
        }
    };

    // Handle mention selection
    const handleMentionSelect = (username, type, userId, startIndex) => {
        const currentValue = newMessage;
        const textBefore = currentValue.substring(0, startIndex);
        const textAfter = currentValue.substring(startIndex);

        // Find where the @mention ends (space or end of string)
        const mentionEnd = textAfter.search(/[\s\n]/);
        const mentionEndIndex = mentionEnd === -1 ? textAfter.length : mentionEnd + 1;
        const textAfterMention = textAfter.substring(mentionEndIndex);

        // Build new message with mention
        let mentionText = '';
        if (type === 'channel' || type === 'here') {
            mentionText = `@${username}`;
        } else {
            mentionText = `@${username}`;
        }

        const newValue = textBefore + mentionText + ' ' + textAfterMention;
        setNewMessage(newValue);
        setMentionState(null);

        // Focus input and set cursor position after mention
        if (messageInputRef.current) {
            const newCursorPos = (textBefore + mentionText + ' ').length;
            setTimeout(() => {
                messageInputRef.current?.focus();
                messageInputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
        }
    };

    // Função para formatar data no estilo Slack
    const formatDateSeparator = (date) => {
        const messageDate = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Resetar horas para comparação apenas de datas
        const resetTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const msgDate = resetTime(messageDate);
        const todayDate = resetTime(today);
        const yesterdayDate = resetTime(yesterday);

        if (msgDate.getTime() === todayDate.getTime()) {
            return 'Hoje';
        } else if (msgDate.getTime() === yesterdayDate.getTime()) {
            return 'Ontem';
        } else {
            // Formato: "Sexta-feira, 16 de janeiro"
            const options = { weekday: 'long', day: 'numeric', month: 'long' };
            return messageDate.toLocaleDateString('pt-BR', options);
        }
    };

    // Função para agrupar mensagens por data
    const groupMessagesByDate = (messages) => {
        const groups = [];
        let currentDate = null;

        messages.forEach((msg, index) => {
            const msgDate = new Date(msg.created_at).toDateString();

            if (msgDate !== currentDate) {
                currentDate = msgDate;
                groups.push({
                    type: 'date-separator',
                    date: msg.created_at,
                    id: `date-${msgDate}`
                });
            }

            groups.push({
                type: 'message',
                data: msg
            });
        });

        return groups;
    };

    // Função para navegar para data específica
    const jumpToDate = (dateOption) => {
        const targetDate = new Date();

        switch (dateOption) {
            case 'today':
                // Já está em hoje
                break;
            case 'yesterday':
                targetDate.setDate(targetDate.getDate() - 1);
                break;
            case 'last-week':
                targetDate.setDate(targetDate.getDate() - 7);
                break;
            case 'custom':
                // Abrir seletor de data customizado
                // Por enquanto, vamos apenas fechar o dropdown
                setShowDatePicker(null);
                return;
            default:
                break;
        }

        setSelectedDate(targetDate);
        setShowDatePicker(null);

        // Aqui você pode implementar a lógica para buscar mensagens da data específica
        // Por exemplo: fetchMessagesForDate(targetDate);
    };

    if (!channelId && !dmId) {
        return (
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-tertiary)',
                background: 'var(--zorah-bg)',
                fontSize: '1rem'
            }}>
                Selecione um canal ou mensagem direta para começar
            </div>
        );
    }

    return (
        <div className="chat-window">
            <header className="chat-header">
                {/* Connection Status (Hidden on production usually, but kept for debug) */}
                {socket && (
                    <div className={`socket-status ${socket.connected ? 'connected' : 'disconnected'}`}>
                        <div className="status-dot" />
                        <span>{socket.connected ? 'On' : 'Off'}</span>
                    </div>
                )}

                {isDM ? (
                    <div className="header-content">
                        <div className="header-avatar-container">
                            <div className="header-avatar">
                                {dmUser?.avatar ? (
                                    <img src={dmUser.avatar} alt="" />
                                ) : (
                                    dmUser?.name?.[0]?.toUpperCase()
                                )}
                            </div>
                            <div className={`status-indicator status-${dmUser?.status || 'offline'}`} />
                        </div>
                        <h2 className="header-title">{dmUser?.name}</h2>
                    </div>
                ) : (
                    <div className="header-content">
                        <div className="channel-hash">#</div>
                        <h2 className="header-title">{channelName || 'Selecione um canal'}</h2>
                    </div>
                )}
            </header>

            <div className="message-list">
                {messages.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        color: 'var(--text-tertiary)',
                        padding: '3rem',
                        fontSize: '0.95rem'
                    }}>
                        Nenhuma mensagem ainda. Seja o primeiro a enviar!
                    </div>
                )}

                {groupMessagesByDate(messages).map((item, index) => {
                    if (item.type === 'date-separator') {
                        return (
                            <div key={item.id} className="date-separator-container">
                                <div className="date-separator-line" />
                                <button
                                    className="date-separator-button"
                                    onClick={() => setShowDatePicker(showDatePicker === item.id ? null : item.id)}
                                >
                                    <span>{formatDateSeparator(item.date)}</span>
                                    <span className="date-separator-arrow">▼</span>
                                </button>
                                <div className="date-separator-line" />

                                {/* Dropdown de navegação de data */}
                                {showDatePicker === item.id && (
                                    <div className="date-picker-dropdown">
                                        <button
                                            className="date-picker-option"
                                            onClick={() => jumpToDate('today')}
                                        >
                                            📅 Ir para hoje
                                        </button>
                                        <button
                                            className="date-picker-option"
                                            onClick={() => jumpToDate('yesterday')}
                                        >
                                            ⏮️ Ir para ontem
                                        </button>
                                        <button
                                            className="date-picker-option"
                                            onClick={() => jumpToDate('last-week')}
                                        >
                                            📆 Ir para semana passada
                                        </button>
                                        <div className="date-picker-divider" />
                                        <button
                                            className="date-picker-option"
                                            onClick={() => jumpToDate('custom')}
                                        >
                                            🗓️ Escolher data específica...
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    }

                    // Renderizar mensagem
                    const msg = item.data;
                    const isOwnMessage = Number(msg.user_id) === Number(user?.id);
                    if (messages.length > 0 && msg.id === messages[0].id) {
                        console.log('[CHAT DEBUG] First message check:', {
                            msgUserId: msg.user_id,
                            currentUserId: user?.id,
                            isOwnMessage,
                            userName: msg.user_name,
                            currentUserName: user?.name
                        });
                    }
                    return (
                        <div
                            key={msg.id}
                            className={`message-item ${isOwnMessage ? 'own-message' : ''}`}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id);
                            }}
                            // Long press logic for mobile
                            onTouchStart={() => {
                                window.longPressTimer = setTimeout(() => {
                                    setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id);
                                }, 500); // 500ms long press
                            }}
                            onTouchEnd={() => {
                                clearTimeout(window.longPressTimer);
                            }}
                        >
                            <div className="message-avatar">
                                {msg.avatar_url ? (
                                    <img src={msg.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '12px' }} />
                                ) : (
                                    msg.user_name?.[0]?.toUpperCase() || '?'
                                )}
                            </div>
                            <div className="message-content">
                                <div className="message-header">
                                    <span className="username">{msg.user_name}</span>
                                    {Number(msg.user_id) !== Number(user?.id) && (
                                        <span className="timestamp">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {msg.edited_at && <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', color: 'var(--text-tertiary)' }}>(editado)</span>}
                                        </span>
                                    )}
                                </div>
                                {msg.content && <div className="message-body">{msg.content}</div>}
                                {Number(msg.user_id) === Number(user?.id) && (
                                    <span className="timestamp" style={{ alignSelf: 'flex-end', marginTop: '0.25rem' }}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {msg.edited_at && <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}>(editado)</span>}
                                    </span>
                                )}
                                {renderAttachment(msg)}

                                {/* Reactions */}
                                {msg.reactions && msg.reactions.length > 0 && (
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                        {msg.reactions.map((reaction, idx) => (
                                            <button
                                                key={idx}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent toggling menu
                                                    handleReaction(msg.id, reaction.emoji);
                                                }}
                                                style={{
                                                    padding: '0.25rem 0.5rem',
                                                    background: reaction.hasReacted ? 'var(--zorah-primary)' : 'var(--zorah-surface)',
                                                    border: `1px solid ${reaction.hasReacted ? 'var(--zorah-primary)' : 'var(--zorah-border)'}`,
                                                    borderRadius: 'var(--radius-sm)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <span>{reaction.emoji}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{reaction.count}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Context Menu Emoji Picker */}
                                {showEmojiPicker === msg.id && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'var(--zorah-surface)',
                                        border: '1px solid var(--zorah-border)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '0.5rem',
                                        display: 'flex',
                                        gap: '0.5rem',
                                        marginBottom: '0.5rem',
                                        boxShadow: 'var(--shadow-lg)',
                                        zIndex: 100
                                    }}>
                                        {EMOJI_PICKER.map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReaction(msg.id, emoji);
                                                }}
                                                style={{
                                                    padding: '0.5rem',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '1.5rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--zorah-surface-hover)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                <div ref={endRef} />
            </div>

            {/* Typing Indicator - Separate from message list */}
            {typingUser && (
                <div className="typing-indicator-container">
                    <div className="typing-indicator">
                        <span>{typingUser} está digitando</span>
                        <div className="typing-dots">
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                        </div>
                    </div>
                </div>
            )}

            <div className="chat-input-area">
                {uploadedFile && (
                    <div style={{
                        padding: '0.75rem',
                        background: 'var(--zorah-surface)',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>📎</span>
                            <span style={{ fontSize: '0.875rem' }}>{uploadedFile.name}</span>
                        </div>
                        <button
                            onClick={() => {
                                setUploadedFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '1.2rem'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                )}

                <form onSubmit={handleSend} className="chat-input-container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="attach-button"
                            style={{
                                padding: '8px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-tertiary)',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                        >
                            {uploading ? '⏳' : '📎'}
                        </button>

                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                ref={messageInputRef}
                                className="chat-input"
                                value={newMessage}
                                onChange={e => {
                                    const value = e.target.value;
                                    setNewMessage(value);
                                    handleTyping();
                                    if (!isDM && channelId) {
                                        handleMentionInput(value, e.target);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (mentionState && !isDM && ['ArrowDown', 'ArrowUp', 'Enter', 'Tab'].includes(e.key)) {
                                        e.preventDefault();
                                        return;
                                    }
                                    if (e.key === 'Escape' && mentionState) {
                                        setMentionState(null);
                                        return;
                                    }
                                }}
                                onClick={(e) => {
                                    if (mentionState && !isDM) {
                                        handleMentionInput(e.target.value, e.target);
                                    }
                                }}
                                placeholder={isDM ? `Mensagem para ${dmUser?.name || '...'}` : `Enviar mensagem em #${channelName || '...'}`}
                                style={{ width: '100%' }}
                            />

                            {/* Mention Autocomplete - only in channels */}
                            {mentionState && !isDM && channelId && (
                                <MentionAutocomplete
                                    query={mentionState.query}
                                    users={channelMembers}
                                    onSelect={(username, type, userId) => {
                                        handleMentionSelect(username, type, userId, mentionState.startIndex);
                                    }}
                                    onClose={() => setMentionState(null)}
                                    position={mentionState.position}
                                    workspaceId={workspaceId}
                                    channelId={channelId}
                                />
                            )}
                        </div>

                        <button
                            type="submit"
                            className="send-button"
                            style={{
                                padding: '8px 16px',
                                background: 'var(--primary-gradient, #6366f1)',
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            Enviar
                        </button>
                    </div>
                </form>
            </div>

            {/* File Modal */}
            {selectedFile && (
                <FileModal
                    file={selectedFile}
                    onClose={() => setSelectedFile(null)}
                />
            )}
        </div>
    );
}
