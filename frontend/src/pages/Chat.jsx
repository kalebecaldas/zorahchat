import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import NotificationContainer from '../components/NotificationContainer';

export default function Chat() {
    const { workspaceId, channelId, dmId } = useParams();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { socket } = useSocket();

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [channelId, dmId]);

    // Redirect to general if no channel/DM selected
    useEffect(() => {
        if (workspaceId && !channelId && !dmId) {
            const token = localStorage.getItem('token');
            fetch(`/api/channels/${workspaceId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(channels => {
                    const general = channels.find(c => c.name === 'general');
                    if (general) {
                        navigate(`/client/${workspaceId}/${general.id}`, { replace: true });
                    } else if (channels.length > 0) {
                        navigate(`/client/${workspaceId}/${channels[0].id}`, { replace: true });
                    }
                })
                .catch(err => console.error('Error fetching default channel:', err));
        }
    }, [workspaceId, channelId, dmId, navigate]);

    // Close mobile menu on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') setMobileMenuOpen(false);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    return (
        <>
            {/* Mobile Menu Toggle */}
            <button
                className="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
            >
                <span>{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>

            {/* Mobile Overlay */}
            <div
                className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
            />

            <div className="app-container">
                <Sidebar
                    workspaceId={workspaceId}
                    currentChannelId={channelId}
                    currentDmId={dmId}
                    className={mobileMenuOpen ? 'mobile-open' : ''}
                />
                <ChatWindow
                    workspaceId={workspaceId}
                    channelId={channelId}
                    dmId={dmId}
                />
            </div>
            <NotificationContainer 
                socket={socket} 
                currentChannelId={channelId}
                currentDmId={dmId}
            />
        </>
    );
}
