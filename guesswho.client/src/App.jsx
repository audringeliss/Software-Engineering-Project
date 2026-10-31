import { useEffect, useState } from 'react';
import './App.css';
import Auth from './components/Auth';
import CardGrid from './components/CardGrid';
import CategorySelector from './components/CategorySelector';
import GameStatus from './components/GameStatus';
import QuestionPanel from './components/QuestionPanel';
import QnaHistory from './components/QnaHistory';

function App() {
    // Authentication state
    const [currentUser, setCurrentUser] = useState(null);

    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');

    const [cards, setCards] = useState([]);
    const [eliminatedCards, setEliminatedCards] = useState([]);

    const [questionInput, setQuestionInput] = useState('');
    const [pendingQuestion, setPendingQuestion] = useState(null);
    const [qnaHistory, setQnaHistory] = useState([]);

    const [isLoadingCards, setIsLoadingCards] = useState(false);

    useEffect(() => {
        // Only fetch categories if user is logged in
        if (!currentUser) return;

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
                setCategories(['animals', 'people', 'pokémon', 'disney', 'comics', 'cn', 'food', 'hobbies']);
            });
    }, [currentUser]);

    // Load category cards and initialize the backend GameController session
    useEffect(() => {
        if (!selectedCategory || !currentUser) {
            setCards([]);
            return;
        }

        setIsLoadingCards(true);
        fetch(`/api/cards?category=${encodeURIComponent(selectedCategory)}`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(async data => {
                const cardsArray = Array.isArray(data) ? data : data.cards || data.Cards || [];
                setCards(cardsArray);
                setEliminatedCards([]);
                setQnaHistory([]);
                setPendingQuestion(null);

                // Pick a random target card for the game session
                if (cardsArray.length > 0) {
                    const randomTarget = cardsArray[Math.floor(Math.random() * cardsArray.length)];
                    const targetId = randomTarget.id || randomTarget.Id;

                    // Initialize backend GameController session
                    await fetch(`/api/game/start?category=${encodeURIComponent(selectedCategory)}&targetId=${encodeURIComponent(targetId)}`, {
                        method: 'POST'
                    });
                }
            })
            .catch(error => console.error('Cards fetch error:', error))
            .finally(() => setIsLoadingCards(false));
    }, [selectedCategory, currentUser]);

    // Manual client-side card flipping (local toggle)
    const toggleFlip = (id) => {
        setEliminatedCards(prev =>
            prev.includes(id)
                ? prev.filter(cardId => cardId !== id)
                : [...prev, id]
        );
    };

    // Reset current game state
    const handleResetBoard = () => {
        setEliminatedCards([]);
        setQnaHistory([]);
        setPendingQuestion(null);
        setQuestionInput('');
    };

    // Send question to backend GameController (/api/game/ask)
    const handleSendQuestion = async () => {
        if (!questionInput.trim()) return;

        const currentInput = questionInput;
        try {
            await fetch('/api/game/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionText: currentInput,
                    targetAttribute: currentInput,
                    askedAt: new Date().toISOString()
                })
            });

            setPendingQuestion(currentInput);
            setQuestionInput('');
        } catch (error) {
            console.error('Error asking question:', error);
        }
    };

    // Submit answer to backend GameController (/api/game/answer)
    const handleAnswerQuestion = async (isTrue) => {
        try {
            const response = await fetch(`/api/game/answer?isTrue=${isTrue}`, {
                method: 'POST'
            });

            if (response.ok) {
                const updatedCards = await response.json();
                
                const newlyEliminated = updatedCards
                    .filter(c => c.isFlipped || c.IsFlipped)
                    .map(c => c.id || c.Id);

                setEliminatedCards(newlyEliminated);
            }
        } catch (error) {
            console.error('Error processing answer on backend:', error);
        }

        setQnaHistory(prev => [...prev, {
            question: pendingQuestion,
            answer: isTrue ? 'True' : 'False'
        }]);
        setPendingQuestion(null);
    };

    const remainingCount = cards.length - eliminatedCards.length;

    // IF USER IS NOT LOGGED IN, SHOW AUTH SCREEN
    if (!currentUser) {
        return (
            <div className="game-app">
                <header className="game-header">
                    <h1 className="game-title">GUESS WHO?</h1>
                </header>
                <Auth onLoginSuccess={(username) => setCurrentUser(username)} />
            </div>
        );
    }

    return (
        <div className="game-app" style={{ position: 'relative' }}>
            {/* Dedicated Top-Right User Badge & Log Out */}
            <div 
                className="user-top-bar"
                style={{
                    position: 'absolute',
                    top: '15px',
                    right: '25px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 100
                }}
            >
                <span style={{ color: '#e0e6ed', fontSize: '0.95rem', fontWeight: '500' }}>
                    👤 {currentUser}
                </span>
                <button 
                    onClick={() => setCurrentUser(null)} 
                    className="change-deck-btn"
                    style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                >
                    Log Out
                </button>
            </div>

            <header className="game-header" style={{ textAlign: 'center', paddingTop: '10px' }}>
                {!selectedCategory ? (
                    <h1 className="game-title" style={{ margin: '10px 0 20px 0' }}>GUESS WHO?</h1>
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