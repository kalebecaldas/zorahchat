import { useState, useEffect } from 'react';

export default function AdminWorkspaces() {
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [expandedWorkspace, setExpandedWorkspace] = useState(null);

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    const fetchWorkspaces = async () => {
        setLoading(true);
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
        const confirmText = `⚠️ ATENÇÃO: Você está prestes a deletar o workspace "${workspaceName}"!\n\nEsta ação irá deletar:\n- Todos os canais\n- Todas as mensagens\n- Todos os arquivos\n- Todas as configurações\n\nEsta ação NÃO PODE ser desfeita!\n\nTem CERTEZA ABSOLUTA?`;
        
        if (!confirm(confirmText)) return;

        const doubleConfirm = prompt(`Para confirmar, digite o nome do workspace: "${workspaceName}"`);
        if (doubleConfirm !== workspaceName) {
            alert('❌ Nome não coincide. Operação cancelada.');
            return;
        }

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
                alert('✅ Workspace deletado com sucesso');
            } else {
                const error = await res.json();
                alert(`❌ ${error.error || 'Erro ao deletar workspace'}`);
            }
        } catch (err) {
            console.error('Error deleting workspace:', err);
            alert('❌ Erro ao deletar workspace');
        }
    };

    const filteredAndSortedWorkspaces = workspaces
        .filter(ws => {
            const search = searchTerm.toLowerCase();
            return (
                ws.name?.toLowerCase().includes(search) ||
                ws.slug?.toLowerCase().includes(search) ||
                ws.owner_name?.toLowerCase().includes(search) ||
                ws.owner_email?.toLowerCase().includes(search)
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

    const getTotalMembers = () => workspaces.reduce((sum, ws) => sum + (ws.member_count || 0), 0);
    const getTotalChannels = () => workspaces.reduce((sum, ws) => sum + (ws.channel_count || 0), 0);
    const getTotalMessages = () => workspaces.reduce((sum, ws) => sum + (ws.message_count || 0), 0);

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
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>Carregando workspaces...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Gerenciamento de Workspaces</h1>
                    <p className="admin-page-subtitle">
                        {workspaces.length} {workspaces.length === 1 ? 'workspace criado' : 'workspaces criados'}
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="admin-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '24px' }}>
                <div className="admin-card">
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏢</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                        {workspaces.length}
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Total de Workspaces</div>
                </div>

                <div className="admin-card">
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', color: '#667eea' }}>
                        {getTotalMembers()}
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Total de Membros</div>
                </div>

                <div className="admin-card">
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📺</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', color: '#8b5cf6' }}>
                        {getTotalChannels()}
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Total de Canais</div>
                </div>

                <div className="admin-card">
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>💬</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', color: '#3b82f6' }}>
                        {getTotalMessages().toLocaleString('pt-BR')}
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Total de Mensagens</div>
                </div>
            </div>

            <div className="admin-table">
                <div className="admin-table-header">
                    <h3 className="admin-table-title">Todos os Workspaces</h3>
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
                            <option value="created_at">Data de Criação</option>
                            <option value="name">Nome</option>
                            <option value="member_count">Membros</option>
                            <option value="message_count">Mensagens</option>
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
                            placeholder="Buscar workspaces..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '300px' }}
                        />
                    </div>
                </div>

                <div className="admin-table-body">
                    {filteredAndSortedWorkspaces.length === 0 ? (
                        <div style={{
                            padding: '64px',
                            textAlign: 'center',
                            color: 'rgba(255,255,255,0.4)'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                            <h3 style={{ margin: '0 0 8px 0' }}>Nenhum workspace encontrado</h3>
                            <p style={{ margin: 0 }}>Tente ajustar os filtros de busca</p>
                        </div>
                    ) : (
                        filteredAndSortedWorkspaces.map((ws, index) => (
                            <div key={ws.id}>
                                <div 
                                    className="admin-table-row"
                                    style={{
                                        animation: `fadeIn 0.3s ease ${index * 0.03}s both`,
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setExpandedWorkspace(expandedWorkspace === ws.id ? null : ws.id)}
                                >
                                    <div className="admin-table-cell" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        flex: 2
                                    }}>
                                        <div style={{
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '24px',
                                            fontWeight: '700',
                                            color: 'white',
                                            flexShrink: 0
                                        }}>
                                            {ws.name[0].toUpperCase()}
                                        </div>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{
                                                fontWeight: 600,
                                                marginBottom: '4px',
                                                fontSize: '16px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {ws.name}
                                            </div>
                                            <div style={{
                                                fontSize: '13px',
                                                color: 'rgba(255,255,255,0.5)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                /{ws.slug}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="admin-table-cell small">
                                        <div style={{
                                            fontSize: '13px',
                                            color: 'rgba(255,255,255,0.7)',
                                            marginBottom: '4px',
                                            fontWeight: '500'
                                        }}>
                                            {ws.owner_name || 'Sem owner'}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: 'rgba(255,255,255,0.4)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {ws.owner_email}
                                        </div>
                                    </div>

                                    <div className="admin-table-cell small">
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(3, 1fr)',
                                            gap: '8px'
                                        }}>
                                            <div style={{
                                                padding: '6px 8px',
                                                background: 'rgba(102, 126, 234, 0.1)',
                                                borderRadius: '6px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{
                                                    fontSize: '16px',
                                                    fontWeight: '700',
                                                    color: '#667eea',
                                                    marginBottom: '2px'
                                                }}>
                                                    {ws.member_count || 0}
                                                </div>
                                                <div style={{
                                                    fontSize: '10px',
                                                    color: 'rgba(255,255,255,0.5)'
                                                }}>
                                                    👥
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: '6px 8px',
                                                background: 'rgba(139, 92, 246, 0.1)',
                                                borderRadius: '6px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{
                                                    fontSize: '16px',
                                                    fontWeight: '700',
                                                    color: '#8b5cf6',
                                                    marginBottom: '2px'
                                                }}>
                                                    {ws.channel_count || 0}
                                                </div>
                                                <div style={{
                                                    fontSize: '10px',
                                                    color: 'rgba(255,255,255,0.5)'
                                                }}>
                                                    📺
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: '6px 8px',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                borderRadius: '6px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{
                                                    fontSize: '16px',
                                                    fontWeight: '700',
                                                    color: '#3b82f6',
                                                    marginBottom: '2px'
                                                }}>
                                                    {ws.message_count > 999 ? `${Math.floor(ws.message_count / 1000)}k` : ws.message_count || 0}
                                                </div>
                                                <div style={{
                                                    fontSize: '10px',
                                                    color: 'rgba(255,255,255,0.5)'
                                                }}>
                                                    💬
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="admin-table-cell small">
                                        <div style={{
                                            fontSize: '12px',
                                            color: 'rgba(255,255,255,0.5)',
                                            marginBottom: '4px'
                                        }}>
                                            📅 {formatDate(ws.created_at)}
                                        </div>
                                        <div style={{
                                            fontSize: '11px',
                                            color: 'rgba(255,255,255,0.3)'
                                        }}>
                                            {new Date(ws.created_at).toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>

                                    <div className="admin-table-cell actions">
                                        <button
                                            className="admin-button danger"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteWorkspace(ws.id, ws.name);
                                            }}
                                            style={{
                                                padding: '10px 20px',
                                                fontSize: '13px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            🗑️ Deletar
                                        </button>
                                        <button
                                            style={{
                                                padding: '10px',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedWorkspace(expandedWorkspace === ws.id ? null : ws.id);
                                            }}
                                        >
                                            {expandedWorkspace === ws.id ? '▲' : '▼'}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedWorkspace === ws.id && (
                                    <div style={{
                                        padding: '24px',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                        animation: 'expandDown 0.3s ease'
                                    }}>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                            gap: '16px'
                                        }}>
                                            <div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: 'rgba(255,255,255,0.5)',
                                                    marginBottom: '8px',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    Descrição
                                                </div>
                                                <div style={{
                                                    fontSize: '14px',
                                                    color: 'rgba(255,255,255,0.8)',
                                                    lineHeight: '1.5'
                                                }}>
                                                    {ws.description || 'Sem descrição'}
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: 'rgba(255,255,255,0.5)',
                                                    marginBottom: '8px',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    Estatísticas
                                                </div>
                                                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                                                    <div style={{ marginBottom: '4px' }}>
                                                        📊 Média: {ws.member_count > 0 ? Math.round(ws.message_count / ws.member_count) : 0} msgs/membro
                                                    </div>
                                                    <div style={{ marginBottom: '4px' }}>
                                                        📈 {ws.channel_count > 0 ? Math.round(ws.message_count / ws.channel_count) : 0} msgs/canal
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: 'rgba(255,255,255,0.5)',
                                                    marginBottom: '8px',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    Ações
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    <button
                                                        style={{
                                                            padding: '8px 16px',
                                                            background: 'rgba(102, 126, 234, 0.2)',
                                                            border: '1px solid rgba(102, 126, 234, 0.4)',
                                                            borderRadius: '6px',
                                                            color: '#667eea',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: '500'
                                                        }}
                                                        onClick={() => window.open(`/client/${ws.id}`, '_blank')}
                                                    >
                                                        🔗 Abrir Workspace
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                @keyframes expandDown {
                    from { opacity: 0; max-height: 0; }
                    to { opacity: 1; max-height: 500px; }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
