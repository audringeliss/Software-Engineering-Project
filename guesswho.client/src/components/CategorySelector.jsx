import React from 'react';

function CategorySelector({ 
    categories, 
    selectedCategory, 
    proposedCategory, 
    proposedCategoryByRole, 
    myRole, 
    onCategoryChange, 
    onProposeCategory, 
    onRespondCategory 
}) {
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
        return { icon: '✨', desc: 'Custom card deck' };
    };

    const isMyProposal = proposedCategoryByRole === myRole;
    const proposerName = proposedCategoryByRole === 'creator' ? 'Room Creator' : 'Opponent';

    // If a category has been proposed by either player, display the proposal banner/acceptance view
    if (proposedCategory) {
        return (
            <section className="panel category-proposal" style={{ textAlign: 'center', padding: '40px' }}>
                <h2>Category Proposed</h2>
                <p style={{ fontSize: '1.2rem', margin: '15px 0', color: '#fff' }}>
                    <strong>{isMyProposal ? 'You' : proposerName}</strong> suggested: {' '}
                    <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{proposedCategory.toUpperCase()}</span>
                </p>

                {isMyProposal ? (
                    <p style={{ color: '#b0c4de' }}>Waiting for your opponent to accept or decline...</p>
                ) : (
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px' }}>
                        <button 
                            onClick={() => onRespondCategory(true)} 
                            style={{ padding: '12px 28px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' }}
                        >
                            Accept
                        </button>
                        <button 
                            onClick={() => onRespondCategory(false)} 
                            style={{ padding: '12px 28px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' }}
                        >
                            Decline
                        </button>
                    </div>
                )}
            </section>
        );
    }

    return (
        <section className="category-selector panel">
            <div className="panel-heading">
                <div>
                    <h2>Suggest a category</h2>
                    <p>Pick a deck to propose to your opponent!</p>
                </div>
            </div>

            <div className="category-tiles-grid">
                {categories.map((category, index) => {
                    const value = typeof category === 'object'
                        ? (category.id || category.Id || category.name || category.Name)
                        : category;
                    const label = typeof category === 'object'
                        ? (category.name || category.Name)
                        : category;
                    
                    const isSelected = selectedCategory === value;
                    const meta = getCategoryMeta(label);

                    return (
                        <button
                            key={value || index}
                            type="button"
                            className={`category-tile ${isSelected ? 'category-tile--selected' : ''}`}
                            onClick={() => {
                                if (onProposeCategory) {
                                    onProposeCategory(value);
                                } else {
                                    onCategoryChange(value);
                                }
                            }}
                        >
                            <span className="category-tile-icon" aria-hidden="true">{meta.icon}</span>
                            <span className="category-tile-name">{String(label).toUpperCase()}</span>
                            <span className="category-tile-desc">{meta.desc}</span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

export default CategorySelector;