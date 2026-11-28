import { useEffect, useState } from 'react';

function CategorySelector({
    categories,
    proposedCategory,
    proposedCategoryByRole,
    myRole,
    creatorName = 'Room Creator',
    joinerName = 'Opponent',
    onProposeCategory,
    onRespondCategory
}) {
    const [previewCategory, setPreviewCategory] = useState('');
    const [previewResult, setPreviewResult] = useState(null);

    const categoryOptions = categories.map((category, index) => {
        const isObj = typeof category === 'object' && category !== null;
        const value = isObj
            ? (category.id ?? category.Id ?? category.name ?? category.Name ?? '')
            : String(category);
        const label = isObj
            ? (category.name ?? category.Name ?? value)
            : String(category);
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
    const previewLabel = matchedOption?.label || activePreviewCategory;
    const previewCount = previewStatus === 'loaded'
        ? previewCards.length
        : matchedOption?.cardCount;

    return (
        <>
            {proposedCategory ? (
                <section
                    className={`panel category-proposal ${isMyProposal ? 'category-proposal--waiting' : 'category-proposal--action-required'}`}
                    aria-live="polite"
                >
                    <span className="category-proposal__badge">
                        {isMyProposal ? 'PROPOSAL SENT • WAITING' : 'ACTION REQUIRED • REVIEW DECK'}
                    </span>
                    <h2>{isMyProposal ? 'Category Proposed' : `${proposerName} Proposed a Category`}</h2>
                    <p className="category-proposal__message">
                        <strong>{isMyProposal ? 'You' : proposerName}</strong> suggested{' '}
                        <span>{String(previewLabel).toUpperCase()}</span>
                        {typeof previewCount === 'number' && (
                            <span className="category-proposal__count"> ({previewCount} cards)</span>
                        )}
                    </p>
                    <p className="category-proposal__waiting">
                        {isMyProposal
                            ? `Waiting for ${responderName} to accept or decline...`
                            : `Accept to start picking secret cards, or decline to pick another category.`}
                    </p>
                </section>
            ) : (
                <section className="category-selector panel">
                    <div className="panel-heading">
                        <div>
                            <h2>Choose &amp; suggest a category</h2>
                            <p>Click any category to preview its cards and card count before proposing to {joinerName || 'your opponent'}.</p>
                        </div>
                    </div>

                    <div className="category-tiles-grid">
                        {categoryOptions.map(({ value, label, cardCount, thumbnailUrl, key }) => {
                            const isSelected = previewCategory === value;
                            const meta = getCategoryMeta(label);

                            return (
                                <button
                                    key={key}
                                    type="button"
                                    className={`category-tile ${isSelected ? 'category-tile--selected' : ''}`}
                                    aria-pressed={isSelected}
                                    onClick={() => setPreviewCategory(value)}
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
                                        {isSelected ? '✓ Previewing deck' : 'Preview deck'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>
            )}

            {activePreviewCategory && (
                <section className="panel category-preview" aria-live="polite">
                    <div className="category-preview__header">
                        <div className="category-preview__title-row">
                            <h2>{proposedCategory ? `Proposed Deck: ${previewLabel}` : `${previewLabel} Preview`}</h2>
                            {typeof previewCount === 'number' && (
                                <span className="category-preview__count-pill">
                                    {previewCount} {previewCount === 1 ? 'card' : 'cards'}
                                </span>
                            )}
                        </div>
                        <p>
                            {proposedCategory
                                ? (isMyProposal
                                    ? `You proposed this deck to ${responderName}.`
                                    : `Inspect the cards below and decide whether to play with ${previewLabel}.`)
                                : 'Inspect the cards below, then suggest this category to lock it in with your opponent.'}
                        </p>
                    </div>

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
                                    <article className="category-preview__card" key={id}>
                                        {imageUrl ? (
                                            <img src={imageUrl} alt="" loading="lazy" />
                                        ) : (
                                            <div className="category-preview__placeholder" aria-hidden="true">?</div>
                                        )}
                                        <span>{name}</span>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    {proposedCategory ? (
                        !isMyProposal && (
                            <div className="category-preview__actions">
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
                            </div>
                        )
                    ) : (
                        <div className="category-preview__actions">
                            <button
                                type="button"
                                className="primary-button"
                                onClick={() => onProposeCategory(activePreviewCategory)}
                                disabled={!canRespond}
                            >
                                Suggest {previewLabel}{typeof previewCount === 'number' ? ` (${previewCount} cards)` : ''}
                            </button>
                        </div>
                    )}
                </section>
            )}
        </>
    );
}

export default CategorySelector;