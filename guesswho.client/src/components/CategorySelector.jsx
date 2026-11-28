import { useEffect, useState } from 'react';

function formatCategoryLabel(raw) {
    const str = String(raw || '').trim();
    if (!str) return '';
    return str
        .split(/([-_\s]+)/)
        .map(part => (/^[-_\s]+$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
        .join('');
}

function CategorySelector({
    categories,
    proposedCategory,
    proposedCategoryByRole,
    myRole,
    creatorName = 'Room Creator',
    joinerName = 'Opponent',
    onProposeCategory,
    onRespondCategory,
    onCancelProposal
}) {
    const [previewCategory, setPreviewCategory] = useState('');
    const [previewResult, setPreviewResult] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const categoryOptions = categories.map((category, index) => {
        const isObj = typeof category === 'object' && category !== null;
        const value = isObj
            ? (category.id ?? category.Id ?? category.name ?? category.Name ?? '')
            : String(category);
        const rawLabel = isObj
            ? (category.name ?? category.Name ?? value)
            : String(category);
        const label = formatCategoryLabel(rawLabel);
        const rawCount = isObj
            ? (category.cardCount ?? category.CardCount ?? category.count ?? category.Count)
            : undefined;
        const cardCount = typeof rawCount === 'number' ? rawCount : null;
        const thumbnailUrl = isObj
            ? (category.previewImageUrl ?? category.PreviewImageUrl ?? category.imageUrl ?? category.ImageUrl ?? '')
            : '';

        return { value, label, cardCount, thumbnailUrl, key: value || index };
    });

    const activePreviewCategory = proposedCategory || previewCategory;

    useEffect(() => {
        if (!activePreviewCategory) return undefined;

        let isActive = true;

        fetch(`/api/cards?category=${encodeURIComponent(activePreviewCategory)}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(cards => {
                if (!isActive) return;
                if (!Array.isArray(cards)) throw new Error('Invalid card data');
                setPreviewResult({ category: activePreviewCategory, cards, status: 'loaded' });
            })
            .catch(() => {
                if (!isActive) return;
                setPreviewResult({
                    category: activePreviewCategory,
                    cards: [],
                    status: 'error',
                    error: 'Could not load the cards for this category.'
                });
            });

        return () => {
            isActive = false;
        };
    }, [activePreviewCategory]);

    useEffect(() => {
        if (!isModalOpen) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsModalOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isModalOpen]);

    const handleOpenPreviewModal = (value) => {
        setPreviewCategory(value);
        setIsModalOpen(true);
    };

    const handleClosePreviewModal = () => {
        setIsModalOpen(false);
    };

    const isCurrentPreview = previewResult?.category === activePreviewCategory;
    const previewCards = isCurrentPreview ? previewResult.cards : [];
    const previewStatus = activePreviewCategory
        ? (isCurrentPreview ? previewResult.status : 'loading')
        : 'idle';

    const getCategoryMeta = (catName) => {
        const name = String(catName).toLowerCase();
        if (name.includes('animal')) return { icon: '🦁', desc: 'Creatures & beasts' };
        if (name.includes('comic')) return { icon: '💥', desc: 'Heroes & villains' };
        if (name.includes('cn')) return { icon: '📺', desc: 'Cartoon Network characters' };
        if (name.includes('disney')) return { icon: '🏰', desc: 'Magical characters' };
        if (name.includes('people')) return { icon: '👥', desc: 'Simple characters' };
        if (name.includes('pokémon') || name.includes('pokemon')) return { icon: '⚡', desc: 'Monsters & creatures' };
        if (name.includes('food')) return { icon: '🍔', desc: 'Delicious dishes' };
        if (name.includes('hobbies')) return { icon: '🎨', desc: 'Fun activities' };
        if (name.includes('countries')) return { icon: '🌍', desc: 'Countries around the world' };
        if (name.includes('spooky')) return { icon: '👻', desc: 'Spooky Pokémon' };
        if (name.includes('cute')) return { icon: '💕', desc: 'Cute Pokémon' };
        if (name.includes('apps')) return { icon: '📱', desc: 'Popular apps' };
        if (name.includes('celebrities')) return { icon: '💃', desc: 'Famous people' };
        if (name.includes('fiction')) return { icon: '🎭', desc: 'Fictional characters' };
        if (name.includes('memes')) return { icon: '😂', desc: 'Popular memes' };
        if (name.includes('nostalgia')) return { icon: '🎥', desc: 'Old animation characters' };
        if (name.includes('girly-pop')) return { icon: '🎀', desc: 'Girly animated characters' };
        return { icon: '✨', desc: 'Custom card deck' };
    };

    const isMyProposal = proposedCategoryByRole === myRole;
    const proposerName = proposedCategoryByRole === 'creator'
        ? (creatorName || 'Room Creator')
        : (joinerName || 'Opponent');
    const responderName = proposedCategoryByRole === 'creator'
        ? (joinerName || 'Opponent')
        : (creatorName || 'Room Creator');

    const canRespond = previewStatus === 'loaded' && previewCards.length > 0;
    const matchedOption = categoryOptions.find(option => option.value === activePreviewCategory);
    const previewLabel = matchedOption?.label || formatCategoryLabel(activePreviewCategory);
    const previewCount = previewStatus === 'loaded'
        ? previewCards.length
        : matchedOption?.cardCount;

    const handleSuggestClick = () => {
        if (!activePreviewCategory || !canRespond) return;
        setIsModalOpen(false);
        onProposeCategory(activePreviewCategory);
    };

    const handleWithdrawProposal = () => {
        setPreviewCategory(proposedCategory);
        if (typeof onCancelProposal === 'function') {
            onCancelProposal();
        } else if (typeof onRespondCategory === 'function') {
            onRespondCategory(false);
        }
    };

    const renderCardsGrid = () => (
        <>
            {previewStatus === 'loading' && <p className="category-preview__message">Loading cards...</p>}
            {previewStatus === 'error' && <p className="category-preview__message" role="alert">{previewResult.error}</p>}
            {previewStatus === 'loaded' && previewCards.length === 0 && (
                <p className="category-preview__message">This category has no cards to preview.</p>
            )}
            {previewCards.length > 0 && (
                <div className="category-preview__grid">
                    {previewCards.map((card, index) => {
                        const id = card.id ?? card.Id ?? index;
                        const name = card.name ?? card.Name ?? 'Unknown';
                        const imageUrl = card.imageUrl ?? card.ImageUrl ?? '';

                        return (
                            <article className="category-preview__card" key={id} title={name}>
                                {imageUrl ? (
                                    <img src={imageUrl} alt={name} loading="lazy" />
                                ) : (
                                    <div className="category-preview__placeholder" aria-hidden="true">?</div>
                                )}
                                <span title={name}>{name}</span>
                            </article>
                        );
                    })}
                </div>
            )}
        </>
    );

    if (proposedCategory) {
        return (
            <>
                <section
                    className={`panel category-proposal ${isMyProposal ? 'category-proposal--waiting' : 'category-proposal--action-required'}`}
                    aria-live="polite"
                >
                    <span className="category-proposal__badge">
                        {isMyProposal ? 'PROPOSAL SENT • WAITING' : 'ACTION REQUIRED • REVIEW DECK'}
                    </span>
                    <p className="category-proposal__message">
                        <strong>{isMyProposal ? 'You' : proposerName}</strong> suggested{' '}
                        <span>{previewLabel}</span>
                        {typeof previewCount === 'number' && (
                            <span className="category-proposal__count"> ({previewCount} cards)</span>
                        )}
                    </p>
                    <p className="category-proposal__waiting">
                        {isMyProposal
                            ? `Waiting for ${responderName} to accept or decline...`
                            : `Accept to start picking secret cards, or decline to pick another category.`}
                    </p>

                    <div className="category-preview__actions">
                        {isMyProposal ? (
                            <button
                                type="button"
                                className="reset-board-btn"
                                onClick={handleWithdrawProposal}
                            >
                                Withdraw &amp; Change Category
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className="category-preview__respond category-preview__respond--accept"
                                    onClick={() => onRespondCategory(true)}
                                    disabled={!canRespond}
                                >
                                    Accept Category
                                </button>
                                <button
                                    type="button"
                                    className="category-preview__respond category-preview__respond--decline"
                                    onClick={() => onRespondCategory(false)}
                                    disabled={!canRespond}
                                >
                                    Decline
                                </button>
                            </>
                        )}
                    </div>
                </section>

                <section className="panel category-preview" aria-live="polite">
                    <div className="category-preview__header">
                        <div className="category-preview__title-row">
                            <h2>Proposed Deck: {previewLabel}</h2>
                            {typeof previewCount === 'number' && (
                                <span className="category-preview__count-pill">
                                    {previewCount} {previewCount === 1 ? 'card' : 'cards'}
                                </span>
                            )}
                        </div>
                        <p>
                            {isMyProposal
                                ? `You proposed this deck to ${responderName}.`
                                : `Inspect the cards below and decide whether to play with ${previewLabel}.`}
                        </p>
                    </div>

                    {renderCardsGrid()}
                </section>
            </>
        );
    }

    return (
        <>
            <section className="category-selector panel">
                <div className="panel-heading">
                    <div>
                        <h2>Choose &amp; suggest a category</h2>
                        <p>Click any category to open a preview pop-up before proposing to {joinerName || 'your opponent'}.</p>
                    </div>
                </div>

                <div className="category-tiles-grid">
                    {categoryOptions.map(({ value, label, cardCount, thumbnailUrl, key }) => {
                        const isSelected = previewCategory === value && isModalOpen;
                        const meta = getCategoryMeta(label);

                        return (
                            <button
                                key={key}
                                type="button"
                                className={`category-tile ${isSelected ? 'category-tile--selected' : ''}`}
                                aria-pressed={isSelected}
                                onClick={() => handleOpenPreviewModal(value)}
                            >
                                {thumbnailUrl ? (
                                    <img
                                        src={thumbnailUrl}
                                        alt=""
                                        className="category-tile-thumb"
                                        loading="lazy"
                                    />
                                ) : (
                                    <span className="category-tile-icon" aria-hidden="true">{meta.icon}</span>
                                )}
                                <span className="category-tile-name">{String(label).toUpperCase()}</span>
                                <span className="category-tile-desc">{meta.desc}</span>
                                {typeof cardCount === 'number' && (
                                    <span className="category-tile-count">{cardCount} cards</span>
                                )}
                                <span className="category-tile-preview-action">
                                    Preview deck
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {isModalOpen && activePreviewCategory && (
                <div
                    className="category-preview-backdrop"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${previewLabel} category preview`}
                    onClick={handleClosePreviewModal}
                >
                    <div
                        className="category-preview-modal"
                        onClick={event => event.stopPropagation()}
                    >
                        <div className="category-preview-modal__header">
                            <div>
                                <span className="category-preview-modal__badge">DECK PREVIEW</span>
                                <div className="category-preview__title-row">
                                    <h2>{previewLabel}</h2>
                                    {typeof previewCount === 'number' && (
                                        <span className="category-preview__count-pill">
                                            {previewCount} {previewCount === 1 ? 'card' : 'cards'}
                                        </span>
                                    )}
                                </div>
                                <p>Inspect the cards below, then suggest this category to {joinerName || 'your opponent'}.</p>
                            </div>
                            <button
                                type="button"
                                className="deck-peek-close"
                                onClick={handleClosePreviewModal}
                                aria-label="Close category preview"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="category-preview-modal__body">
                            {renderCardsGrid()}
                        </div>

                        <div className="category-preview-modal__footer">
                            <button
                                type="button"
                                className="reset-board-btn"
                                onClick={handleClosePreviewModal}
                            >
                                Back to Categories
                            </button>
                            <button
                                type="button"
                                className="primary-button"
                                onClick={handleSuggestClick}
                                disabled={!canRespond}
                            >
                                Suggest {previewLabel}{typeof previewCount === 'number' ? ` (${previewCount} cards)` : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default CategorySelector;