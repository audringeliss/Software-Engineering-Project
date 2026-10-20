import { useEffect, useState } from 'react';
import './App.css';
import CardGrid from './components/CardGrid';
import CategorySelector from './components/CategorySelector';
import GameStatus from './components/GameStatus';
import QuestionPanel from './components/QuestionPanel';
import QnaHistory from './components/QnaHistory';

function App() {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');

    const [cards, setCards] = useState([]);
    const [eliminatedCards, setEliminatedCards] = useState([]);

    const [questionInput, setQuestionInput] = useState('');
    const [pendingQuestion, setPendingQuestion] = useState(null);
    const [qnaHistory, setQnaHistory] = useState([]);

    const [isLoadingCards, setIsLoadingCards] = useState(false);

    useEffect(() => {
        fetch('/api/cards/categories')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                const catsArray = Array.isArray(data) ? data : data.categories || [];
                setCategories(catsArray);
            })
            .catch(error => {
                console.error('Categories fetch error:', error);
                setCategories(['animals', 'people', 'pokémon', 'disney', 'comics']);
            });
    }, []);

    useEffect(() => {
        if (!selectedCategory) {
            setCards([]);
            return;
        }

        setIsLoadingCards(true);
        fetch(`/api/cards?category=${encodeURIComponent(selectedCategory)}`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                const cardsArray = Array.isArray(data) ? data : data.cards || data.Cards || [];
                setCards(cardsArray);
                setEliminatedCards([]);
                setQnaHistory([]);
                setPendingQuestion(null);
            })
            .catch(error => console.error('Cards fetch error:', error))
            .finally(() => setIsLoadingCards(false));
    }, [selectedCategory]);

    const toggleFlip = (id) => {
        setEliminatedCards(prev =>
            prev.includes(id)
                ? prev.filter(cardId => cardId !== id)
                : [...prev, id]
        );
    };

    // Reset current game state back to start
    const handleResetBoard = () => {
        setEliminatedCards([]);
        setQnaHistory([]);
        setPendingQuestion(null);
        setQuestionInput('');
    };

    const handleSendQuestion = () => {
        if (!questionInput.trim()) return;
        setPendingQuestion(questionInput);
        setQuestionInput('');
    };

    const handleAnswerQuestion = (isTrue) => {
        setQnaHistory(prev => [...prev, {
            question: pendingQuestion,
            answer: isTrue ? 'True' : 'False'
        }]);
        setPendingQuestion(null);
    };

    const remainingCount = cards.length - eliminatedCards.length;

    return (
        <div className="game-app">
            <header className="game-header">
                {!selectedCategory ? (
                    <h1 className="game-title">GUESS WHO?</h1>
                ) : (
                    <div className="game-nav-bar">
                        <div className="nav-buttons-group">
                            <button 
                                type="button" 
                                className="change-deck-btn"
                                onClick={() => setSelectedCategory('')}
                            >
                                <span className="btn-icon">←</span> Choose Different Deck
                            </button>

                            <button 
                                type="button" 
                                className="reset-board-btn"
                                onClick={handleResetBoard}
                                title="Reset game board"
                            >
                                🔄 Reset Board
                            </button>
                        </div>

                        <div className="active-deck-badge">
                            <span className="deck-label">PLAYING:</span>
                            <span className="deck-name">{selectedCategory.toUpperCase()}</span>
                            {cards.length > 0 && (
                                <span className="deck-count-pill">{remainingCount} / {cards.length} LEFT</span>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {!selectedCategory ? (
                <CategorySelector
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                />
            ) : isLoadingCards ? (
                <GameStatus
                    selectedCategory={selectedCategory}
                    isLoadingCards={isLoadingCards}
                />
            ) : (
                <>
                    <QuestionPanel
                        questionInput={questionInput}
                        pendingQuestion={pendingQuestion}
                        onQuestionChange={setQuestionInput}
                        onSendQuestion={handleSendQuestion}
                        onAnswerQuestion={handleAnswerQuestion}
                    />
                    <QnaHistory qnaHistory={qnaHistory} />
                    <CardGrid
                        cards={cards}
                        eliminatedCards={eliminatedCards}
                        onToggleCard={toggleFlip}
                        selectedCategory={selectedCategory}
                    />
                </>
            )}
        </div>
    );
}

export default App;