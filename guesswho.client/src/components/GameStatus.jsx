function GameStatus({ selectedCategory, isLoadingCards }) {
    if (!selectedCategory) {
        return (
            <section className="status-message">
                <div className="status-icon">✦</div>
                <h2>Ready to begin</h2>
                <p>Select a category above to load the deck and start playing.</p>
            </section>
        );
    }

    if (isLoadingCards) {
        return (
            <section className="status-message status-message--loading">
                <div className="loading-spinner" aria-hidden="true" />
                <h2>Loading cards</h2>
                <p>Preparing the cards...</p>
            </section>
        );
    }

    return null;
}

export default GameStatus;
