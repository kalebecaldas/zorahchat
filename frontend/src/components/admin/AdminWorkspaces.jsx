import { useState, useEffect } from 'react';

export default function AdminWorkspaces() {
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    const fetchWorkspaces = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/workspaces', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWorkspaces(data);
            }
        } catch (err) {
            console.error('Error fetching workspaces:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteWorkspace = async (workspaceId, workspaceName) => {
        const confirmText = `Tem certeza que deseja deletar o workspace "${workspaceName}"? Esta ação não pode ser desfeita!`;
        if (!confirm(confirmText)) return;

        const reason = prompt('Motivo para deletar este workspace?');
        if (!reason) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/admin/workspaces/${workspaceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            });

            if (res.ok) {
                fetchWorkspaces();
                alert('Workspace deletado com sucesso');
            } else {
                const error = await res.json();
                alert(error.error || 'Erro ao deletar workspace');
            }
        } catch (err) {
            console.error('Error deleting workspace:', err);
            alert('Erro ao deletar workspace');
        }
    };

    const filteredWorkspaces = workspaces.filter(ws => {
        const search = searchTerm.toLowerCase();
        return (
            ws.name?.toLowerCase().includes(search) ||
            ws.slug?.toLowerCase().includes(search) ||
            ws.owner_name?.toLowerCase().includes(search)
        );
    });

    if (loading) {
        return <div>Carregando workspaces...</div>;
    }

    return (
        <div>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Gerenciamento de Workspaces</h1>
                <p className="admin-page-subtitle">
                    Total: {workspaces.length} workspaces
                </p>
            </div>

            <div className="admin-table">
                <div className="admin-table-header">
                    <h3 className="admin-table-title">Todos os Workspaces</h3>
                    <input
                        type="text"
                        className="admin-search"
                        placeholder="Buscar workspaces..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="admin-table-body">
                    {filteredWorkspaces.map(ws => (
                        <div key={ws.id} className="admin-table-row">
                            <div className="admin-table-cell">
                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                    {ws.name}
                                </div>
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                                    /{ws.slug}
                                </div>
                            </div>
                            <div className="admin-table-cell small">
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                                    Owner: {ws.owner_name || 'N/A'}
                                </div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                    {ws.owner_email}
                                </div>
                            </div>
                            <div className="admin-table-cell small">
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                                    {ws.member_count} membros
                                </div>
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                                    {ws.channel_count} canais
                                </div>
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                                    {ws.message_count} mensagens
                                </div>
                            </div>
                            <div className="admin-table-cell small">
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                    {new Date(ws.created_at).toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                            <div className="admin-table-cell actions">
                                <button
                                    className="admin-button danger"
                                    onClick={() => handleDeleteWorkspace(ws.id, ws.name)}
                                    style={{ padding: '8px 16px', fontSize: '13px' }}
                                >
                                    Deletar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
