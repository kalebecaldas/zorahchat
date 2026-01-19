import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function WorkspaceSelect() {
    const [workspaces, setWorkspaces] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [message, setMessage] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [loading, setLoading] = useState(true);
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const menuRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchWorkspaces();
            fetchMyRequests();
        }

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [user]);

    const fetchWorkspaces = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch('/api/workspaces', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            // Simular delay para mostrar loading (remover em produção se desejar)
            await new Promise(resolve => setTimeout(resolve, 800));
            setWorkspaces(data);
        }
        setLoading(false);
    };

    const fetchMyRequests = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/workspaces/my-requests', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setMyRequests(data);
        }
    };

    const handleCreateWorkspace = async (e) => {
        e.preventDefault();
        setMessage('');

        const token = localStorage.getItem('token');
        const res = await fetch('/api/workspaces', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newWorkspace)
        });

        if (res.ok) {
            const workspace = await res.json();
            setMessage('Workspace criado com sucesso!');
            setShowCreate(false);
            setNewWorkspace({ name: '', description: '' });
            fetchWorkspaces();
            setTimeout(() => navigate(`/client/${workspace.id}`), 1000);
        } else {
            const data = await res.json();
            setMessage(data.error);
        }
    };

    const handleSearchWorkspace = async (e) => {
        e.preventDefault();
        setMessage('');

        const token = localStorage.getItem('token');
        const res = await fetch(`/api/workspaces/search?q=${encodeURIComponent(searchQuery)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            setSearchResults(data);
            if (data.length === 0) {
                setMessage('Nenhum workspace encontrado');
            }
        } else {
            setMessage('Erro ao buscar workspaces');
        }
    };

    const handleJoinWorkspace = async (workspaceId) => {
        setMessage('');
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/workspaces/${workspaceId}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            setMessage('Solicitação enviada! Aguarde aprovação do admin.');
            setSearchResults([]);
            setSearchQuery('');
            setShowSearch(false);
        } else {
            const data = await res.json();
            setMessage(data.error);
        }
    };

    // Estilos comuns
    const cardStyle = {
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s ease',
        overflow: 'hidden'
    };

    const inputStyle = {
        width: '100%',
        padding: '0.875rem 1rem',
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'border-color 0.2s'
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(circle at top right, #1e1b4b 0%, #0f172a 40%, #020617 100%)',
            padding: '4rem 2rem',
            color: '#f8fafc',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {/* Header Section */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'end',
                    marginBottom: '4rem',
                    paddingBottom: '2rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: '2.5rem',
                            fontWeight: '800',
                            marginBottom: '0.5rem',
                            letterSpacing: '-0.02em',
                            background: 'linear-gradient(to right, #fff, #94a3b8)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            Olá, {user?.name?.split(' ')[0]}
                        </h1>
                        <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '600px' }}>
                            Gerencie seus workspaces ou crie um novo para colaborar com sua equipe.
                        </p>
                    </div>

                    {/* User Profile & Menu */}
                    <div style={{ position: 'relative' }} ref={menuRef}>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '50px',
                                padding: '0.5rem 0.75rem 0.5rem 0.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            }}
                        >
                            <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: 'white',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}>
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                ) : (
                                    user?.name?.[0]?.toUpperCase()
                                )}
                            </div>
                            <span style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: '500', paddingRight: '0.5rem' }}>Minha Conta</span>
                        </button>

                        {showUserMenu && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 0.75rem)',
                                right: 0,
                                background: '#1e293b',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '0.5rem',
                                minWidth: '220px',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
                                zIndex: 1000,
                                transformOrigin: 'top right',
                                animation: 'fadeIn 0.2s ease'
                            }}>
                                <button
                                    onClick={() => {
                                        setShowUserMenu(false);
                                        navigate('/settings');
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        background: 'transparent',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#e2e8f0',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        fontSize: '0.95rem'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <span>⚙️</span> Configurações
                                </button>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />
                                <button
                                    onClick={() => {
                                        setShowUserMenu(false);
                                        logout();
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        background: 'transparent',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#f87171',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        fontSize: '0.95rem'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <span>🚪</span> Sair
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notifications */}
                {message && (
                    <div style={{
                        padding: '1rem 1.5rem',
                        background: message.includes('sucesso') || message.includes('Solicitação') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        borderLeft: `4px solid ${message.includes('sucesso') || message.includes('Solicitação') ? '#10b981' : '#ef4444'}`,
                        borderRadius: '4px',
                        marginBottom: '2rem',
                        color: message.includes('sucesso') || message.includes('Solicitação') ? '#34d399' : '#fca5a5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        animation: 'slideIn 0.3s ease'
                    }}>
                        <span style={{ fontSize: '1.2rem' }}>{message.includes('sucesso') || message.includes('Solicitação') ? '✅' : '⚠️'}</span>
                        {message}
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{ marginBottom: '3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => {
                            setShowCreate(!showCreate);
                            setShowSearch(false);
                        }}
                        style={{
                            padding: '0.875rem 1.75rem',
                            background: showCreate ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            color: 'white',
                            border: showCreate ? '1px solid rgba(255,255,255,0.2)' : 'none',
                            borderRadius: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: showCreate ? 'none' : '0 4px 6px -1px rgba(99, 102, 241, 0.4)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>{showCreate ? '×' : '+'}</span>
                        {showCreate ? 'Cancelar Criação' : 'Criar Novo Workspace'}
                    </button>

                    <button
                        onClick={() => {
                            setShowSearch(!showSearch);
                            setShowCreate(false);
                        }}
                        style={{
                            padding: '0.875rem 1.75rem',
                            background: showSearch ? 'rgba(255,255,255,0.1)' : 'rgba(30, 41, 59, 0.6)',
                            color: showSearch ? '#fff' : '#e2e8f0',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => {
                            if (!showSearch) e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
                        }}
                    >
                        <span>🔍</span>
                        {showSearch ? 'Fechar Busca' : 'Procurar Workspace'}
                    </button>
                </div>

                {/* Forms Section */}
                {(showCreate || showSearch) && (
                    <div style={{
                        ...cardStyle,
                        padding: '2.5rem',
                        maxWidth: '600px',
                        margin: '0 auto 4rem auto',
                        animation: 'fadeIn 0.3s ease'
                    }}>
                        {showCreate && (
                            <form onSubmit={handleCreateWorkspace}>
                                <h3 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: '700' }}>Criar Novo Workspace</h3>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>Nome do Workspace</label>
                                    <input
                                        value={newWorkspace.name}
                                        onChange={e => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                                        placeholder="Ex: Marketing Team"
                                        required
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = '#6366f1'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                                    />
                                </div>
                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>Descrição (opcional)</label>
                                    <input
                                        value={newWorkspace.description}
                                        onChange={e => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                                        placeholder="Para que serve este espaço?"
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = '#6366f1'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                                    />
                                </div>
                                <button type="submit" style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: '#6366f1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}>
                                    Criar Workspace
                                </button>
                            </form>
                        )}

                        {showSearch && (
                            <div>
                                <h3 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: '700' }}>Procurar Workspace</h3>
                                <form onSubmit={handleSearchWorkspace} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                                    <input
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Digite o nome ou código..."
                                        required
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = '#6366f1'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                                    />
                                    <button type="submit" style={{
                                        padding: '0 1.5rem',
                                        background: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}>Buscar</button>
                                </form>

                                {searchResults.length > 0 && (
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                                        <h4 style={{ marginBottom: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>Resultados</h4>
                                        {searchResults.map(ws => (
                                            <div key={ws.id} style={{
                                                padding: '1rem',
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '8px',
                                                marginBottom: '0.75rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '8px',
                                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: '700'
                                                    }}>{ws.name[0].toUpperCase()}</div>
                                                    <div>
                                                        <div style={{ fontWeight: '600' }}>{ws.name}</div>
                                                        {ws.description && <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{ws.description}</div>}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleJoinWorkspace(ws.id)}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        background: 'rgba(255,255,255,0.1)',
                                                        border: 'None',
                                                        borderRadius: '6px',
                                                        color: '#fff',
                                                        cursor: 'pointer',
                                                        fontSize: '0.85rem'
                                                    }}
                                                >Solicitar Acesso</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* My Requests Section */}
                {myRequests.length > 0 && (
                    <div style={{ marginBottom: '3rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                            Solicitações Pendentes
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                            {myRequests.map(req => (
                                <div key={req.id} style={{
                                    ...cardStyle,
                                    padding: '1rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderLeft: '4px solid #f59e0b'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '6px',
                                            background: 'rgba(255,255,255,0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '600'
                                        }}>{req.workspace_name[0].toUpperCase()}</div>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{req.workspace_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Aguardando aprovação</div>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '600' }}>PENDENTE</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Workspaces Grid */}
                <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                    Seus Workspaces
                </h3>

                <div style={{
                    display: 'grid',
                    gap: '1.5rem',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))'
                }}>
                    {loading ? (
                        // Skeleton Loading Cards
                        [1, 2, 3].map((i) => (
                            <div
                                key={`skeleton-${i}`}
                                style={{
                                    ...cardStyle,
                                    padding: '1.75rem',
                                    animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite`,
                                    opacity: 0.6
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'start',
                                    marginBottom: '1.5rem'
                                }}>
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '12px',
                                        background: 'rgba(99, 102, 241, 0.2)',
                                    }} />
                                    <div style={{
                                        width: '80px',
                                        height: '24px',
                                        borderRadius: '20px',
                                        background: 'rgba(148, 163, 184, 0.2)',
                                    }} />
                                </div>

                                <div style={{
                                    width: '70%',
                                    height: '24px',
                                    borderRadius: '4px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    marginBottom: '0.5rem'
                                }} />
                                <div style={{
                                    width: '100%',
                                    height: '16px',
                                    borderRadius: '4px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    marginBottom: '0.5rem'
                                }} />
                                <div style={{
                                    width: '85%',
                                    height: '16px',
                                    borderRadius: '4px',
                                    background: 'rgba(255, 255, 255, 0.05)'
                                }} />
                            </div>
                        ))
                    ) : workspaces.length === 0 && !showCreate && !showSearch ? (
                        <div style={{
                            gridColumn: '1 / -1',
                            ...cardStyle,
                            padding: '4rem',
                            textAlign: 'center',
                            borderStyle: 'dashed',
                            background: 'transparent'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🚀</div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Nenhum workspace ainda</h3>
                            <p style={{ color: '#94a3b8' }}>Comece criando um novo workspace ou procure por um existente.</p>
                        </div>
                    ) : (
                        workspaces.map((ws, index) => (
                            <div
                                key={ws.id}
                                onClick={() => navigate(`/client/${ws.id}`)}
                                style={{
                                    ...cardStyle,
                                    padding: '1.75rem',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    animation: `slideInUp 0.4s ease ${index * 0.1}s both`
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)';
                                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'start',
                                    marginBottom: '1.5rem'
                                }}>
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.75rem',
                                        fontWeight: '700',
                                        color: 'white',
                                        boxShadow: '0 4px 6px rgba(99, 102, 241, 0.25)'
                                    }}>
                                        {ws.name[0].toUpperCase()}
                                    </div>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '20px',
                                        background: ws.role === 'admin' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                                        color: ws.role === 'admin' ? '#818cf8' : '#94a3b8',
                                        fontWeight: '600',
                                        letterSpacing: '0.02em'
                                    }}>
                                        {ws.role === 'admin' ? '👑 ADMIN' : '👤 MEMBRO'}
                                    </span>
                                </div>

                                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: '700' }}>{ws.name}</h3>
                                <p style={{
                                    color: '#94a3b8',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.5',
                                    marginBottom: '0',
                                    display: '-webkit-box',
                                    WebkitLineClamp: '2',
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    {ws.description || "Sem descrição disponível."}
                                </p>

                                <div style={{
                                    marginTop: '1.5rem',
                                    paddingTop: '1rem',
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    fontSize: '0.85rem',
                                    color: '#64748b'
                                }}>
                                    <span>Clique para entrar</span>
                                    <span style={{ fontSize: '1.1rem' }}>→</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideInUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(30px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    );
}
