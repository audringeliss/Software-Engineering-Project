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
                setCategories(['animals', 'people']);
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

    return (
        <div className="game-app">
            <header className="game-header">
                <h1 className="game-title">GUESS WHO?</h1>
            </header>

            <CategorySelector
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
            />

            {!selectedCategory || isLoadingCards ? (
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