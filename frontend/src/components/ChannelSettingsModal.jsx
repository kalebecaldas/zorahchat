import { useState, useEffect } from 'react';
import './ChannelSettingsModal.css';

const ChannelSettingsModal = ({ channel, workspaceId, onClose, onUpdate }) => {
    const [name, setName] = useState(channel?.name || '');
    const [description, setDescription] = useState(channel?.description || '');
    const [members, setMembers] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (channel) {
            setName(channel.name || '');
            setDescription(channel.description || '');
            fetchMembers();
        }
    }, [channel]);

    useEffect(() => {
        if (channel) {
            fetchAvailableUsers();
        }
    }, [channel, members]);

    const fetchMembers = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/channels/${channel.id}/members`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMembers(data);
            }
        } catch (err) {
            console.error('Error fetching members:', err);
        }
    };

    const fetchAvailableUsers = async () => {
        const token = localStorage.getItem('token');
        try {
            // Get all workspace members (using users endpoint which allows any member)
            const res = await fetch(`/api/users/${workspaceId}/members`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Filter out users already in channel
                const memberIds = members.map(m => m.id || m.user_id);
                const available = data.filter(u => {
                    const userId = u.id || u.user_id;
                    return !memberIds.includes(userId);
                });
                setAvailableUsers(available);
            }
        } catch (err) {
            console.error('Error fetching available users:', err);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/channels/${channel.id}/settings`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || null
                })
            });

            if (res.ok) {
                const updatedChannel = await res.json();
                if (onUpdate) onUpdate(updatedChannel);
                onClose();
            } else {
                const error = await res.json();
                alert(error.error || 'Erro ao salvar configurações');
            }
        } catch (err) {
            console.error('Error saving settings:', err);
            alert('Erro ao salvar configurações');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (userId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/channels/${channel.id}/members`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userIds: [userId] })
            });

            if (res.ok) {
                await fetchMembers();
                await fetchAvailableUsers();
            } else {
                const error = await res.json();
                alert(error.error || 'Erro ao adicionar membro');
            }
        } catch (err) {
            console.error('Error adding member:', err);
            alert('Erro ao adicionar membro');
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!confirm('Tem certeza que deseja remover este membro do canal?')) {
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/channels/${channel.id}/members/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                await fetchMembers();
                await fetchAvailableUsers();
            } else {
                const error = await res.json();
                alert(error.error || 'Erro ao remover membro');
            }
        } catch (err) {
            console.error('Error removing member:', err);
            alert('Erro ao remover membro');
        }
    };

    const filteredAvailableUsers = availableUsers.filter(user => {
        const userName = user.name || user.username || '';
        const userEmail = user.email || '';
        const search = searchTerm.toLowerCase();
        return userName.toLowerCase().includes(search) || userEmail.toLowerCase().includes(search);
    });

    if (!channel) return null;

    return (
        <div className="channel-settings-overlay" onClick={onClose}>
            <div className="channel-settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="channel-settings-header">
                    <h2>Configurações do Canal</h2>
                    <button className="channel-settings-close" onClick={onClose}>×</button>
                </div>

                <div className="channel-settings-body">
                    {/* Channel Name */}
                    <div className="channel-settings-section">
                        <label>Nome do Canal</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome do canal"
                            maxLength={50}
                        />
                    </div>

                    {/* Channel Description */}
                    <div className="channel-settings-section">
                        <label>Descrição</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descrição do canal (opcional)"
                            rows={3}
                            maxLength={200}
                        />
                    </div>

                    {/* Members List */}
                    <div className="channel-settings-section">
                        <label>Membros ({members.length})</label>
                        <div className="channel-members-list">
                            {members.map(member => (
                                <div key={member.user_id || member.id} className="channel-member-item">
                                    <div className="channel-member-info">
                                        <div className="channel-member-avatar">
                                            {member.avatar_url ? (
                                                <img src={member.avatar_url} alt="" />
                                            ) : (
                                                (member.name || member.user_name || '?')[0].toUpperCase()
                                            )}
                                        </div>
                                        <div className="channel-member-details">
                                            <div className="channel-member-name">
                                                {member.name || member.username || 'Usuário'}
                                            </div>
                                            {member.role && (
                                                <div className="channel-member-role">{member.role}</div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        className="channel-member-remove"
                                        onClick={() => handleRemoveMember(member.user_id || member.id)}
                                        title="Remover membro"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add Members */}
                    <div className="channel-settings-section">
                        <label>Adicionar Membros</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar usuários..."
                            className="channel-member-search"
                        />
                        <div className="channel-available-users">
                            {filteredAvailableUsers.length === 0 ? (
                                <div className="channel-empty-state">
                                    {searchTerm ? 'Nenhum usuário encontrado' : 'Todos os membros já estão no canal'}
                                </div>
                            ) : (
                                filteredAvailableUsers.map(user => (
                                    <div key={user.user_id || user.id} className="channel-available-user-item">
                                        <div className="channel-member-info">
                                            <div className="channel-member-avatar">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt="" />
                                                ) : (
                                                    (user.name || user.username || '?')[0].toUpperCase()
                                                )}
                                            </div>
                                            <div className="channel-member-details">
                                                <div className="channel-member-name">
                                                    {user.name || user.username || 'Usuário'}
                                                </div>
                                                {user.email && (
                                                    <div className="channel-member-email">{user.email}</div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            className="channel-member-add"
                                            onClick={() => handleAddMember(user.user_id || user.id)}
                                            title="Adicionar ao canal"
                                        >
                                            +
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="channel-settings-footer">
                    <button className="channel-settings-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        className="channel-settings-save"
                        onClick={handleSave}
                        disabled={loading || !name.trim()}
                    >
                        {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChannelSettingsModal;

