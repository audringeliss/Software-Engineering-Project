import React from 'react';

function GameStatus({ 
    selectedCategory, 
    isLoadingCards, 
    hasSelectedTarget, 
    bothTargetsSelected, 
    myRole, 
    currentTurnRole,
    onSelectCategory 
}) {
    // 1. If no category has been chosen yet, let either player pick one
    if (!selectedCategory) {
        return (
            <section className="status-message" style={{ textAlign: 'center', padding: '30px' }}>
                <div className="status-icon">✦</div>
                <h2>Choose a Game Category</h2>
                <p style={{ marginBottom: '20px', color: '#b0c4de' }}>
                    Select a deck category below to load the board for both players:
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button 
                        onClick={() => onSelectCategory('animals')} 
                        style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                    >
                        Animals
                    </button>
                    <button 
                        onClick={() => onSelectCategory('people')} 
                        style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                    >
                        People
                    </button>
                </div>
            </section>
        );
    }

    // 2. Loading state while cards are fetched
    if (isLoadingCards) {
        return (
            <section className="status-message status-message--loading">
                <div className="loading-spinner" aria-hidden="true" />
                <h2>Loading cards</h2>
                <p>Preparing the cards...</p>
            </section>
        );
    }

    // 3. Target selection phase (Player hasn't picked their secret target yet)
    if (!hasSelectedTarget) {
        return (
            <section className="status-message" style={{ borderColor: '#3b82f6' }}>
                <h2>Choose Your Secret Character</h2>
                <p>Click on any card on the board to select it as your target card for your opponent to guess, then click "Confirm & Start".</p>
            </section>
        );
    }

    // 4. Waiting for the opponent to finish selecting their target
    if (!bothTargetsSelected) {
        return (
            <section className="status-message">
                <h2>Character Selected!</h2>
                <p>Waiting for your opponent to select their secret target card...</p>
            </section>
        );
    }

    // 5. Active gameplay: Alternating turns
    const isMyTurn = myRole === currentTurnRole;

    return (
        <section className="status-message" style={{ borderColor: isMyTurn ? '#4ade80' : '#f59e0b' }}>
            <h2>{isMyTurn ? "Your Turn!" : "Opponent's Turn"}</h2>
            <p>
                {isMyTurn 
                    ? "Ask a question to narrow down your opponent's card, or flip cards on your board." 
                    : "Wait for your opponent to ask a question, or answer their pending question."}
            </p>
        </section>
    );
}

export default GameStatus;