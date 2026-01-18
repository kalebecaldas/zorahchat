import { useState, useEffect, useRef } from 'react';
import './MentionAutocomplete.css';

const MentionAutocomplete = ({ 
    query, 
    users, 
    onSelect, 
    onClose, 
    position,
    workspaceId,
    channelId
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const listRef = useRef(null);
    const itemsRef = useRef([]);

    // Add special options: @channel (notify everyone in channel)
    const specialOptions = [
        { 
            id: '@channel', 
            name: 'channel', 
            display: 'Notificar canal inteiro',
            type: 'channel',
            icon: '📢'
        },
        { 
            id: '@here', 
            name: 'here', 
            display: 'Notificar membros online',
            type: 'here',
            icon: '👥'
        }
    ];

    // Filter users based on query
    const filteredUsers = users.filter(user => {
        const userName = (user.name || user.username || '').toLowerCase();
        const userEmail = (user.email || '').toLowerCase();
        const searchQuery = query.toLowerCase();
        return userName.includes(searchQuery) || userEmail.includes(searchQuery);
    });

    const allOptions = [...specialOptions, ...filteredUsers.map(u => ({
        id: u.id || u.user_id,
        name: u.name || u.username,
        display: u.name || u.username,
        type: 'user',
        icon: '👤',
        avatar: u.avatar_url,
        email: u.email
    }))];

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle if this autocomplete is active
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex(prev => 
                    prev < allOptions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex(prev => 
                    prev > 0 ? prev - 1 : allOptions.length - 1
                );
            } else if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                if (allOptions[selectedIndex]) {
                    handleSelect(allOptions[selectedIndex]);
                }
            } else if (e.key === 'Tab' && allOptions.length > 0) {
                e.preventDefault();
                e.stopPropagation();
                if (allOptions[selectedIndex]) {
                    handleSelect(allOptions[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown, true); // Use capture phase
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [selectedIndex, allOptions, onClose]);

    // Scroll selected item into view
    useEffect(() => {
        if (itemsRef.current[selectedIndex] && listRef.current) {
            itemsRef.current[selectedIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [selectedIndex]);

    const handleSelect = (option) => {
        if (!option) return;
        
        if (option.type === 'channel' || option.type === 'here') {
            onSelect(option.name, option.type);
        } else {
            onSelect(option.name, 'user', option.id);
        }
        onClose();
    };

    if (allOptions.length === 0) {
        return null;
    }

    return (
        <div 
            className="mention-autocomplete"
            style={{
                position: 'absolute',
                bottom: '100%',
                left: position?.left || 0,
                bottom: position?.bottom || 'calc(100% + 8px)',
                zIndex: 1000,
                minWidth: '280px',
                maxWidth: '400px'
            }}
            ref={listRef}
        >
            <div className="mention-autocomplete-header">
                <span className="mention-autocomplete-title">Mencionar</span>
            </div>
            <div className="mention-autocomplete-list">
                {allOptions.map((option, index) => (
                    <div
                        key={option.id}
                        ref={el => itemsRef.current[index] = el}
                        className={`mention-autocomplete-item ${
                            index === selectedIndex ? 'selected' : ''
                        }`}
                        onClick={() => handleSelect(option)}
                        onMouseEnter={() => setSelectedIndex(index)}
                    >
                        <div className="mention-autocomplete-icon">
                            {option.avatar ? (
                                <img src={option.avatar} alt="" />
                            ) : (
                                <span>{option.icon}</span>
                            )}
                        </div>
                        <div className="mention-autocomplete-content">
                            <div className="mention-autocomplete-name">
                                @{option.display}
                            </div>
                            {option.email && (
                                <div className="mention-autocomplete-email">
                                    {option.email}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MentionAutocomplete;

