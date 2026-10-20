function CategorySelector({ categories, selectedCategory, onCategoryChange }) {
    const getCategoryMeta = (catName) => {
        const name = String(catName).toLowerCase();
        if (name.includes('animal')) return { icon: '🦁', desc: 'Creatures & beasts' };
        if (name.includes('comic')) return { icon: '💥', desc: 'Heroes & villains' };
        if (name.includes('disney')) return { icon: '🏰', desc: 'Magical characters' };
        if (name.includes('people')) return { icon: '👥', desc: 'Simple characters' };
        if (name.includes('pokémon') || name.includes('pokemon')) return { icon: '⚡', desc: 'Monsters & creatures' };
        return { icon: '✨', desc: 'Custom card deck' };
    };

    return (
        <section className="category-selector panel">
            <div className="panel-heading">
                <div>
                    <h2>Choose a category</h2>
                    <p>Pick the deck you want to play with!</p>
                </div>
            </div>

            <div className="category-tiles-grid">
                <button
                    type="button"
                    className={`category-tile category-tile--all ${!selectedCategory ? 'category-tile--selected' : ''}`}
                    onClick={() => onCategoryChange('')}
                >
                    <span className="category-tile-icon" aria-hidden="true">🌟</span>
                    <span className="category-tile-name">NO CATEGORY</span>
                    <span className="category-tile-desc">Play with everything</span>
                </button>

                {/* Individual Category Cards */}
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
                            onClick={() => onCategoryChange(value)}
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