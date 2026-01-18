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
        const token = localStorage.getItem('token');
        const res = await fetch('/api/workspaces', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setWorkspaces(data);
        }
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

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--zorah-bg)',
            padding: '3rem 2rem'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '3rem'
                }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                            Olá, {user?.name}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Selecione um workspace ou crie um novo
                        </p>
                    </div>

                    {/* User Menu */}
                    <div style={{ position: 'relative' }} ref={menuRef}>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                background: 'var(--zorah-surface)',
                                border: '1px solid var(--zorah-border)',
                                borderRadius: 'var(--radius-md)',
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--zorah-border-active)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--zorah-border)'}
                        >
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
                                color: 'white'
                            }}>
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                ) : (
                                    user?.name?.[0]?.toUpperCase()
                                )}
                            </div>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>▼</span>
                        </button>

                        {showUserMenu && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 0.5rem)',
                                right: 0,
                                background: 'var(--zorah-surface)',
                                border: '1px solid var(--zorah-border)',
                                borderRadius: 'var(--radius-md)',
                                padding: '0.5rem',
                                minWidth: '200px',
                                boxShadow: 'var(--shadow-lg)',
                                zIndex: 1000
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
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--text-primary)',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--zorah-surface-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    ⚙️ Configurações
                                </button>
                                <div style={{ height: '1px', background: 'var(--zorah-border)', margin: '0.5rem 0' }} />
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
                                        borderRadius: 'var(--radius-sm)',
                                        color: '#fca5a5',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    🚪 Sair
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {message && (
                    <div style={{
                        padding: '1rem',
                        background: message.includes('sucesso') || message.includes('Solicitação') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${message.includes('sucesso') || message.includes('Solicitação') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '2rem',
                        color: message.includes('sucesso') || message.includes('Solicitação') ? '#6ee7b7' : '#fca5a5'
                    }}>
                        {message}
                    </div>
                )}

                <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => {
                            setShowCreate(!showCreate);
                            setShowSearch(false);
                        }}
                        className="btn-primary"
                        style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
                    >
                        + Criar Novo Workspace
                    </button>

                    <button
                        onClick={() => {
                            setShowSearch(!showSearch);
                            setShowCreate(false);
                        }}
                        className="btn-secondary"
                        style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
                    >
                        🔍 Procurar Workspace
                    </button>
                </div>

                {showCreate && (
                    <div style={{
                        background: 'var(--zorah-surface)',
                        border: '1px solid var(--zorah-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '2rem',
                        marginBottom: '2rem'
                    }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Criar Novo Workspace</h3>
                        <form onSubmit={handleCreateWorkspace}>
                            <div className="form-group">
                                <label>Nome do Workspace</label>
                                <input
                                    value={newWorkspace.name}
                                    onChange={e => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                                    placeholder="Minha Equipe"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Descrição (opcional)</label>
                                <input
                                    value={newWorkspace.description}
                                    onChange={e => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                                    placeholder="Descrição do workspace"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="submit" className="btn-primary">Criar</button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="btn-secondary"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {showSearch && (
                    <div style={{
                        background: 'var(--zorah-surface)',
                        border: '1px solid var(--zorah-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '2rem',
                        marginBottom: '2rem'
                    }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Procurar Workspace</h3>
                        <form onSubmit={handleSearchWorkspace}>
                            <div className="form-group">
                                <label>Nome ou Código do Workspace</label>
                                <input
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Digite o nome ou código"
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="submit" className="btn-primary">Buscar</button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSearch(false);
                                        setSearchResults([]);
                                        setSearchQuery('');
                                    }}
                                    className="btn-secondary"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>

                        {searchResults.length > 0 && (
                            <div style={{ marginTop: '2rem' }}>
                                <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                                    Resultados da Busca
                                </h4>
                                {searchResults.map(ws => (
                                    <div
                                        key={ws.id}
                                        style={{
                                            padding: '1rem',
                                            background: 'var(--zorah-bg)',
                                            borderRadius: 'var(--radius-sm)',
                                            marginBottom: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: 'var(--radius-sm)',
                                                background: 'linear-gradient(135deg, var(--zorah-primary) 0%, var(--zorah-accent) 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.2rem',
                                                fontWeight: '700',
                                                color: 'white'
                                            }}>
                                                {ws.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600' }}>{ws.name}</div>
                                                {ws.description && (
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                                                        {ws.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleJoinWorkspace(ws.id)}
                                            className="btn-primary"
                                            style={{ width: 'auto', padding: '0.5rem 1.25rem' }}
                                        >
                                            Solicitar Acesso
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {myRequests.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--zorah-accent)' }}>
                            ⏳ Solicitações Pendentes
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {myRequests.map(req => (
                                <div key={req.id} style={{
                                    background: 'rgba(99, 102, 241, 0.05)',
                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '1rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: 'var(--radius-sm)',
                                            background: 'var(--zorah-surface)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1rem',
                                            fontWeight: '700',
                                            color: 'var(--zorah-primary)'
                                        }}>
                                            {req.workspace_name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{req.workspace_name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                                Aguardando aprovação do administrador
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--zorah-accent)', fontWeight: '600' }}>
                                        PENDENTE
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{
                    display: 'grid',
                    gap: '1rem',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
                }}>
                    {workspaces.length === 0 && !showCreate && !showSearch && (
                        <div style={{
                            gridColumn: '1 / -1',
                            textAlign: 'center',
                            padding: '4rem 2rem',
                            background: 'var(--zorah-surface)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px dashed var(--zorah-border)'
                        }}>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                Você ainda não está em nenhum workspace.
                            </p>
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                                Crie um novo workspace ou procure por um existente!
                            </p>
                        </div>
                    )}
                    {workspaces.map(ws => (
                        <div
                            key={ws.id}
                            onClick={() => navigate(`/client/${ws.id}`)}
                            style={{
                                background: 'var(--zorah-surface)',
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                border: '1px solid var(--zorah-border)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = 'var(--zorah-primary)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'var(--zorah-border)';
                                e.currentTarget.style.transform = 'none';
                            }}
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'linear-gradient(135deg, var(--zorah-primary) 0%, var(--zorah-accent) 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                color: 'white',
                                marginBottom: '1rem'
                            }}>
                                {ws.name[0].toUpperCase()}
                            </div>
                            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>{ws.name}</h3>
                            {ws.description && (
                                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                                    {ws.description}
                                </p>
                            )}
                            <span style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.6rem',
                                borderRadius: 'var(--radius-sm)',
                                background: ws.role === 'admin' ? 'rgba(99, 102, 241, 0.2)' : 'var(--zorah-bg-subtle)',
                                color: ws.role === 'admin' ? 'var(--zorah-accent)' : 'var(--text-secondary)',
                                fontWeight: '500'
                            }}>
                                {ws.role === 'admin' ? '👑 Admin' : '👤 Membro'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
