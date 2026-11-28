import { useMemo, useState } from 'react';

function SecretCardSelector({
    cards = [],
    categoryLabel = 'Deck',
    selectedCardId = null,
    isLockedIn = false,
    opponentName = 'Opponent',
    onSelectCard,
    onConfirmSecretCard,
    onChangeSecretCard
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [stagedCardId, setStagedCardId] = useState(selectedCardId);

    const normalizedCards = useMemo(() => {
        if (!Array.isArray(cards)) return [];
        return cards.map((card, index) => {
            const isObj = typeof card === 'object' && card !== null;
            const id = isObj
                ? (card.id ?? card.Id ?? card.name ?? card.Name ?? index)
                : index;
            const name = isObj
                ? (card.name ?? card.Name ?? 'Unknown')
                : String(card);
            const imageUrl = isObj
                ? (card.imageUrl ?? card.ImageUrl ?? '')
                : '';

            return { id, name, imageUrl, key: id };
        });
    }, [cards]);

    const activeId = isLockedIn ? (selectedCardId ?? stagedCardId) : (stagedCardId ?? selectedCardId);

    const activeCard = useMemo(
        () => normalizedCards.find(card => String(card.id) === String(activeId)) || null,
        [normalizedCards, activeId]
    );

    const filteredCards = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return normalizedCards;
        return normalizedCards.filter(card => card.name.toLowerCase().includes(query));
    }, [normalizedCards, searchQuery]);

    const handleCardClick = (card) => {
        if (isLockedIn) return;
        setStagedCardId(card.id);
        if (typeof onSelectCard === 'function') {
            onSelectCard(card);
        }
    };

    const handleConfirmClick = () => {
        if (!activeCard || isLockedIn) return;
        if (typeof onConfirmSecretCard === 'function') {
            onConfirmSecretCard(activeCard);
        }
    };

    const handleUnlockClick = () => {
        if (typeof onChangeSecretCard === 'function') {
            onChangeSecretCard();
        }
    };

    if (isLockedIn && activeCard) {
        return (
            <section className="panel secret-picker secret-picker--locked" aria-live="polite">
                <div className="secret-picker__locked-banner">
                    <div>
                        <span className="secret-picker__badge secret-picker__badge--locked">
                            SECRET CARD LOCKED IN
                        </span>
                        <h2>Your Secret Card: {activeCard.name}</h2>
                        <p>
                            {opponentName} won&apos;t see this pick. Waiting for {opponentName} to finish choosing their secret card...
                        </p>
                    </div>

                    <article className="secret-card-tile secret-card-tile--selected secret-card-tile--featured" title={activeCard.name}>
                        <span className="secret-card-tile__tag">SECRET</span>
                        {activeCard.imageUrl ? (
                            <img
                                src={activeCard.imageUrl}
                                alt={activeCard.name}
                                className="secret-card-tile__img"
                                loading="lazy"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : (
                            <div className="secret-card-tile__placeholder" aria-hidden="true">?</div>
                        )}
                        <span className="secret-card-tile__name" title={activeCard.name}>
                            {activeCard.name}
                        </span>
                    </article>
                </div>

                {typeof onChangeSecretCard === 'function' && (
                    <div className="secret-picker__footer-actions">
                        <button
                            type="button"
                            className="reset-board-btn"
                            onClick={handleUnlockClick}
                        >
                            Change Secret Card
                        </button>
                    </div>
                )}
            </section>
        );
    }

    return (
        <section className="panel secret-picker" aria-live="polite">
            <div className="secret-picker__header">
                <div>
                    <span className="secret-picker__badge">CHOOSE YOUR SECRET CARD</span>
                    <h2>Pick who or what {opponentName} has to guess</h2>
                </div>

                <div className="secret-picker__toolbar">
                    <div className="secret-search">
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter cards by name..."
                            aria-label="Filter cards by name"
                            className="secret-search__input"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="secret-search__clear"
                                onClick={() => setSearchQuery('')}
                                aria-label="Clear search filter"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <span className="secret-picker__count">
                        {searchQuery
                            ? `${filteredCards.length} of ${normalizedCards.length}`
                            : `${normalizedCards.length} cards`}
                    </span>
                </div>
            </div>

            <div className="secret-picker__staged-bar">
                {activeCard ? (
                    <>
                        <div className="secret-picker__staged-info">
                            <span className="secret-picker__staged-dot" aria-hidden="true" />
                            <span>
                                Selected: <strong title={activeCard.name}>{activeCard.name}</strong> — ready to lock in?
                            </span>
                        </div>
                        <div className="secret-picker__staged-actions">
                            <button
                                type="button"
                                className="reset-board-btn"
                                onClick={() => setStagedCardId(null)}
                            >
                                Clear Selection
                            </button>
                            <button
                                type="button"
                                className="primary-button secret-picker__confirm-btn"
                                onClick={handleConfirmClick}
                            >
                                Lock In Secret Card
                            </button>
                        </div>
                    </>
                ) : (
                    <p className="secret-picker__staged-placeholder">
                        No card selected yet — click any card below to highlight it.
                    </p>
                )}
            </div>

            {filteredCards.length === 0 ? (
                <div className="secret-picker__empty">
                    <p>No cards match &ldquo;{searchQuery}&rdquo;.</p>
                    <button
                        type="button"
                        className="reset-board-btn"
                        onClick={() => setSearchQuery('')}
                    >
                        Show All {normalizedCards.length} Cards
                    </button>
                </div>
            ) : (
                <div className="secret-cards-grid" role="listbox" aria-label="Secret card choices">
                    {filteredCards.map((card) => {
                        const isSelected = activeCard && String(card.id) === String(activeCard.id);

                        return (
                            <button
                                key={card.key}
                                type="button"
                                role="option"
                                aria-selected={Boolean(isSelected)}
                                title={card.name}
                                onClick={() => handleCardClick(card)}
                                className={`secret-card-tile ${isSelected ? 'secret-card-tile--selected' : ''}`}
                            >
                                {isSelected && (
                                    <span className="secret-card-tile__tag">SELECTED</span>
                                )}
                                {card.imageUrl ? (
                                    <img
                                        src={card.imageUrl}
                                        alt={card.name}
                                        className="secret-card-tile__img"
                                        loading="lazy"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="secret-card-tile__placeholder" aria-hidden="true">
                                        ?
                                    </div>
                                )}
                                <span className="secret-card-tile__name" title={card.name}>
                                    {card.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default SecretCardSelector;