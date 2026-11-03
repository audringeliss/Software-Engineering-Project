import { useEffect, useRef, useState } from 'react';
import './App.css';
import Auth from './components/Auth';
import CardGrid from './components/CardGrid';
import CategorySelector from './components/CategorySelector';
import GameStatus from './components/GameStatus';
import QnaHistory from './components/QnaHistory';
import QuestionPanel from './components/QuestionPanel';
import RoomLobby from './components/RoomLobby';

const ROOM_SESSION_KEY = 'guesswhoRoomSession';

function normalizeCards(cards) {
    return cards.map(card => ({
        ...card,
        id: String(card.id ?? card.Id),
        isFlipped: card.isFlipped ?? card.IsFlipped ?? false,
    }));
}

function getSavedRoomSession() {
    try {
        return JSON.parse(localStorage.getItem(ROOM_SESSION_KEY)) || null;
    } catch (error) {
        console.error('Could not read the saved room session:', error);
        localStorage.removeItem(ROOM_SESSION_KEY);
        return null;
    }
}

function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [roomSession, setRoomSession] = useState(getSavedRoomSession);
    const [roomState, setRoomState] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [cards, setCards] = useState([]);
    const [selectedTargetId, setSelectedTargetId] = useState(null);
    const [questionInput, setQuestionInput] = useState('');
    const [gameError, setGameError] = useState('');
    const [isLoadingCards, setIsLoadingCards] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const roomStateVersion = useRef(0);

    useEffect(() => {
        if (!currentUser) return;

        fetch('/api/cards/categories')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => setCategories(Array.isArray(data) ? data : data.categories || []))
            .catch(error => {
                console.error('Categories fetch error:', error);
                setGameError('Could not load the available decks.');
            });
    }, [currentUser]);

    const activeRoomSession = roomSession?.playerName === currentUser ? roomSession : null;

    useEffect(() => {
        if (!activeRoomSession) return;

        let isActive = true;
        let timeoutId;
        const refreshRoom = async () => {
            const requestedVersion = roomStateVersion.current;
            try {
                const response = await fetch(
                    `/api/rooms/${encodeURIComponent(activeRoomSession.roomCode)}/state?playerId=${encodeURIComponent(activeRoomSession.playerId)}`
                );
                if (!response.ok) {
                    throw new Error(`Room state request failed: HTTP ${response.status}`);
                }

                const state = await response.json();
                if (!isActive || requestedVersion !== roomStateVersion.current) return;

                setRoomState(state);
                setGameError('');
                if (state.status === 'Playing') {
                    setSelectedCategory(state.category);
                    setCards(normalizeCards(state.board));
                }
            } catch (error) {
                if (!isActive) return;
                console.error('Room state refresh failed:', error);
                setGameError('Could not connect to this room. It may have expired or the server may be unavailable.');
            } finally {
                if (isActive) {
                    timeoutId = window.setTimeout(refreshRoom, 1200);
                }
            }
        };

        refreshRoom();
        return () => {
            isActive = false;
            window.clearTimeout(timeoutId);
        };
    }, [activeRoomSession]);

    useEffect(() => {
        if (!selectedCategory || activeRoomSession?.role !== 'creator' || roomState?.status === 'Playing') return;

        let isActive = true;
        fetch(`/api/cards?category=${encodeURIComponent(selectedCategory)}`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (!isActive) return;
                const deck = Array.isArray(data) ? data : data.cards || data.Cards || [];
                setCards(normalizeCards(deck));
                setSelectedTargetId(null);
            })
            .catch(error => {
                if (!isActive) return;
                console.error('Cards fetch error:', error);
                setGameError('Could not load this deck. Please choose another category and try again.');
            })
            .finally(() => {
                if (isActive) setIsLoadingCards(false);
            });

        return () => {
            isActive = false;
        };
    }, [selectedCategory, activeRoomSession, roomState?.status]);

    useEffect(() => {
        if (currentUser && roomSession && roomSession.playerName !== currentUser) {
            localStorage.removeItem(ROOM_SESSION_KEY);
        }
    }, [currentUser, roomSession]);

    const enterRoom = (membership) => {
        const session = { ...membership, playerName: currentUser };
        roomStateVersion.current += 1;
        localStorage.setItem(ROOM_SESSION_KEY, JSON.stringify(session));
        setRoomSession(session);
        setRoomState(null);
        setSelectedCategory('');
        setCards([]);
        setIsLoadingCards(false);
        setSelectedTargetId(null);
        setGameError('');
    };

    const leaveRoom = () => {
        roomStateVersion.current += 1;
        localStorage.removeItem(ROOM_SESSION_KEY);
        setRoomSession(null);
        setRoomState(null);
        setSelectedCategory('');
        setCards([]);
        setSelectedTargetId(null);
        setQuestionInput('');
        setGameError('');
    };

    const chooseCategory = (category) => {
        setSelectedCategory(category);
        setSelectedTargetId(null);
        setCards([]);
        setIsLoadingCards(true);
        setGameError('');
    };

    const applyRoomState = (state) => {
        roomStateVersion.current += 1;
        setRoomState(state);
        if (state.status === 'Playing') {
            setSelectedCategory(state.category);
            setCards(normalizeCards(state.board));
        }
    };

    const startGame = async () => {
        if (!selectedTargetId || !activeRoomSession) return;

        setIsSubmitting(true);
        setGameError('');
        try {
            const response = await fetch(`/api/rooms/${encodeURIComponent(activeRoomSession.roomCode)}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: activeRoomSession.playerId,
                    category: selectedCategory,
                    targetId: selectedTargetId,
                }),
            });
            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || `HTTP error! status: ${response.status}`);
            }
            applyRoomState(await response.json());
        } catch (error) {
            console.error('Error starting room game:', error);
            setGameError(error.message || 'Could not start the game. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendQuestion = async () => {
        const question = questionInput.trim();
        if (!question || !activeRoomSession) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/rooms/${encodeURIComponent(activeRoomSession.roomCode)}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: activeRoomSession.playerId, questionText: question }),
            });
            if (!response.ok) {
                throw new Error(await response.text() || `HTTP error! status: ${response.status}`);
            }
            applyRoomState(await response.json());
            setQuestionInput('');
        } catch (error) {
            console.error('Error sending room question:', error);
            setGameError(error.message || 'Could not send your question.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAnswerQuestion = async (isTrue) => {
        if (!activeRoomSession) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/rooms/${encodeURIComponent(activeRoomSession.roomCode)}/answers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: activeRoomSession.playerId, isTrue }),
            });
            if (!response.ok) {
                throw new Error(await response.text() || `HTTP error! status: ${response.status}`);
            }
            applyRoomState(await response.json());
        } catch (error) {
            console.error('Error answering room question:', error);
            setGameError(error.message || 'Could not submit the answer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleFlip = async (cardId) => {
        if (!activeRoomSession) return;

        try {
            const response = await fetch(`/api/rooms/${encodeURIComponent(activeRoomSession.roomCode)}/cards/flip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: activeRoomSession.playerId, cardId }),
            });
            if (!response.ok) {
                throw new Error(await response.text() || `HTTP error! status: ${response.status}`);
            }
            applyRoomState(await response.json());
        } catch (error) {
            console.error('Error updating room board:', error);
            setGameError(error.message || 'Could not update the board.');
        }
    };

    const resetBoard = async () => {
        if (!activeRoomSession) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(
                `/api/rooms/${encodeURIComponent(activeRoomSession.roomCode)}/reset?playerId=${encodeURIComponent(activeRoomSession.playerId)}`,
                { method: 'POST' }
            );
            if (!response.ok) {
                throw new Error(await response.text() || `HTTP error! status: ${response.status}`);
            }
            applyRoomState(await response.json());
        } catch (error) {
            console.error('Error resetting room game:', error);
            setGameError(error.message || 'Could not reset the game.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyRoomCode = async () => {
        try {
            await navigator.clipboard.writeText(activeRoomSession.roomCode);
        } catch (error) {
            console.error('Could not copy room code:', error);
            setGameError('Could not copy the room code. Select and copy it manually.');
        }
    };

    if (!currentUser) {
        return (
            <div className="game-app">
                <header className="game-header">
                    <h1 className="game-title">GUESS WHO?</h1>
                </header>
                <Auth onLoginSuccess={setCurrentUser} />
            </div>
        );
    }

    const isCreator = activeRoomSession?.role === 'creator';
    const isPlaying = roomState?.status === 'Playing';
    const remainingCount = cards.filter(card => !card.isFlipped).length;

    return (
        <div className="game-app">
            <div className="user-top-bar">
                <span>👤 {currentUser}</span>
                <button type="button" className="change-deck-btn" onClick={() => setCurrentUser(null)}>
                    Log Out
                </button>
            </div>

            <header className="game-header">
                <h1 className="game-title">GUESS WHO?</h1>
            </header>

            {gameError && <p className="game-error" role="alert">{gameError}</p>}

            {!activeRoomSession ? (
                <RoomLobby playerName={currentUser} onRoomReady={enterRoom} />
            ) : (
                <>
                    <section className="panel room-banner">
                        <div>
                            <span className="deck-label">ROOM CODE</span>
                            <strong className="room-code">{activeRoomSession.roomCode}</strong>
                            <span className="room-banner__players">
                                {roomState?.creatorName || currentUser}
                                {roomState?.joinerName ? ` and ${roomState.joinerName}` : ' — waiting for a second player'}
                            </span>
                        </div>
                        <div className="room-banner__actions">
                            <button type="button" className="change-deck-btn" onClick={copyRoomCode}>Copy code</button>
                            {isPlaying && <span className="deck-count-pill">{remainingCount} / {cards.length} LEFT</span>}
                            {isPlaying && isCreator && (
                                <button type="button" className="reset-board-btn" onClick={resetBoard} disabled={isSubmitting}>
                                    Reset Board
                                </button>
                            )}
                            <button type="button" className="reset-board-btn" onClick={leaveRoom}>Leave room</button>
                        </div>
                    </section>

                    {!roomState ? (
                        gameError
                            ? <section className="panel room-waiting"><h2>Room unavailable</h2><p>{gameError}</p></section>
                            : <section className="panel room-waiting" aria-live="polite">
                                <h2>Connecting to room</h2>
                                <p>Loading the latest room state...</p>
                            </section>
                    ) : roomState.status === 'WaitingForPlayer' ? (
                        <section className="panel room-waiting">
                            <h2>Waiting for a second player</h2>
                            <p>Share the room code above. Your friend can join from another browser or device.</p>
                        </section>
                    ) : roomState.status === 'WaitingForTarget' && isCreator ? (
                        <>
                            {!selectedCategory ? (
                                <CategorySelector
                                    categories={categories}
                                    selectedCategory={selectedCategory}
                                    onCategoryChange={chooseCategory}
                                />
                            ) : isLoadingCards ? (
                                <GameStatus selectedCategory={selectedCategory} isLoadingCards />
                            ) : (
                                <>
                                    <section className="panel target-selection">
                                        <div className="panel-heading">
                                            <div>
                                                <h2>Choose your secret character</h2>
                                                <p>Your friend will try to guess this character. Keep your choice secret.</p>
                                            </div>
                                        </div>
                                        <div className="target-selection__actions">
                                            <p aria-live="polite">
                                                {selectedTargetId ? 'Character selected.' : 'Choose one card from the deck below.'}
                                            </p>
                                            <button
                                                type="button"
                                                className="primary-button"
                                                disabled={!selectedTargetId || isSubmitting}
                                                onClick={startGame}
                                            >
                                                {isSubmitting ? 'Starting...' : 'Confirm & Start'}
                                            </button>
                                        </div>
                                    </section>
                                    <CardGrid
                                        cards={cards}
                                        selectedCategory={selectedCategory}
                                        selectionMode
                                        selectedCardId={selectedTargetId}
                                        onSelectCard={setSelectedTargetId}
                                    />
                                </>
                            )}
                        </>
                    ) : roomState.status === 'WaitingForTarget' ? (
                        <section className="panel room-waiting">
                            <h2>Waiting for {roomState.creatorName}</h2>
                            <p>The room creator is choosing a deck and secret character.</p>
                        </section>
                    ) : (
                        <>
                            <div className="room-role-notice">
                                {isCreator
                                    ? 'You chose the secret character. Answer your friend’s questions.'
                                    : 'Ask questions to figure out the secret character.'}
                            </div>
                            <QuestionPanel
                                questionInput={questionInput}
                                pendingQuestion={roomState.pendingQuestion}
                                onQuestionChange={setQuestionInput}
                                onSendQuestion={handleSendQuestion}
                                onAnswerQuestion={handleAnswerQuestion}
                                canAsk={!isCreator}
                                canAnswer={isCreator}
                            />
                            <QnaHistory qnaHistory={roomState.questionHistory || []} />
                            <CardGrid
                                cards={cards}
                                eliminatedCards={cards.filter(card => card.isFlipped).map(card => card.id)}
                                onToggleCard={toggleFlip}
                                canToggleCards={!isCreator}
                                selectedCategory={selectedCategory}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    );
}

export default App;
