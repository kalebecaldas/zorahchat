import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ChannelSettingsModal from './ChannelSettingsModal';

export default function Sidebar({ workspaceId, currentChannelId, currentDmId, className = '' }) {
    const [channels, setChannels] = useState([]);
    const [dms, setDms] = useState([]);
    const [members, setMembers] = useState([]);
    const [workspaceName, setWorkspaceName] = useState('');
    const [allWorkspaces, setAllWorkspaces] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
    const [showPendingRequests, setShowPendingRequests] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [newChannelName, setNewChannelName] = useState('');
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [showChannelSettings, setShowChannelSettings] = useState(false);
    const { user } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [userStatus, setUserStatus] = useState(user?.status || 'online');

    useEffect(() => {
        fetchAllWorkspaces();
        if (user?.status) {
            setUserStatus(user.status);
        }
    }, [user]);

    useEffect(() => {
        if (workspaceId) {
            fetchChannels();
            fetchDMs();
            fetchMembers();
            fetchUnreadCounts();
            fetchPendingRequests();
        }
    }, [workspaceId]);

    // Clear unread count when user navigates to a channel or DM
    useEffect(() => {
        if (currentChannelId) {
            setUnreadCounts(prev => ({
                ...prev,
                [currentChannelId]: 0
            }));
        }
        if (currentDmId) {
            setUnreadCounts(prev => ({
                ...prev,
                [`dm-${currentDmId}`]: 0
            }));
        }
    }, [currentChannelId, currentDmId]);

    const fetchChannels = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/channels/${workspaceId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setChannels(data);
            if (!currentChannelId && !currentDmId && data.length > 0) {
                const general = data.find(c => c.name === 'general') || data[0];
                navigate(`/client/${workspaceId}/${general.id}`);
            }
        }

        const wsRes = await fetch('/api/workspaces', { headers: { 'Authorization': `Bearer ${token}` } });
        if (wsRes.ok) {
            const spaces = await wsRes.json();
            const current = spaces.find(s => s.id == workspaceId);
            if (current) {
                setWorkspaceName(current.name);
                setUserRole(current.role || 'member');
            }
        }
    };

    const fetchDMs = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/dm/${workspaceId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setDms(data);
        }
    };

    const fetchMembers = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/users/${workspaceId}/members`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            const filtered = data.filter(m => m.id !== user?.id);
            console.log('[SIDEBAR] Fetched members from API:', filtered.map(m => ({ id: m.id, name: m.name, status: m.status })));
            setMembers(filtered);
        }
    };

    const fetchUnreadCounts = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/messages/unread/${workspaceId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            const counts = {};
            data.forEach(ch => {
                counts[ch.id] = ch.unread_count;
            });
            setUnreadCounts(counts);
        }
    };

    const fetchAllWorkspaces = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/workspaces', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setAllWorkspaces(data);
        }
    };

    const fetchPendingRequests = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/workspaces/${workspaceId}/pending-requests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setPendingRequests(data);
        }
    };

    const handleApproveRequest = async (requestId) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/workspaces/${workspaceId}/pending-requests/${requestId}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            fetchPendingRequests();
            fetchMembers();
        }
    };

    const handleRejectRequest = async (requestId) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/workspaces/${workspaceId}/pending-requests/${requestId}/reject`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            fetchPendingRequests();
        }
    };

    useEffect(() => {
        if (!socket || !workspaceId) return;

        const joinWorkspace = () => {
            if (socket && socket.connected) {
                socket.emit('join-workspace', workspaceId);
                console.log('[SIDEBAR] Joined workspace:', workspaceId);
            }
        };

        // Join workspace initially
        joinWorkspace();

        // Re-join on reconnect
        socket.on('connect', joinWorkspace);

        socket.on('new-message', () => {
            fetchUnreadCounts();
        });

        // Update unread counts when channel/DM is marked as read
        socket.on('channel-marked-read', (channelId) => {
            console.log('[SIDEBAR] Channel marked as read:', channelId);
            setUnreadCounts(prev => ({
                ...prev,
                [channelId]: 0
            }));
            // Also refresh counts from server to ensure accuracy
            fetchUnreadCounts();
        });

        socket.on('dm-marked-read', (dmId) => {
            console.log('[SIDEBAR] DM marked as read:', dmId);
            setUnreadCounts(prev => ({
                ...prev,
                [`dm-${dmId}`]: 0
            }));
            // Also refresh counts from server to ensure accuracy
            fetchUnreadCounts();
        });

        socket.on('join-request-update', () => {
            fetchPendingRequests();
        });

        socket.on('user-status-change', ({ userId, status }) => {
            console.log('[SIDEBAR] Received user-status-change event:', { userId, status });
            setMembers(prev => {
                const updated = prev.map(m =>
                    m.id === userId ? { ...m, status } : m
                );
                console.log('[SIDEBAR] Updated members status:', updated.map(m => ({ id: m.id, name: m.name, status: m.status })));
                return updated;
            });

            // Also update DMs list status
            setDms(prev => {
                return prev.map(dm => {
                    if (dm.other_user_id === userId) {
                        return { ...dm, other_user_status: status };
                    }
                    return dm;
                });
            });
        });

        return () => {
            socket.off('connect', joinWorkspace);
            socket.off('new-message');
            socket.off('channel-marked-read');
            socket.off('dm-marked-read');
            socket.off('join-request-update');
            socket.off('user-status-change');
        };
    }, [socket, workspaceId]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showWorkspaceMenu && !e.target.closest('.sidebar-header')) {
                setShowWorkspaceMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showWorkspaceMenu]);

    const handleCreateChannel = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const res = await fetch('/api/channels', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ workspaceId, name: newChannelName })
        });

        if (res.ok) {
            const channel = await res.json();
            setChannels([...channels, channel]);
            setNewChannelName('');
            setShowCreate(false);
            navigate(`/client/${workspaceId}/${channel.id}`);
        }
    };

    const handleStartDM = async (memberId) => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/dm/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ workspaceId, userId: memberId })
        });

        if (res.ok) {
            const dm = await res.json();
            navigate(`/client/${workspaceId}/dm/${dm.id}`);
            fetchDMs();
        }
        setShowMembers(false);
    };

    const handleStatusChange = async (newStatus) => {
        const token = localStorage.getItem('token');
        await fetch('/api/users/status', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        setUserStatus(newStatus);
        setShowStatusMenu(false);
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

    const getStatusEmoji = (status) => {
        switch (status) {
            case 'online': return '🟢';
            case 'away': return '🌙';
            case 'busy': return '⛔';
            case 'offline': return '⚪';
            default: return '🟢';
        }
    };

    const [userRole, setUserRole] = useState('member');

    return (
        <div className={`sidebar ${className}`}>
            <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                <button
                    onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        fontWeight: '600',
                        fontSize: '1rem',
                        flex: 1,
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0'
                    }}
                >
                    <span>{workspaceName || 'Workspace'}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>▼</span>
                </button>

                {userRole === 'admin' && (
                    <button
                        onClick={() => navigate(`/client/${workspaceId}/manage`)}
                        title="Gerenciar Membros"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            padding: '0.25rem'
                        }}
                    >
                        ⚙️
                    </button>
                )}

                {/* Workspace Dropdown */}
                {showWorkspaceMenu && (
                    <div className="workspace-dropdown">
                        <div className="dropdown-section-title">
                            Seus Workspaces
                        </div>
                        {allWorkspaces.map(ws => (
                            <button
                                key={ws.id}
                                onClick={() => {
                                    setShowWorkspaceMenu(false);
                                    navigate(`/client/${ws.id}`);
                                }}
                                className={`workspace-item ${ws.id == workspaceId ? 'active' : ''}`}
                            >
                                <div className="workspace-icon">
                                    {ws.name[0].toUpperCase()}
                                </div>
                                <div className="workspace-info">
                                    <div className="workspace-name">{ws.name}</div>
                                    <div className="workspace-role">
                                        {ws.role === 'admin' ? '👑 Admin' : '👤 Membro'}
                                    </div>
                                </div>
                            </button>
                        ))}
                        <div className="dropdown-divider" />
                        <button
                            onClick={() => {
                                setShowWorkspaceMenu(false);
                                navigate('/client');
                            }}
                            className="create-workspace-btn"
                        >
                            + Criar Novo Workspace
                        </button>
                    </div>
                )}
            </div>

            <div className="channel-list">
                {/* Channels Section */}
                <div style={{
                    padding: '0 0.5rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'var(--text-tertiary)',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    <span>Canais</span>
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        style={{
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            fontSize: '1.2rem',
                            padding: '0 4px',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        +
                    </button>
                </div>

                {showCreate && (
                    <form onSubmit={handleCreateChannel} style={{ padding: '0 0.5rem', marginBottom: '1rem' }}>
                        <input
                            value={newChannelName}
                            onChange={e => setNewChannelName(e.target.value)}
                            placeholder="# nome-do-canal"
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                background: 'var(--zorah-bg-subtle)',
                                border: '1px solid var(--zorah-border)',
                                color: 'white',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.875rem'
                            }}
                            autoFocus
                        />
                    </form>
                )}

                {channels.map(channel => (
                    <div
                        key={channel.id}
                        className={`channel-item ${currentChannelId == channel.id ? 'active' : ''}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            position: 'relative'
                        }}
                    >
                        <Link
                            to={`/client/${workspaceId}/${channel.id}`}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                textDecoration: 'none',
                                color: 'inherit'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '8px', opacity: 0.5 }}>#</span>
                                {channel.name}
                            </div>
                            {unreadCounts[channel.id] > 0 && currentChannelId != channel.id && (
                                <span style={{
                                    background: 'var(--zorah-primary)',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: '10px',
                                    fontWeight: '600',
                                    minWidth: '18px',
                                    textAlign: 'center'
                                }}>
                                    {unreadCounts[channel.id]}
                                </span>
                            )}
                        </Link>
                        {(userRole === 'admin' || userRole === 'moderator') && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedChannel(channel);
                                    setShowChannelSettings(true);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-secondary, #6b7280)',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    marginLeft: '8px',
                                    borderRadius: '4px',
                                    fontSize: '0.875rem',
                                    opacity: 0.7,
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                    e.currentTarget.style.background = 'var(--zorah-surface-hover, #f3f4f6)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '0.7';
                                    e.currentTarget.style.background = 'none';
                                }}
                                title="Configurações do canal"
                            >
                                ⚙️
                            </button>
                        )}
                    </div>
                ))}
                {/* Pending Join Requests (Admin Only) */}
                {userRole === 'admin' && pendingRequests.length > 0 && (
                    <div style={{ padding: '0 0.5rem', marginTop: '1.5rem' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            color: 'var(--zorah-accent)',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                            paddingBottom: '0.5rem'
                        }} onClick={() => setShowPendingRequests(!showPendingRequests)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>📬 Solicitações</span>
                                <span style={{
                                    background: 'var(--zorah-accent)',
                                    color: 'white',
                                    fontSize: '0.65rem',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '10px'
                                }}>
                                    {pendingRequests.length}
                                </span>
                            </div>
                            <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                                {showPendingRequests ? '▼' : '▶'}
                            </span>
                        </div>

                        {showPendingRequests && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {pendingRequests.map(req => (
                                    <div key={req.id} style={{
                                        background: 'var(--zorah-surface)',
                                        border: '1px solid var(--zorah-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '0.75rem'
                                    }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                            {req.name}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {req.email}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleApproveRequest(req.id)}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.4rem',
                                                    background: 'var(--success)',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    color: 'white',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ✔
                                            </button>
                                            <button
                                                onClick={() => handleRejectRequest(req.id)}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.4rem',
                                                    background: 'var(--error)',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    color: 'white',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ✖
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Direct Messages Section */}
                <div style={{
                    padding: '0 0.5rem',
                    margin: '1.5rem 0 0.75rem 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'var(--text-tertiary)',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    <span>Mensagens Diretas</span>
                    <button
                        onClick={() => setShowMembers(!showMembers)}
                        style={{
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            fontSize: '1.2rem',
                            padding: '0 4px',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        +
                    </button>
                </div>

                {showMembers && (
                    <div style={{
                        padding: '0.5rem',
                        background: 'var(--zorah-bg-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        margin: '0 0.5rem 1rem 0.5rem',
                        maxHeight: '200px',
                        overflowY: 'auto'
                    }}>
                        {members.map(member => (
                            <div
                                key={member.id}
                                onClick={() => handleStartDM(member.id)}
                                style={{
                                    padding: '0.5rem',
                                    cursor: 'pointer',
                                    borderRadius: 'var(--radius-sm)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--zorah-surface-hover)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{ position: 'relative' }}>
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--zorah-primary) 0%, var(--zorah-accent) 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: 'white'
                                    }}>
                                        {member.avatar_url ? (
                                            <img src={member.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                        ) : (
                                            member.name[0].toUpperCase()
                                        )}
                                    </div>
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-2px',
                                        right: '-2px',
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: getStatusColor(member.status),
                                        border: '2px solid var(--zorah-bg-subtle)'
                                    }} />
                                </div>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{member.name}</span>
                            </div>
                        ))}
                    </div>
                )}

                {dms.map(dm => (
                    <Link
                        key={dm.id}
                        to={`/client/${workspaceId}/dm/${dm.id}`}
                        className={`channel-item ${currentDmId == dm.id ? 'active' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--zorah-primary) 0%, var(--zorah-accent) 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: '600',
                                color: 'white'
                            }}>
                                {dm.other_user_avatar ? (
                                    <img src={dm.other_user_avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                ) : (
                                    dm.other_user_name[0].toUpperCase()
                                )}
                            </div>
                            <div style={{
                                position: 'absolute',
                                bottom: '-2px',
                                right: '-2px',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: getStatusColor(dm.other_user_status || 'offline'),
                                border: '2px solid var(--zorah-surface)'
                            }} />
                        </div>
                        <span style={{ flex: 1 }}>{dm.other_user_name}</span>
                        {unreadCounts[`dm-${dm.id}`] > 0 && (
                            <span style={{
                                background: 'var(--zorah-primary)',
                                color: 'white',
                                borderRadius: '10px',
                                padding: '2px 8px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                minWidth: '20px',
                                textAlign: 'center'
                            }}>
                                {unreadCounts[`dm-${dm.id}`]}
                            </span>
                        )}
                    </Link>
                ))}
            </div>

            {/* User Profile Footer */}
            <div style={{
                padding: '1rem',
                borderTop: '1px solid var(--zorah-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                position: 'relative'
            }}>
                <div style={{ position: 'relative' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--zorah-primary) 0%, var(--zorah-accent) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: 'white',
                        position: 'relative'
                    }}>
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                        ) : (
                            user?.name?.[0]?.toUpperCase()
                        )}
                        <div style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: getStatusColor(userStatus),
                            border: '2px solid var(--zorah-bg-subtle)'
                        }} />
                    </div>
                    <div
                        onClick={() => setShowStatusMenu(!showStatusMenu)}
                        style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            width: '14px',
                            height: '12px',
                            borderRadius: '50%',
                            background: getStatusColor(userStatus),
                            border: '3px solid #0d0d10',
                            cursor: 'pointer'
                        }}
                    />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {userStatus}
                    </div>
                </div>
                <button
                    onClick={() => navigate('/client')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '0.25rem'
                    }}
                >
                    ←
                </button>

                {/* Status Menu */}
                {showStatusMenu && (
                    <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '1rem',
                        background: 'var(--zorah-surface)',
                        border: '1px solid var(--zorah-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.5rem',
                        marginBottom: '0.5rem',
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 1000
                    }}>
                        {['online', 'away', 'busy', 'offline'].map(status => (
                            <div
                                key={status}
                                onClick={() => handleStatusChange(status)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    cursor: 'pointer',
                                    borderRadius: 'var(--radius-sm)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--zorah-surface-hover)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <span>{getStatusEmoji(status)}</span>
                                <span style={{ fontSize: '0.875rem', textTransform: 'capitalize' }}>{status}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Channel Settings Modal */}
            {showChannelSettings && selectedChannel && (
                <ChannelSettingsModal
                    channel={selectedChannel}
                    workspaceId={workspaceId}
                    onClose={() => {
                        setShowChannelSettings(false);
                        setSelectedChannel(null);
                    }}
                    onUpdate={(updatedChannel) => {
                        setChannels(prev => prev.map(c =>
                            c.id === updatedChannel.id ? updatedChannel : c
                        ));
                    }}
                />
            )}
        </div>
    );
}
