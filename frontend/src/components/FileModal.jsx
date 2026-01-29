import { useEffect } from 'react';
import './FileModal.css';

const FileModal = ({ file, onClose }) => {
    if (!file) return null;

    // Use API URL from environment or construct from window location
    // In Railway, VITE_API_URL points to the backend domain
    const apiUrl = import.meta.env.VITE_API_URL || 
                   `${window.location.protocol}//${window.location.hostname}:3001`;
    const fullUrl = file.attachment_url?.startsWith('http') 
        ? file.attachment_url 
        : `${apiUrl}${file.attachment_url}`;

    // Close on ESC key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const renderContent = () => {
        switch (file.attachment_type) {
            case 'image':
                return (
                    <img
                        src={fullUrl}
                        alt={file.attachment_name}
                        className="file-modal-content-image"
                        onClick={(e) => e.stopPropagation()}
                    />
                );
            case 'video':
                return (
                    <video
                        controls
                        autoPlay
                        className="file-modal-content-video"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <source src={fullUrl} />
                        Seu navegador não suporta vídeos HTML5.
                    </video>
                );
            case 'audio':
                return (
                    <div className="file-modal-content-audio">
                        <audio
                            controls
                            autoPlay
                            className="file-modal-audio-player"
                        >
                            <source src={fullUrl} />
                            Seu navegador não suporta áudio HTML5.
                        </audio>
                    </div>
                );
            case 'pdf':
            case 'application':
                // Check if it's actually a PDF by extension
                const ext = file.attachment_name?.split('.').pop()?.toLowerCase();
                if (ext === 'pdf') {
                    return (
                        <iframe
                            src={fullUrl}
                            title={file.attachment_name}
                            className="file-modal-content-pdf"
                            onClick={(e) => e.stopPropagation()}
                        />
                    );
                }
                // Fall through to default for other application types
            default:
                return (
                    <div className="file-modal-content-default">
                        <div className="file-modal-icon">📄</div>
                        <div className="file-modal-file-info">
                            <div className="file-modal-file-name">{file.attachment_name}</div>
                            <div className="file-modal-file-type">{file.attachment_type || 'Arquivo'}</div>
                        </div>
                        <a
                            href={fullUrl}
                            download={file.attachment_name}
                            className="file-modal-download-button"
                        >
                            ⬇️ Baixar Arquivo
                        </a>
                    </div>
                );
        }
    };

    return (
        <div className="file-modal-overlay" onClick={onClose}>
            <div className="file-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="file-modal-header">
                    <div className="file-modal-title">
                        {file.attachment_name}
                    </div>
                    <button
                        className="file-modal-close"
                        onClick={onClose}
                        aria-label="Fechar"
                    >
                        ×
                    </button>
                </div>
                <div className="file-modal-body">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default FileModal;

