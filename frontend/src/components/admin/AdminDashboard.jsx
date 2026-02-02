import { useState, useEffect } from 'react';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
        // Refresh stats every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
                setError(null);
            } else {
                throw new Error('Falha ao carregar estatísticas');
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
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
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>Carregando estatísticas...</p>
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
                <h3 style={{ margin: '0 0 8px 0', color: '#ef4444' }}>Erro ao Carregar</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>{error}</p>
                <button
                    onClick={fetchStats}
                    style={{
                        marginTop: '16px',
                        padding: '8px 16px',
                        background: '#667eea',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    if (!stats) {
        return <div>Nenhum dado disponível</div>;
    }

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Dashboard</h1>
                    <p className="admin-page-subtitle">Visão geral do sistema em tempo real</p>
                </div>
                <button
                    onClick={fetchStats}
                    style={{
                        padding: '10px 20px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'rgba(255,255,255,0.7)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.5)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                >
                    🔄 Atualizar
                </button>
            </div>

            {/* Main Stats Cards */}
            <div className="admin-cards">
                <div className="admin-card" style={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                    <div className="admin-card-icon">👥</div>
                    <div className="admin-card-value">{stats.totalUsers.toLocaleString('pt-BR')}</div>
                    <div className="admin-card-label">Usuários Totais</div>
                    {stats.onlineUsers > 0 && (
                        <div style={{
                            marginTop: '12px',
                            padding: '6px 12px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            borderRadius: '20px',
                            fontSize: '13px',
                            color: '#10b981',
                            display: 'inline-block'
                        }}>
                            🟢 {stats.onlineUsers} online agora
                        </div>
                    )}
                </div>

                <div className="admin-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                    <div className="admin-card-icon">🟢</div>
                    <div className="admin-card-value" style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        {stats.onlineUsers.toLocaleString('pt-BR')}
                    </div>
                    <div className="admin-card-label">Usuários Online</div>
                    <div style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.5)'
                    }}>
                        {stats.totalUsers > 0 ? Math.round((stats.onlineUsers / stats.totalUsers) * 100) : 0}% do total
                    </div>
                </div>

                <div className="admin-card" style={{ borderColor: 'rgba(168, 85, 247, 0.3)' }}>
                    <div className="admin-card-icon">🏢</div>
                    <div className="admin-card-value">{stats.totalWorkspaces.toLocaleString('pt-BR')}</div>
                    <div className="admin-card-label">Workspaces</div>
                    <div style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.5)'
                    }}>
                        {stats.totalChannels} canais no total
                    </div>
                </div>

                <div className="admin-card" style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                    <div className="admin-card-icon">📺</div>
                    <div className="admin-card-value">{stats.totalChannels.toLocaleString('pt-BR')}</div>
                    <div className="admin-card-label">Canais Ativos</div>
                    <div style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.5)'
                    }}>
                        ~{Math.round(stats.totalChannels / (stats.totalWorkspaces || 1))} por workspace
                    </div>
                </div>
            </div>

            {/* Message Statistics */}
            <div style={{ marginTop: '32px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '16px', fontWeight: '600' }}>
                    📊 Estatísticas de Mensagens
                </h2>
                <div className="admin-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div className="admin-card">
                        <div className="admin-card-icon">💬</div>
                        <div className="admin-card-value">{stats.totalMessages.toLocaleString('pt-BR')}</div>
                        <div className="admin-card-label">Total de Mensagens</div>
                    </div>

                    <div className="admin-card">
                        <div className="admin-card-icon">📊</div>
                        <div className="admin-card-value" style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            {stats.messages24h.toLocaleString('pt-BR')}
                        </div>
                        <div className="admin-card-label">Últimas 24 horas</div>
                    </div>

                    <div className="admin-card">
                        <div className="admin-card-icon">📈</div>
                        <div className="admin-card-value" style={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            {stats.messages7d.toLocaleString('pt-BR')}
                        </div>
                        <div className="admin-card-label">Últimos 7 dias</div>
                    </div>

                    <div className="admin-card">
                        <div className="admin-card-icon">📉</div>
                        <div className="admin-card-value" style={{ fontSize: '28px' }}>
                            {stats.totalMessages > 0 ? Math.round((stats.messages24h / stats.totalMessages) * 100) : 0}%
                        </div>
                        <div className="admin-card-label">% do Total (24h)</div>
                    </div>
                </div>
            </div>

            {/* Online Users Table */}
            <div style={{ marginTop: '32px' }}>
                <div className="admin-table">
                    <div className="admin-table-header">
                        <div>
                            <h3 className="admin-table-title">Usuários Online Agora</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                                Atualizado automaticamente a cada 30 segundos
                            </p>
                        </div>
                        <div style={{
                            padding: '8px 16px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#10b981',
                                animation: 'pulse 2s infinite'
                            }}/>
                            {stats.onlineUsers} Online
                        </div>
                    </div>
                    <div className="admin-table-body" style={{ maxHeight: '400px' }}>
                        {stats.onlineUserIds && stats.onlineUserIds.length > 0 ? (
                            stats.onlineUserIds.map((userId, index) => (
                                <div key={userId} className="admin-table-row" style={{
                                    animation: `fadeIn 0.3s ease ${index * 0.05}s both`
                                }}>
                                    <div className="admin-table-cell" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '16px',
                                            fontWeight: '600'
                                        }}>
                                            {userId}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                                                User ID: {userId}
                                            </div>
                                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                                                Conectado via Socket.IO
                                            </div>
                                        </div>
                                    </div>
                                    <div className="admin-table-cell small">
                                        <span className="admin-status-badge online">
                                            Online
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{
                                padding: '64px',
                                textAlign: 'center',
                                color: 'rgba(255,255,255,0.4)'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>😴</div>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'rgba(255,255,255,0.6)' }}>
                                    Nenhum usuário online
                                </h3>
                                <p style={{ margin: 0, fontSize: '14px' }}>
                                    Os usuários aparecerão aqui quando se conectarem
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .admin-page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: start;
                }
            `}</style>
        </div>
    );
}
