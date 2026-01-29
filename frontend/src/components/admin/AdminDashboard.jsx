import { useState, useEffect } from 'react';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

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
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Carregando estatísticas...</div>;
    }

    if (!stats) {
        return <div>Erro ao carregar estatísticas</div>;
    }

    return (
        <div>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Dashboard</h1>
                <p className="admin-page-subtitle">Visão geral do sistema</p>
            </div>

            <div className="admin-cards">
                <div className="admin-card">
                    <div className="admin-card-icon">👥</div>
                    <div className="admin-card-value">{stats.totalUsers}</div>
                    <div className="admin-card-label">Usuários Totais</div>
                </div>

                <div className="admin-card">
                    <div className="admin-card-icon">🟢</div>
                    <div className="admin-card-value">{stats.onlineUsers}</div>
                    <div className="admin-card-label">Usuários Online</div>
                </div>

                <div className="admin-card">
                    <div className="admin-card-icon">🏢</div>
                    <div className="admin-card-value">{stats.totalWorkspaces}</div>
                    <div className="admin-card-label">Workspaces</div>
                </div>

                <div className="admin-card">
                    <div className="admin-card-icon">📝</div>
                    <div className="admin-card-value">{stats.totalChannels}</div>
                    <div className="admin-card-label">Canais</div>
                </div>

                <div className="admin-card">
                    <div className="admin-card-icon">💬</div>
                    <div className="admin-card-value">{stats.totalMessages}</div>
                    <div className="admin-card-label">Mensagens Totais</div>
                </div>

                <div className="admin-card">
                    <div className="admin-card-icon">📊</div>
                    <div className="admin-card-value">{stats.messages24h}</div>
                    <div className="admin-card-label">Mensagens (24h)</div>
                </div>

                <div className="admin-card">
                    <div className="admin-card-icon">📈</div>
                    <div className="admin-card-value">{stats.messages7d}</div>
                    <div className="admin-card-label">Mensagens (7 dias)</div>
                </div>
            </div>

            <div className="admin-table">
                <div className="admin-table-header">
                    <h3 className="admin-table-title">Usuários Online Agora</h3>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                        {stats.onlineUsers} online
                    </span>
                </div>
                <div className="admin-table-body" style={{ maxHeight: '300px' }}>
                    {stats.onlineUserIds && stats.onlineUserIds.length > 0 ? (
                        stats.onlineUserIds.map(userId => (
                            <div key={userId} className="admin-table-row">
                                <div className="admin-table-cell">
                                    User ID: {userId}
                                    <span className="admin-status-badge online" style={{ marginLeft: '12px' }}>
                                        Online
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                            Nenhum usuário online no momento
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
