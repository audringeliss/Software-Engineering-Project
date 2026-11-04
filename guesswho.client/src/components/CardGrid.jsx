function CardGrid({
    cards,
    eliminatedCards = [],
    onToggleCard,
    selectedCategory,
    selectionMode = false,
    selectedCardId,
    onSelectCard,
    canToggleCards = true,
}) {
    if (cards.length === 0) {
        return (
            <section className="empty-state">
                <h2>No cards available</h2>
                <p>No cards found for the "{selectedCategory}" category.</p>
            </section>
        );
    }

    return (
        <section className="card-board" aria-label="Card board">

            <div className="card-grid">
                {cards.map((card, index) => {
                    const id = card.id || card.Id || index;
                    const name = card.name || card.Name || 'Unknown';
                    const imageUrl = card.imageUrl || card.ImageUrl || '';
                    const isEliminated = eliminatedCards.includes(id);
                    const isSelected = selectionMode && selectedCardId === id;
                    const isInteractive = selectionMode || canToggleCards;
                    const handleClick = selectionMode
                        ? () => onSelectCard(id)
                        : () => {
                            if (canToggleCards) onToggleCard(id);
                        };

                    return (
                        <div
                            key={id}
                            onClick={isInteractive ? handleClick : undefined}
                            className={`card-container ${isEliminated ? 'is-eliminated' : ''} ${isSelected ? 'is-selected' : ''}`}
                            role={isInteractive ? 'button' : undefined}
                            tabIndex={isInteractive ? 0 : undefined}
                            onKeyDown={(e) => {
                                if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
                                    e.preventDefault();
                                    handleClick();
                                }
                            }}
                            aria-pressed={isInteractive ? (selectionMode ? isSelected : isEliminated) : undefined}
                            aria-label={!isInteractive
                                ? `${name} ${isEliminated ? 'Eliminated' : 'Active'}`
                                : selectionMode
                                    ? `${name} ${isSelected ? 'selected' : 'select as target'}`
                                    : `${name} ${isEliminated ? 'Eliminated' : 'Active'}`}
                        >
                            <div className="guess-card">
                                {/* Priekinė kortelės pusė */}
                                <div className="guess-card__face guess-card__face--front">
                                    {imageUrl && (
                                        <div className="card-image-container">
                                            <img src={imageUrl} alt={name} className="card-photo" />
                                        </div>
                                    )}
                                    <h3>{name}</h3>
                                </div>

                                {/* Galinė kortelės pusė (išbraukta) */}
                                <div className="guess-card__face guess-card__face--back">
                                    <div className="eliminated-overlay">
                                        <h3>Eliminated</h3>
                                        <span className="eliminated-icon" aria-hidden="true">✕</span>
                                        <span className="eliminated-card-name">{name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default CardGrid;