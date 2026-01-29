import { useState, useEffect } from 'react';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
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

    const handleBanToggle = async (userId, currentlyBanned) => {
        const action = currentlyBanned ? 'desbanir' : 'banir';
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
                alert(`Usuário ${action}ido com sucesso`);
            } else {
                const error = await res.json();
                alert(error.error || 'Erro ao atualizar usuário');
            }
        } catch (err) {
            console.error('Error banning user:', err);
            alert('Erro ao atualizar usuário');
        }
    };

    const filteredUsers = users.filter(user => {
        const search = searchTerm.toLowerCase();
        return (
            user.name?.toLowerCase().includes(search) ||
            user.email?.toLowerCase().includes(search)
        );
    });

    if (loading) {
        return <div>Carregando usuários...</div>;
    }

    return (
        <div>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Gerenciamento de Usuários</h1>
                <p className="admin-page-subtitle">
                    Total: {users.length} usuários
                </p>
            </div>

            <div className="admin-table">
                <div className="admin-table-header">
                    <h3 className="admin-table-title">Todos os Usuários</h3>
                    <input
                        type="text"
                        className="admin-search"
                        placeholder="Buscar usuários..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="admin-table-body">
                    {filteredUsers.map(user => (
                        <div key={user.id} className="admin-table-row">
                            <div className="admin-table-cell">
                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                    {user.name}
                                </div>
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                                    {user.email}
                                </div>
                            </div>
                            <div className="admin-table-cell small">
                                <span className={`admin-status-badge ${user.status || 'offline'}`}>
                                    {user.status || 'offline'}
                                </span>
                            </div>
                            <div className="admin-table-cell small">
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                                    {user.workspace_count} workspaces
                                </div>
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                                    {user.message_count} mensagens
                                </div>
                            </div>
                            <div className="admin-table-cell small">
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                            <div className="admin-table-cell actions">
                                <button
                                    className={`admin-button ${user.banned ? 'secondary' : 'danger'}`}
                                    onClick={() => handleBanToggle(user.id, user.banned)}
                                    style={{ padding: '8px 16px', fontSize: '13px' }}
                                >
                                    {user.banned ? 'Desbanir' : 'Banir'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
