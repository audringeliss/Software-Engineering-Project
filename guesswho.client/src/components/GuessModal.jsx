import React, { useState } from 'react';

function GuessModal({ opponentCards, onGuessSubmit, onClose }) {
    const [selectedCard, setSelectedCard] = useState(null);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: '#141824',
                padding: '32px',
                borderRadius: '20px',
                border: '1px solid #333d52',
                width: '800px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)'
            }}>
                <h2 style={{ color: '#fff', marginBottom: '8px', fontSize: '20px', textAlign: 'center' }}>
                    Make Your Final Guess
                </h2>
                <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px', textAlign: 'center' }}>
                    Select the card you believe is your opponent's secret target. Choose wisely!
                </p>

                {/* Grid of remaining cards to choose from */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '14px',
                    overflowY: 'auto',
                    paddingRight: '4px',
                    marginBottom: '24px',
                    maxHeight: '45vh'
                }}>
                    {opponentCards.map((card) => {
                        const isSelected = selectedCard?.id === card.id || selectedCard?.name === card.name;
                        return (
                            <div
                                key={card.id || card.name}
                                onClick={() => setSelectedCard(card)}
                                style={{
                                    backgroundColor: '#1e2433',
                                    borderRadius: '12px',
                                    border: `2px solid ${isSelected ? '#3b82f6' : '#333d52'}`,
                                    padding: '10px',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    boxShadow: isSelected ? '0 0 12px rgba(59, 130, 246, 0.5)' : 'none',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <img
                                    src={card.imageUrl || card.image}
                                    alt={card.name}
                                    style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }}
                                />
                                <span style={{ color: '#fff', fontSize: '13px', fontWeight: '500' }}>
                                    {card.name}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: 'transparent',
                            border: '1px solid #333d52',
                            borderRadius: '8px',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!selectedCard}
                        onClick={() => onGuessSubmit(selectedCard)}
                        style={{
                            padding: '10px 24px',
                            backgroundColor: selectedCard ? '#2563eb' : '#1e293b',
                            border: 'none',
                            borderRadius: '8px',
                            color: selectedCard ? '#fff' : '#64748b',
                            cursor: selectedCard ? 'pointer' : 'not-allowed',
                            fontWeight: '600',
                            boxShadow: selectedCard ? '0 4px 12px rgba(37, 99, 235, 0.4)' : 'none'
                        }}
                    >
                        Confirm Guess
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GuessModal;