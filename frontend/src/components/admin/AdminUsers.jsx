import { useState, useEffect } from 'react';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBanToggle = async (userId, currentlyBanned, userName) => {
        const action = currentlyBanned ? 'desbanir' : 'banir';
        const confirmMsg = `Tem certeza que deseja ${action} ${userName}?\n${currentlyBanned ? 'O usuário poderá acessar o sistema novamente.' : 'O usuário será desconectado imediatamente e não poderá fazer login.'}`;
        
        if (!confirm(confirmMsg)) return;

        const reason = prompt(`Motivo para ${action} este usuário?`);
        if (!reason) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/admin/users/${userId}/ban`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    banned: !currentlyBanned,
                    reason 
                })
            });

            if (res.ok) {
                fetchUsers();
                alert(`✅ Usuário ${action}ido com sucesso`);
            } else {
                const error = await res.json();
                alert(`❌ ${error.error || 'Erro ao atualizar usuário'}`);
            }
        } catch (err) {
            console.error('Error banning user:', err);
            alert('❌ Erro ao atualizar usuário');
        }
    };

    const filteredAndSortedUsers = users
        .filter(user => {
            const search = searchTerm.toLowerCase();
            return (
                user.name?.toLowerCase().includes(search) ||
                user.email?.toLowerCase().includes(search)
            );
        })
        .sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];
            
            if (sortBy === 'created_at') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            }
            
            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'online': return '#10b981';
            case 'away': return '#f59e0b';
            case 'busy': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Hoje';
        if (days === 1) return 'Ontem';
        if (days < 7) return `${days} dias atrás`;
        if (days < 30) return `${Math.floor(days / 7)} semanas atrás`;
        if (days < 365) return `${Math.floor(days / 30)} meses atrás`;
        return `${Math.floor(days / 365)} anos atrás`;
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '400px',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid rgba(102, 126, 234, 0.2)',
                    borderTopColor: '#667eea',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}/>
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>Carregando usuários...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Gerenciamento de Usuários</h1>
                    <p className="admin-page-subtitle">
                        {users.length} {users.length === 1 ? 'usuário registrado' : 'usuários registrados'}
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="admin-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '24px' }}>
                <div className="admin-card">
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                        {users.length}
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Total de Usuários</div>
                </div>

                <div className="admin-card">
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🟢</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', color: '#10b981' }}>
                        {users.filter(u => u.status === 'online').length}
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Online</div>
                </div>

                <div className="admin-card">
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🚫</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', color: '#ef4444' }}>
                        {users.filter(u => u.banned).length}
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Banidos</div>
                </div>

                <div className="admin-card">
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>💬</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                        {users.reduce((sum, u) => sum + (u.message_count || 0), 0)}
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Mensagens Totais</div>
                </div>
            </div>

            <div className="admin-table">
                <div className="admin-table-header">
                    <h3 className="admin-table-title">Todos os Usuários</h3>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                color: 'white',
                                fontSize: '13px',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="created_at">Data de Cadastro</option>
                            <option value="name">Nome</option>
                            <option value="message_count">Mensagens</option>
                            <option value="workspace_count">Workspaces</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                        <input
                            type="text"
                            className="admin-search"
                            placeholder="Buscar por nome ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '300px' }}
                        />
                    </div>
                </div>

                <div className="admin-table-body">
                    {filteredAndSortedUsers.length === 0 ? (
                        <div style={{
                            padding: '64px',
                            textAlign: 'center',
                            color: 'rgba(255,255,255,0.4)'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                            <h3 style={{ margin: '0 0 8px 0' }}>Nenhum usuário encontrado</h3>
                            <p style={{ margin: 0 }}>Tente ajustar os filtros de busca</p>
                        </div>
                    ) : (
                        filteredAndSortedUsers.map((user, index) => (
                            <div key={user.id} className="admin-table-row" style={{
                                animation: `fadeIn 0.3s ease ${index * 0.03}s both`,
                                opacity: user.banned ? 0.5 : 1
                            }}>
                                <div className="admin-table-cell" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    flex: 2
                                }}>
                                    <div style={{ position: 'relative' }}>
                                        {user.avatar_url ? (
                                            <img
                                                src={user.avatar_url}
                                                alt={user.name}
                                                style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    border: '2px solid rgba(255,255,255,0.1)'
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '18px',
                                                fontWeight: '600',
                                                color: 'white'
                                            }}>
                                                {getInitials(user.name)}
                                            </div>
                                        )}
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '0',
                                            right: '0',
                                            width: '14px',
                                            height: '14px',
                                            borderRadius: '50%',
                                            background: getStatusColor(user.status),
                                            border: '2px solid #1e1e30'
                                        }}/>
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{
                                            fontWeight: 600,
                                            marginBottom: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            {user.name}
                                            {user.banned && (
                                                <span style={{
                                                    padding: '2px 8px',
                                                    background: 'rgba(239, 68, 68, 0.2)',
                                                    color: '#ef4444',
                                                    fontSize: '11px',
                                                    borderRadius: '4px',
                                                    fontWeight: '600'
                                                }}>
                                                    BANIDO
                                                </span>
                                            )}
                                            {user.email === 'kalebe.caldas@hotmail.com' && (
                                                <span style={{
                                                    padding: '2px 8px',
                                                    background: 'rgba(251, 191, 36, 0.2)',
                                                    color: '#fbbf24',
                                                    fontSize: '11px',
                                                    borderRadius: '4px',
                                                    fontWeight: '600'
                                                }}>
                                                    👑 MASTER
                                                </span>
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: '13px',
                                            color: 'rgba(255,255,255,0.5)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {user.email}
                                        </div>
                                    </div>
                                </div>

                                <div className="admin-table-cell small" style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px'
                                }}>
                                    <span className={`admin-status-badge ${user.status || 'offline'}`}>
                                        {user.status === 'online' && '🟢'} 
                                        {user.status === 'away' && '🟡'} 
                                        {user.status === 'busy' && '🔴'} 
                                        {(!user.status || user.status === 'offline') && '⚪'} 
                                        {' '}
                                        {user.status || 'offline'}
                                    </span>
                                </div>

                                <div className="admin-table-cell small">
                                    <div style={{
                                        fontSize: '13px',
                                        color: 'rgba(255,255,255,0.7)',
                                        marginBottom: '4px'
                                    }}>
                                        🏢 {user.workspace_count || 0} workspaces
                                    </div>
                                    <div style={{
                                        fontSize: '13px',
                                        color: 'rgba(255,255,255,0.5)'
                                    }}>
                                        💬 {(user.message_count || 0).toLocaleString('pt-BR')} mensagens
                                    </div>
                                </div>

                                <div className="admin-table-cell small">
                                    <div style={{
                                        fontSize: '12px',
                                        color: 'rgba(255,255,255,0.5)',
                                        marginBottom: '4px'
                                    }}>
                                        📅 {formatDate(user.created_at)}
                                    </div>
                                    <div style={{
                                        fontSize: '11px',
                                        color: 'rgba(255,255,255,0.3)'
                                    }}>
                                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                    </div>
                                </div>

                                <div className="admin-table-cell actions">
                                    {user.email !== 'kalebe.caldas@hotmail.com' && (
                                        <button
                                            className={`admin-button ${user.banned ? 'secondary' : 'danger'}`}
                                            onClick={() => handleBanToggle(user.id, user.banned, user.name)}
                                            style={{
                                                padding: '10px 20px',
                                                fontSize: '13px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            {user.banned ? '✅ Desbanir' : '🚫 Banir'}
                                        </button>
                                    )}
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
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
