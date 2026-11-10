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
    if (!cards) return [];
    return cards.map(card => ({
        ...card,
        id: String(card.id ?? card.Id),
        isFlipped: card.isFlipped ?? card.IsFlipped ?? false,
    }));
}

function getSavedRoomSession() {
    try {
        return JSON.parse(localStorage.getItem(ROOM_SESSION_KEY)) || null;
    } catch {
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const roomStateVersion = useRef(0);

    useEffect(() => {
        if (!currentUser) return;
        fetch('/api/cards/categories')
            .then(res => res.json())
            .then(data => setCategories(Array.isArray(data) ? data : data.categories || []))
            .catch(() => setGameError('Could not load categories.'));
    }, [currentUser]);

    const activeRoomSession = roomSession?.playerName === currentUser ? roomSession : null;

    useEffect(() => {
        if (!activeRoomSession) return;
        let isActive = true;
        let timeoutId;

        const refreshRoom = async () => {
            const requestedVersion = roomStateVersion.current;
            try {
                const res = await fetch(`/api/rooms/${encodeURIComponent(activeRoomSession.roomCode)}/state?playerId=${encodeURIComponent(activeRoomSession.playerId)}`);
                if (!res.ok) throw new Error();
                const state = await res.json();
                if (!isActive || requestedVersion !== roomStateVersion.current) return;

                setRoomState(state);
                if (state.category) setSelectedCategory(state.category);
                if (state.board?.length > 0) setCards(normalizeCards(state.board));
            } catch {
                if (isActive) setGameError('Connection error to room.');
            } finally {
                if (isActive) timeoutId = window.setTimeout(refreshRoom, 1200);
            }
        };

        refreshRoom();
        return () => {
            isActive = false;
            window.clearTimeout(timeoutId);
        };
    }, [activeRoomSession]);

    const applyRoomState = (state) => {
        roomStateVersion.current += 1;
        setRoomState(state);
        if (state.category) setSelectedCategory(state.category);
        if (state.board) setCards(normalizeCards(state.board));
    };

    const enterRoom = (membership) => {
        const session = { ...membership, playerName: currentUser };
        roomStateVersion.current += 1;
        localStorage.setItem(ROOM_SESSION_KEY, JSON.stringify(session));
        setRoomSession(session);
        setRoomState(null);
        setSelectedCategory('');
        setCards([]);
        setSelectedTargetId(null);
    };

    const leaveRoom = () => {
        roomStateVersion.current += 1;
        localStorage.removeItem(ROOM_SESSION_KEY);
        setRoomSession(null);
        setRoomState(null);
        setSelectedCategory('');
        setCards([]);
        setSelectedTargetId(null);
    };

    const handleProposeCategory = async (category) => {
        if (!activeRoomSession) return;
        try {
            const res = await fetch(`/api/rooms/${encodeURIComponent(activeRoomSession.roomCode)}/category/propose`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: activeRoomSession.playerId, category }),
            });
            if (!res.ok) throw new Error(await res.text());
            applyRoomState(await res.json());
        } catch (err) {
            setGameError(err.message || 'Proposal failed.');
        }
    };

    const handleRespondCategory = async (accept) => {
        if (!activeRoomSession) return;
        try {
            const res = await fetch(`/api/rooms/${encodeURIComponent(activeRoomSession.roomCode)}/category/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: activeRoomSession.playerId, accept }),
            });
            if (!res.ok) throw new Error(await res.text());
            applyRoomState(await res.json());
        } catch (err) {
            setGameError(err.message || 'Response failed.');
        }
    };

    const submitTargetChoice = async () => {
        if (!selectedTargetId || !activeRoomSession || !selectedCategory) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/rooms/${encodeURIComponent(activeRoomSession.roomCode)}/select-target`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: activeRoomSession.playerId, category: selectedCategory, targetId: selectedTargetId }),
            });
            if (!res.ok) throw new Error(await res.text());
            applyRoomState(await res.json());
        } catch (err) {
            setGameError(err.message || 'Target selection failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendQuestion = async () => {
        const question = questionInput.trim();
        if (!question || !activeRoomSession) return;
        try {
            const res = await fetch(`/api/rooms/${encodeURIComponent(activeRoomSession.roomCode)}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: activeRoomSession.playerId, questionText: question }),
            });
            if (!res.ok) throw new Error(await res.text());
            applyRoomState(await res.json());
            setQuestionInput('');
        } catch (err) {
            setGameError(err.message || 'Question submission failed.');
        }
    };

    const handleAnswerQuestion = async (isTrue) => {
        if (!activeRoomSession) return;
        try {
            const res = await fetch(`/api/rooms/${encodeURIComponent(activeRoomSession.roomCode)}/answers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: activeRoomSession.playerId, isTrue }),
            });
            if (!res.ok) throw new Error(await res.text());
            applyRoomState(await res.json());
        } catch (err) {
            setGameError(err.message || 'Answer submission failed.');
        }
    };

    const toggleFlip = async (cardId) => {
        if (!activeRoomSession) return;
        try {
            const res = await fetch(`/api/rooms/${encodeURIComponent(activeRoomSession.roomCode)}/cards/flip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: activeRoomSession.playerId, cardId }),
            });
            if (!res.ok) throw new Error(await res.text());
            applyRoomState(await res.json());
        } catch (err) {
            setGameError(err.message || 'Card flip failed.');
        }
    };

    if (!currentUser) {
        return (
            <div className="game-app">
                <header className="game-header"><h1 className="game-title">GUESS WHO?</h1></header>
                <Auth onLoginSuccess={setCurrentUser} />
            </div>
        );
    }

    const isPlaying = roomState?.status === 'Playing';
    const hasSelectedTarget = roomState?.hasSelectedTarget ?? false;
    const bothTargetsSelected = roomState?.bothTargetsSelected ?? false;
    const myRole = roomState?.role || activeRoomSession?.role;
    const currentTurnRole = roomState?.currentTurnRole || 'creator';

    return (
        <div className="game-app">
            <div className="user-top-bar">
                <span>👤 {currentUser} ({myRole})</span>
                <button type="button" className="change-deck-btn" onClick={() => setCurrentUser(null)}>Log Out</button>
            </div>

            <header className="game-header"><h1 className="game-title">GUESS WHO?</h1></header>

            {gameError && <p className="game-error">{gameError}</p>}

            {!activeRoomSession ? (
                <RoomLobby playerName={currentUser} onRoomReady={enterRoom} />
            ) : roomState?.status === 'WaitingForPlayer' ? (
                <section className="panel room-waiting">
                    <h2>Waiting for a second player</h2>
                    <p>Share room code: <strong>{activeRoomSession.roomCode}</strong></p>
                </section>
            ) : !selectedCategory || roomState?.status === 'WaitingForCategory' || roomState?.status === 'CategoryProposed' ? (
                <CategorySelector
                    categories={categories}
                    proposedCategory={roomState?.proposedCategory}
                    proposedCategoryByRole={roomState?.proposedCategoryByRole}
                    myRole={myRole}
                    onProposeCategory={handleProposeCategory}
                    onRespondCategory={handleRespondCategory}
                />
            ) : !isPlaying ? (
                <>
                    <section className="panel target-selection">
                        <div className="panel-heading">
                            <h2>Choose your secret character</h2>
                            <p>{hasSelectedTarget ? 'Locked in! Waiting for opponent...' : 'Select a card below and confirm.'}</p>
                        </div>
                        {!hasSelectedTarget && (
                            <button className="primary-button" disabled={!selectedTargetId || isSubmitting} onClick={submitTargetChoice}>
                                Confirm & Start
                            </button>
                        )}
                    </section>
                    <CardGrid
                        cards={cards}
                        selectedCategory={selectedCategory}
                        selectionMode={!hasSelectedTarget}
                        selectedCardId={selectedTargetId}
                        onSelectCard={(id) => !hasSelectedTarget && setSelectedTargetId(id)}
                    />
                </>
            ) : (
                <>
                    <GameStatus
                        selectedCategory={selectedCategory}
                        hasSelectedTarget={hasSelectedTarget}
                        bothTargetsSelected={bothTargetsSelected}
                        myRole={myRole}
                        currentTurnRole={currentTurnRole}
                    />
                    <QuestionPanel
                        questionInput={questionInput}
                        pendingQuestion={roomState.pendingQuestion}
                        pendingQuestionAskedByRole={roomState.pendingQuestionAskedByRole}
                        myRole={myRole}
                        currentTurnRole={currentTurnRole}
                        onQuestionChange={setQuestionInput}
                        onSendQuestion={handleSendQuestion}
                        onAnswerQuestion={handleAnswerQuestion}
                    />
                    <QnaHistory qnaHistory={roomState.questionHistory || []} />
                    <CardGrid
                        cards={cards}
                        eliminatedCards={cards.filter(c => c.isFlipped).map(c => c.id)}
                        onToggleCard={toggleFlip}
                        canToggleCards={true}
                        selectedCategory={selectedCategory}
                    />
                </>
            )}
        </div>
    );
}

export default App;