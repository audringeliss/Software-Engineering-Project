function CardGrid({ cards, eliminatedCards, onToggleCard, selectedCategory }) {
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
            <div className="board-heading">
                <div>
                    <p className="board-label">Current deck</p>
                    <h2>{selectedCategory}</h2>
                </div>
                <span className="card-count">{cards.length} cards</span>
            </div>
            <div className="card-grid">
                {cards.map((card, index) => {
                    const id = card.id || card.Id || index;
                    const name = card.name || card.Name || 'Unknown';
                    const attributes = card.attributes || card.Attributes || [];
                    const isFlipped = eliminatedCards.includes(id);
                    const cardType = selectedCategory.toLowerCase().includes('animal') ? 'Animal' : 'Person';

                    return (
                    <div
                        key={id}
                        onClick={() => onToggleCard(id)}
                        className={`card-container ${isFlipped ? 'card-container--flipped' : ''}`}
                        aria-label={`${name} card`}
                    >
                        <div className="guess-card">
                            <div className="guess-card__face guess-card__face--front">
                                <div className="card-badge">{cardType}</div>
                                <h3>{name}</h3>

                                <p className="card-section-label">Attributes</p>
                                <ul className="attribute-list">
                                    {Array.isArray(attributes) && attributes.map((attribute, attributeIndex) => (
                                        <li key={attributeIndex}>{String(attribute)}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="guess-card__face guess-card__face--back">
                                <span className="eliminated-icon" aria-hidden="true">✕</span>
                                <h3>Eliminated</h3>
                                <p>Click to flip back</p>
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
