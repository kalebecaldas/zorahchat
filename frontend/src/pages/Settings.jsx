import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [formData, setFormData] = useState({
        name: user?.name || '',
        avatar_url: user?.avatar_url || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        const token = localStorage.getItem('token');
        const res = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: formData.name,
                avatar_url: formData.avatar_url
            })
        });

        if (res.ok) {
            setMessage('Perfil atualizado com sucesso!');
            setTimeout(() => window.location.reload(), 1500);
        } else {
            setError('Erro ao atualizar perfil');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        const token = localStorage.getItem('token');
        const res = await fetch('/api/auth/password', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            })
        });

        if (res.ok) {
            setMessage('Senha alterada com sucesso!');
            setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
        } else {
            const data = await res.json();
            setError(data.error || 'Erro ao alterar senha');
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--zorah-bg)', padding: '3rem 2rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ marginBottom: '3rem' }}>
                    <button
                        onClick={() => navigate('/client')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            marginBottom: '1rem'
                        }}
                    >
                        ← Voltar
                    </button>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Configurações</h1>
                </div>

                <div className="auth-tabs" style={{ marginBottom: '2rem' }}>
                    <div
                        className={`auth-tab ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Perfil
                    </div>
                    <div
                        className={`auth-tab ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        Segurança
                    </div>
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

                <div style={{
                    background: 'var(--zorah-surface)',
                    border: '1px solid var(--zorah-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '2rem'
                }}>
                    {activeTab === 'profile' && (
                        <form onSubmit={handleProfileUpdate}>
                            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                                <div style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--zorah-primary) 0%, var(--zorah-accent) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2.5rem',
                                    fontWeight: '600',
                                    color: 'white',
                                    margin: '0 auto 1rem'
                                }}>
                                    {formData.avatar_url ? (
                                        <img src={formData.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                    ) : (
                                        user?.name?.[0]?.toUpperCase()
                                    )}
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    {user?.email}
                                </p>
                            </div>

                            <div className="form-group">
                                <label>Nome</label>
                                <input
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>URL do Avatar (opcional)</label>
                                <input
                                    name="avatar_url"
                                    type="url"
                                    value={formData.avatar_url}
                                    onChange={handleChange}
                                    placeholder="https://exemplo.com/avatar.jpg"
                                />
                            </div>

                            <button type="submit" className="btn-primary">
                                Salvar Alterações
                            </button>
                        </form>
                    )}

                    {activeTab === 'security' && (
                        <form onSubmit={handlePasswordChange}>
                            <div className="form-group">
                                <label>Senha Atual</label>
                                <input
                                    name="currentPassword"
                                    type="password"
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    required
                                    autoComplete="current-password"
                                />
                            </div>

                            <div className="form-group">
                                <label>Nova Senha</label>
                                <input
                                    name="newPassword"
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    required
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="form-group">
                                <label>Confirmar Nova Senha</label>
                                <input
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    autoComplete="new-password"
                                />
                            </div>

                            <button type="submit" className="btn-primary">
                                Alterar Senha
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
