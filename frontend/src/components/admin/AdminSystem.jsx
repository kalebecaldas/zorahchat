import { useState, useEffect } from 'react';

export default function AdminSystem() {
    const [systemInfo, setSystemInfo] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSystemInfo();
        fetchAuditLogs();
    }, []);

    const fetchSystemInfo = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/system', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSystemInfo(data);
            }
        } catch (err) {
            console.error('Error fetching system info:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditLogs = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/audit-logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAuditLogs(data);
            }
        } catch (err) {
            console.error('Error fetching audit logs:', err);
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatUptime = (seconds) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };

    if (loading) {
        return <div>Carregando informações do sistema...</div>;
    }

    return (
        <div>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Informações do Sistema</h1>
                <p className="admin-page-subtitle">Servidor e banco de dados</p>
            </div>

            {systemInfo && (
                <>
                    <div className="admin-cards">
                        <div className="admin-card">
                            <div className="admin-card-icon">🖥️</div>
                            <div className="admin-card-label">Sistema Operacional</div>
                            <div style={{ fontSize: '18px', fontWeight: 600, marginTop: '8px' }}>
                                {systemInfo.server.platform} {systemInfo.server.arch}
                            </div>
                        </div>

                        <div className="admin-card">
                            <div className="admin-card-icon">⏱️</div>
                            <div className="admin-card-label">Uptime do Servidor</div>
                            <div style={{ fontSize: '18px', fontWeight: 600, marginTop: '8px' }}>
                                {formatUptime(systemInfo.server.uptime)}
                            </div>
                        </div>

                        <div className="admin-card">
                            <div className="admin-card-icon">🧠</div>
                            <div className="admin-card-label">Memória Usada</div>
                            <div style={{ fontSize: '18px', fontWeight: 600, marginTop: '8px' }}>
                                {formatBytes(systemInfo.server.memory.used)} / {formatBytes(systemInfo.server.memory.total)}
                            </div>
                        </div>

                        <div className="admin-card">
                            <div className="admin-card-icon">💾</div>
                            <div className="admin-card-label">Banco de Dados</div>
                            <div style={{ fontSize: '18px', fontWeight: 600, marginTop: '8px' }}>
                                {systemInfo.database.type}
                            </div>
                            {systemInfo.database.size && (
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                                    {formatBytes(systemInfo.database.size)}
                                </div>
                            )}
                        </div>

                        <div className="admin-card">
                            <div className="admin-card-icon">🔧</div>
                            <div className="admin-card-label">Node.js</div>
                            <div style={{ fontSize: '18px', fontWeight: 600, marginTop: '8px' }}>
                                {systemInfo.server.nodeVersion}
                            </div>
                        </div>

                        <div className="admin-card">
                            <div className="admin-card-icon">⚙️</div>
                            <div className="admin-card-label">Ambiente</div>
                            <div style={{ fontSize: '18px', fontWeight: 600, marginTop: '8px' }}>
                                {systemInfo.environment.nodeEnv || 'development'}
                            </div>
                        </div>
                    </div>

                    <div className="admin-table" style={{ marginTop: '32px' }}>
                        <div className="admin-table-header">
                            <h3 className="admin-table-title">Logs de Auditoria</h3>
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                                Últimas {auditLogs.length} ações
                            </span>
                        </div>
                        <div className="admin-table-body" style={{ maxHeight: '400px' }}>
                            {auditLogs.length > 0 ? (
                                auditLogs.map(log => (
                                    <div key={log.id} className="admin-table-row">
                                        <div className="admin-table-cell">
                                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                                {log.action.replace(/_/g, ' ').toUpperCase()}
                                            </div>
                                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                                                {log.admin_name || 'Admin'} ({log.admin_email})
                                            </div>
                                        </div>
                                        <div className="admin-table-cell small">
                                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                                                {log.target_type} #{log.target_id}
                                            </div>
                                        </div>
                                        <div className="admin-table-cell small">
                                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                                {new Date(log.created_at).toLocaleString('pt-BR')}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                                    Nenhum log de auditoria ainda
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
