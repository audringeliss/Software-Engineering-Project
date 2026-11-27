import { useEffect, useState } from 'react';

function CategorySelector({
    categories,
    proposedCategory,
    proposedCategoryByRole,
    myRole,
    onProposeCategory,
    onRespondCategory
}) {
    const [previewCategory, setPreviewCategory] = useState('');
    const [previewResult, setPreviewResult] = useState(null);

    const categoryOptions = categories.map((category, index) => {
        const value = typeof category === 'object'
            ? (category.id || category.Id || category.name || category.Name)
            : category;
        const label = typeof category === 'object'
            ? (category.name || category.Name)
            : category;

        return { value, label, key: value || index };
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
        if (name.includes('pokémon')) return { icon: '⚡', desc: 'Monsters & creatures' };
        if (name.includes('food')) return { icon: '🍔', desc: 'Delicious dishes' };
        if (name.includes('hobbies')) return { icon: '🎨', desc: 'Fun activities' };
        if (name.includes('countries')) return { icon: '🌍', desc: 'Countries around the world' };
        if (name.includes('spooky')) return { icon: '👻', desc: 'Spooky Pokémon' };
        if (name.includes('cute')) return { icon: '💕', desc: 'Cute Pokémon' };
        if (name.includes('apps')) return { icon: '📱', desc: 'Popular apps' };
        if (name.includes('celebrities')) return { icon: '💃', desc: 'Famous people' };
        return { icon: '✨', desc: 'Custom card deck' };
    };

    const isMyProposal = proposedCategoryByRole === myRole;
    const proposerName = proposedCategoryByRole === 'creator' ? 'Room Creator' : 'Opponent';
    const canRespond = previewStatus === 'loaded' && previewCards.length > 0;
    const previewLabel = categoryOptions.find(option => option.value === activePreviewCategory)?.label
        || activePreviewCategory;

    return (
        <>
            {proposedCategory ? (
                <section className="panel category-proposal">
                    <h2>Category Proposed</h2>
                    <p className="category-proposal__message">
                        <strong>{isMyProposal ? 'You' : proposerName}</strong> suggested{' '}
                        <span>{proposedCategory.toUpperCase()}</span>
                    </p>
                    {isMyProposal ? (
                        <p className="category-proposal__waiting">Waiting for your opponent to accept or decline...</p>
                    ) : null}
                </section>
            ) : (
                <section className="category-selector panel">
                    <div className="panel-heading">
                        <div>
                            <h2>Suggest a category</h2>
                            <p>Preview the cards before suggesting a deck.</p>
                        </div>
                    </div>

                    <div className="category-tiles-grid">
                        {categoryOptions.map(({ value, label, key }) => {
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
                                    <span className="category-tile-icon" aria-hidden="true">{meta.icon}</span>
                                    <span className="category-tile-name">{String(label).toUpperCase()}</span>
                                    <span className="category-tile-desc">{meta.desc}</span>
                                    <span className="category-tile-preview-action">
                                        {isSelected ? 'Previewing cards' : 'Preview cards'}
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
                        <div>
                            <h2>{proposedCategory ? 'Review the proposed deck' : `${previewLabel} cards`}</h2>
                            {previewStatus === 'loaded' && (
                                <p>{previewCards.length} {previewCards.length === 1 ? 'card' : 'cards'} in this deck</p>
                            )}
                        </div>
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
                                    Accept
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
                                Suggest {previewLabel}
                            </button>
                        </div>
                    )}
                </section>
            )}
        </>
    );
}

export default CategorySelector;
