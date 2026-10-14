function CardGrid({ cards, eliminatedCards, onToggleCard, selectedCategory }) {
    if (cards.length === 0) {
        return (
            <section className="empty-state">
                <h2>No cards available</h2>
                <p>No cards found for the "{selectedCategory}" category.</p>
            </section>
        );
    }

    const remainingCount = cards.length - eliminatedCards.length;

    return (
        <section className="card-board" aria-label="Card board">
            <div className="board-heading">
                <div>
                    <p className="board-label">Current deck</p>
                    <h2 style={{ textTransform: 'capitalize' }}>{selectedCategory}</h2>
                </div>
                <div className="card-count-badge">
                    <span className="card-count">{remainingCount} / {cards.length} left</span>
                </div>
            </div>

            <div className="card-grid">
                {cards.map((card, index) => {
                    const id = card.id || card.Id || index;
                    const name = card.name || card.Name || 'Unknown';
                    const imageUrl = card.imageUrl || card.ImageUrl || '';
                    const isEliminated = eliminatedCards.includes(id);

                    return (
                        <div
                            key={id}
                            onClick={() => onToggleCard(id)}
                            className={`card-container ${isEliminated ? 'is-eliminated' : ''}`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    onToggleCard(id);
                                }
                            }}
                            aria-label={`${name} ${isEliminated ? 'Eliminated' : 'Active'}`}
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