function CategorySelector({ categories, selectedCategory, onCategoryChange }) {
    return (
        <section className="category-selector panel">
            <div className="panel-heading">
                <span className="panel-number">01</span>
                <div>
                    <h2>Choose a category</h2>
                    <p>Pick the deck you want to play with.</p>
                </div>
            </div>
            <label className="screen-reader-only" htmlFor="category-select">
                Select a category
            </label>
            <select
                id="category-select"
                className="category-select"
                value={selectedCategory}
                onChange={(event) => onCategoryChange(event.target.value)}
            >
                <option value="">Choose a category</option>
                {categories.map((category, index) => {
                    const value = typeof category === 'object'
                        ? (category.id || category.Id || category.name || category.Name)
                        : category;
                    const label = typeof category === 'object'
                        ? (category.name || category.Name)
                        : category;

                    return (
                        <option key={value || index} value={value}>
                            {String(label).toUpperCase()}
                        </option>
                    );
                })}
            </select>
        </section>
    );
}

export default CategorySelector;
