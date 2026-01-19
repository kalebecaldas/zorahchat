import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function WorkspaceManagement() {
    const { workspaceId } = useParams();
    const [workspace, setWorkspace] = useState(null);
    const [members, setMembers] = useState([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchWorkspace();
        fetchMembers();
    }, [workspaceId]);

    const fetchWorkspace = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/workspaces', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const workspaces = await res.json();
            const current = workspaces.find(w => w.id == workspaceId);
            setWorkspace(current);

            if (current?.role !== 'admin') {
                setError('Apenas administradores podem acessar esta página');
                setTimeout(() => navigate(`/client/${workspaceId}`), 2000);
            }
        }
    };

    const fetchMembers = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setMembers(data);
        } else {
            setError('Erro ao carregar membros');
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        const token = localStorage.getItem('token');
        const res = await fetch(`/api/workspaces/${workspaceId}/invite`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: inviteEmail })
        });

        if (res.ok) {
            setMessage('Usuário convidado com sucesso!');
            setInviteEmail('');
            fetchMembers();
        } else {
            const data = await res.json();
            setError(data.error || 'Erro ao convidar usuário');
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        const token = localStorage.getItem('token');

        let permissions = 'read,write';
        if (newRole === 'admin') permissions = 'read,write,delete,manage';
        else if (newRole === 'moderator') permissions = 'read,write,delete';

        const res = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: newRole, permissions })
        });

        if (res.ok) {
            setMessage('Permissões atualizadas!');
            fetchMembers();
        } else {
            const data = await res.json();
            setError(data.error || 'Erro ao atualizar permissões');
        }
    };

    const handleRemoveMember = async (userId, userName) => {
        if (!confirm(`Tem certeza que deseja remover ${userName}?`)) return;

        const token = localStorage.getItem('token');
        const res = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            setMessage('Membro removido com sucesso!');
            fetchMembers();
        } else {
            const data = await res.json();
            setError(data.error || 'Erro ao remover membro');
        }
    };

    const getRoleBadge = (role) => {
        const classes = {
            admin: 'badge badge-admin',
            moderator: 'badge badge-moderator',
            member: 'badge badge-member'
        };
        const labels = {
            admin: 'Admin',
            moderator: 'Moderador',
            member: 'Membro'
        };
        return (
            <span className={classes[role] || classes.member}>
                {role === 'admin' ? '👑 ' : ''}{labels[role] || 'Membro'}
            </span>
        );
    };

    return (
        <div className="page-container">
            <div className="page-content">
                <div className="page-header">
                    <button onClick={() => navigate(`/client/${workspaceId}`)} className="back-link">
                        ← Voltar ao Workspace
                    </button>
                    <h1 className="page-title">Gerenciar Membros</h1>
                    <p className="page-subtitle">{workspace?.name}</p>
                </div>

                {message && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#34d399',
                        fontSize: '0.9rem'
                    }}>
                        ✓ {message}
                    </div>
                )}

                {error && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#f87171',
                        fontSize: '0.9rem'
                    }}>
                        ⚠ {error}
                    </div>
                )}

                {/* Invite Section */}
                <div className="card-section">
                    <h3 className="card-title">Convidar Novo Membro</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                        Adicione novos membros ao seu time por email.
                    </p>
                    <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.75rem' }}>
                        <input
                            type="email"
                            className="form-input"
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            placeholder="email@exemplo.com"
                            required
                            style={{ flex: 1 }}
                        />
                        <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.6rem 1.25rem', marginTop: 0 }}>
                            Convidar
                        </button>
                    </form>
                </div>

                {/* Members List */}
                <div className="card-section">
                    <h3 className="card-title">
                        Membros ({members.length})
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {members.map(member => (
                            <div key={member.id} className="list-item">
                                <div className="list-item-content">
                                    <div className="list-item-avatar">
                                        {member.avatar_url ? (
                                            <img src={member.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                        ) : (
                                            member.name[0].toUpperCase()
                                        )}
                                    </div>
                                    <div className="list-item-info">
                                        <h4>{member.name} {workspace?.owner_id === member.id && <span className="badge badge-owner" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>OWNER</span>}</h4>
                                        <p>{member.email}</p>
                                    </div>
                                    {getRoleBadge(member.role)}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1.5rem' }}>
                                    {member.role !== 'admin' && workspace?.owner_id !== member.id && (
                                        <>
                                            <select
                                                value={member.role}
                                                onChange={e => handleRoleChange(member.id, e.target.value)}
                                                className="select-role"
                                            >
                                                <option value="member">Membro</option>
                                                <option value="moderator">Moderador</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <button
                                                onClick={() => handleRemoveMember(member.id, member.name)}
                                                className="btn-danger-ghost"
                                            >
                                                Remover
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
