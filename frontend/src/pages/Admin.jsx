import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminUsers from '../components/admin/AdminUsers';
import AdminWorkspaces from '../components/admin/AdminWorkspaces';
import AdminSystem from '../components/admin/AdminSystem';
import '../styles/Admin.css';

export default function Admin() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const { user } = useAuth();
    const navigate = useNavigate();

    // Verify master access
    useEffect(() => {
        if (user && user.email !== 'kalebe.caldas@hotmail.com') {
            // Not master user, redirect to regular app
            navigate('/client');
        }
    }, [user, navigate]);

    if (!user || user.email !== 'kalebe.caldas@hotmail.com') {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: '#0a0a0a',
                color: 'white'
            }}>
                <div>Acesso negado</div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <aside className="admin-sidebar">
                <div className="admin-header">
                    <h1>Admin Panel</h1>
                    <p className="admin-user">{user.name}</p>
                </div>

                <nav className="admin-nav">
                    <button
                        className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        📊 Dashboard
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        👥 Usuários
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'workspaces' ? 'active' : ''}`}
                        onClick={() => setActiveTab('workspaces')}
                    >
                        🏢 Workspaces
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'system' ? 'active' : ''}`}
                        onClick={() => setActiveTab('system')}
                    >
                        ⚙️ Sistema
                    </button>
                </nav>

                <div className="admin-footer">
                    <button
                        className="admin-back-button"
                        onClick={() => navigate('/client')}
                    >
                        ← Voltar ao App
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                {activeTab === 'dashboard' && <AdminDashboard />}
                {activeTab === 'users' && <AdminUsers />}
                {activeTab === 'workspaces' && <AdminWorkspaces />}
                {activeTab === 'system' && <AdminSystem />}
            </main>
        </div>
    );
}
