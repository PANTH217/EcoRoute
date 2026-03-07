import React, { useState, useEffect, useRef } from 'react';
import { generateHeroInsights, askLorriAI } from '../utils/aiAdvisor';

export default function ChatAdvisor({ fleet, history }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { type: 'ai', text: "Hello! I'm Lorri.AI, your eco-logistics brain. How can I help you optimize your fleet today?" }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [heroInsights, setHeroInsights] = useState([]);

    // Draggable State
    const [position, setPosition] = useState({ x: window.innerWidth - 400, y: window.innerHeight - 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const chatEndRef = useRef(null);

    useEffect(() => {
        setHeroInsights(generateHeroInsights(fleet, history));
    }, [fleet, history]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Handle Window Resize (Reset position if it goes off screen)
    useEffect(() => {
        const handleResize = () => {
            setPosition(prev => ({
                x: Math.min(prev.x, window.innerWidth - 60),
                y: Math.min(prev.y, window.innerHeight - 60)
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Drag Logic
    const onMouseDown = (e) => {
        if (e.target.closest('.close-chat') || e.target.closest('input') || e.target.closest('button')) return;
        setIsDragging(true);
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    useEffect(() => {
        const onMouseMove = (e) => {
            if (!isDragging) return;
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            });
        };

        const onMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging, dragOffset]);

    const handleSend = async (text) => {
        const query = text || inputValue;
        if (!query.trim()) return;

        const userMsg = { type: 'user', text: query };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            const response = await askLorriAI(query, { fleet, history });
            setMessages(prev => [...prev, { type: 'ai', text: response }]);
        } catch (err) {
            setMessages(prev => [...prev, { type: 'ai', text: "I'm experiencing a small data hiccup. Let me try analyzing those routes again." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div
            className={`chat-advisor-container ${isOpen ? 'expanded' : 'collapsed'} ${isDragging ? 'dragging' : ''}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                position: 'fixed'
            }}
        >
            {/* Floating Bubble */}
            {!isOpen && (
                <button
                    className="chat-bubble animate-bounce"
                    onClick={() => setIsOpen(true)}
                    onMouseDown={onMouseDown}
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                    <span className="bubble-icon">🤖</span>
                    <div className="bubble-badge">Lorri.AI</div>
                </button>
            )}

            {/* Expanded Chat Window */}
            {isOpen && (
                <div
                    className="chat-window glass animate-slide-in"
                    style={{ marginTop: '-420px', marginLeft: '-300px' }} // Anchor adjustment
                >
                    <div className="chat-header" onMouseDown={onMouseDown} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
                        <div className="chat-id">
                            <span className="ai-status"></span>
                            <h4>Lorri.AI Advisor</h4>
                        </div>
                        <button className="close-chat" onClick={() => setIsOpen(false)}>×</button>
                    </div>

                    <div className="chat-messages">
                        {messages.map((m, i) => (
                            <div key={i} className={`msg-bubble ${m.type}`}>
                                {m.text}
                            </div>
                        ))}
                        {isTyping && <div className="msg-bubble ai typing">Lorri is thinking...</div>}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Hero Insight Chips */}
                    <div className="hero-insight-scroll">
                        {heroInsights.map((insight, i) => (
                            <div
                                key={i}
                                className="insight-chip"
                                onClick={() => handleSend(insight.text)}
                            >
                                <span className="chip-icon">{insight.icon}</span>
                                <span className="chip-label">{insight.title}</span>
                            </div>
                        ))}
                    </div>

                    <div className="chat-input-area">
                        <input
                            type="text"
                            placeholder="Ask Lorri about savings, routes..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button className="send-btn" onClick={() => handleSend()}>🚀</button>
                    </div>
                </div>
            )}
        </div>
    );
}
