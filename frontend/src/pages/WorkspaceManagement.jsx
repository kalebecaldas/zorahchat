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
        const styles = {
            admin: { bg: 'rgba(99, 102, 241, 0.2)', color: 'var(--zorah-accent)', text: '👑 Admin' },
            moderator: { bg: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', text: '⭐ Moderador' },
            member: { bg: 'var(--zorah-bg-subtle)', color: 'var(--text-secondary)', text: '👤 Membro' }
        };
        const style = styles[role] || styles.member;

        return (
            <span style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                background: style.bg,
                color: style.color,
                fontWeight: '500'
            }}>
                {style.text}
            </span>
        );
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--zorah-bg)', padding: '3rem 2rem' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ marginBottom: '3rem' }}>
                    <button
                        onClick={() => navigate(`/client/${workspaceId}`)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            marginBottom: '1rem'
                        }}
                    >
                        ← Voltar ao Workspace
                    </button>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                        Gerenciar Membros
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        {workspace?.name}
                    </p>
                </div>

                {message && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#6ee7b7'
                    }}>
                        {message}
                    </div>
                )}

                {error && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#fca5a5'
                    }}>
                        {error}
                    </div>
                )}

                {/* Invite Section */}
                <div style={{
                    background: 'var(--zorah-surface)',
                    border: '1px solid var(--zorah-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '2rem',
                    marginBottom: '2rem'
                }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Convidar Novo Membro</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                        Digite o email de um usuário cadastrado para convidá-lo ao workspace.
                    </p>
                    <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.75rem' }}>
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            placeholder="email@exemplo.com"
                            required
                            style={{
                                flex: 1,
                                padding: '0.75rem 1rem',
                                background: 'var(--zorah-bg)',
                                border: '1px solid var(--zorah-border)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-primary)'
                            }}
                        />
                        <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
                            Convidar
                        </button>
                    </form>
                </div>

                {/* Members List */}
                <div style={{
                    background: 'var(--zorah-surface)',
                    border: '1px solid var(--zorah-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '2rem'
                }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                        Membros ({members.length})
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {members.map(member => (
                            <div
                                key={member.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '1rem',
                                    background: 'var(--zorah-bg)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--zorah-border)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--zorah-primary) 0%, var(--zorah-accent) 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        color: 'white'
                                    }}>
                                        {member.avatar_url ? (
                                            <img src={member.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                        ) : (
                                            member.name[0].toUpperCase()
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{member.name}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>{member.email}</div>
                                    </div>
                                    {getRoleBadge(member.role)}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                                    {member.role !== 'admin' && workspace?.owner_id !== member.id && (
                                        <>
                                            <select
                                                value={member.role}
                                                onChange={e => handleRoleChange(member.id, e.target.value)}
                                                style={{
                                                    padding: '0.5rem',
                                                    background: 'var(--zorah-surface)',
                                                    border: '1px solid var(--zorah-border)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.875rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="member">Membro</option>
                                                <option value="moderator">Moderador</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <button
                                                onClick={() => handleRemoveMember(member.id, member.name)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    color: '#fca5a5',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '500',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                            >
                                                Remover
                                            </button>
                                        </>
                                    )}
                                    {workspace?.owner_id === member.id && (
                                        <span style={{
                                            padding: '0.5rem 1rem',
                                            fontSize: '0.875rem',
                                            color: 'var(--text-tertiary)'
                                        }}>
                                            Proprietário
                                        </span>
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
