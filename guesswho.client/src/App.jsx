import { Component, useEffect, useRef, useState } from 'react';
import './App.css';
import Auth from './components/Auth';
import CardGrid from './components/CardGrid';
import CategorySelector from './components/CategorySelector';
import QnaHistory from './components/QnaHistory';
import QuestionPanel from './components/QuestionPanel';
import RoomLobby from './components/RoomLobby';
import GuessModal from './components/GuessModal';

const ROOM_SESSION_KEY = 'guesswhoRoomSession';
const POPUP_DURATION_MS = 8000;
const WRONG_GUESS_POPUP_MS = 5000;

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('UI ErrorBoundary caught error:', error, info);
    }

    render() {
        if (this.state.error) {
            return (
                <div className="game-app">
                    <section className="panel error-boundary-panel">
                        <h2>Render Error</h2>
                        <p className="game-error error-boundary-message">
                            {this.state.error?.message || 'An unexpected error occurred while rendering.'}
                        </p>
                        <button
                            type="button"
                            className="primary-button"
                            onClick={() => {
                                this.setState({ error: null });
                                window.location.reload();
                            }}
                        >
                            Reload App
                        </button>
                    </section>
                </div>
            );
        }
        return this.props.children;
    }
}

function normalizeCards(cards) {
    if (!Array.isArray(cards)) return [];
    return cards.map(card => ({
        ...card,
        id: String(card?.id ?? card?.Id ?? ''),
        isFlipped: Boolean(card?.isFlipped ?? card?.IsFlipped ?? false),
    }));
}

function getSavedRoomSession() {
    try {
        const raw = localStorage.getItem(ROOM_SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        localStorage.removeItem(ROOM_SESSION_KEY);
        return null;
    }
}

function GuessWhoContent() {
    const [currentUser, setCurrentUser] = useState(null);
    const [roomSession, setRoomSession] = useState(getSavedRoomSession);
    const [roomState, setRoomState] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [cards, setCards] = useState([]);
    const [selectedTargetId, setSelectedTargetId] = useState(null);
    const [winningCard, setWinningCard] = useState(null);
    const [questionInput, setQuestionInput] = useState('');
    const [gameError, setGameError] = useState('');
    const [wrongGuessPopup, setWrongGuessPopup] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showGuessModal, setShowGuessModal] = useState(false);
    const [showOpponentDeckModal, setShowOpponentDeckModal] = useState(false);
    const [answerPopup, setAnswerPopup] = useState(null);
    const [copiedRoomCode, setCopiedRoomCode] = useState(false);
    const roomStateVersion = useRef(0);
    const prevMyHistoryCountRef = useRef(0);
    const lastSeenWrongGuessIdRef = useRef(null);
    const pendingWrongGuessCardRef = useRef(null);

    useEffect(() => {
        if (!currentUser) return;
        fetch('/api/cards/categories')
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                const list = Array.isArray(data) ? data : data?.categories;
                setCategories(Array.isArray(list) ? list : []);
            })
            .catch(() => setGameError('Could not load categories.'));
    }, [currentUser]);

    const activeRoomSession = roomSession?.playerName === currentUser ? roomSession : null;

    useEffect(() => {
        if (!activeRoomSession?.roomCode || !activeRoomSession?.playerId) return;
        let isActive = true;
        let timeoutId;

        const refreshRoom = async () => {
            const requestedVersion = roomStateVersion.current;
            try {
                const res = await fetch(
                    `/api/rooms/${encodeURIComponent(activeRoomSession.roomCode)}/state?playerId=${encodeURIComponent(activeRoomSession.playerId)}`
                );
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const state = await res.json();
                if (!isActive || requestedVersion !== roomStateVersion.current) return;

                setRoomState(state);
                if (state?.category) setSelectedCategory(state.category);
                if (Array.isArray(state?.board) && state.board.length > 0) {
                    setCards(normalizeCards(state.board));
                }

                setGameError('');
            } catch (err) {
                if (isActive) {
                    console.error('Room state refresh failed:', err);
                }
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
        const wrongGuessId = roomState?.lastWrongGuessId ?? roomState?.LastWrongGuessId ?? null;
        if (!activeRoomSession || !wrongGuessId) {
            if (!activeRoomSession) lastSeenWrongGuessIdRef.current = null;
            return;
        }

        if (wrongGuessId === lastSeenWrongGuessIdRef.current) return;
        lastSeenWrongGuessIdRef.current = wrongGuessId;

        const role = roomState?.role || activeRoomSession?.role;
        const guesserRole = roomState?.lastWrongGuessByRole ?? roomState?.LastWrongGuessByRole ?? '';
        const iGuessedWrong = Boolean(role && guesserRole && role === guesserRole);
        const guesserName = guesserRole === 'creator'
            ? (roomState?.creatorName || 'Player 1')
            : (roomState?.joinerName || 'Player 2');
        const nextTurnRole = roomState?.currentTurnRole || 'creator';
        const nextTurnName = nextTurnRole === 'creator'
            ? (roomState?.creatorName || 'Player 1')
            : (roomState?.joinerName || 'Player 2');

        const guessedName = roomState?.lastWrongGuessCardName ?? roomState?.LastWrongGuessCardName ?? 'that character';
        const guessedImage = roomState?.lastWrongGuessCardImageUrl ?? roomState?.LastWrongGuessCardImageUrl ?? '';

        setWrongGuessPopup({
            id: wrongGuessId,
            guessedName,
            guessedImage,
            title: iGuessedWrong
                ? `Wrong guess — ${guessedName}`
                : `${guesserName} guessed ${guessedName} — Wrong!`,
            subtitle: iGuessedWrong
                ? `${nextTurnName}'s turn to ask or guess.`
                : 'Your turn to ask or guess.',
        });
    }, [
        activeRoomSession,
        roomState?.lastWrongGuessId,
        roomState?.LastWrongGuessId,
        roomState?.lastWrongGuessByRole,
        roomState?.LastWrongGuessByRole,
        roomState?.lastWrongGuessCardName,
        roomState?.LastWrongGuessCardName,
        roomState?.lastWrongGuessCardImageUrl,
        roomState?.LastWrongGuessCardImageUrl,
        roomState?.currentTurnRole,
        roomState?.creatorName,
        roomState?.joinerName,
        roomState?.role,
    ]);

    useEffect(() => {
        if (!wrongGuessPopup) return;
        const timer = window.setTimeout(() => setWrongGuessPopup(null), WRONG_GUESS_POPUP_MS);
        return () => window.clearTimeout(timer);
    }, [wrongGuessPopup]);

    useEffect(() => {
        const history = Array.isArray(roomState?.questionHistory) ? roomState.questionHistory : [];
        const role = roomState?.role || activeRoomSession?.role;
        const myQuestions = history.filter(
            q => (q?.askedByRole || q?.AskedByRole || q?.playerId || q?.PlayerId) === role
        );

        if (!activeRoomSession || myQuestions.length === 0) {
            prevMyHistoryCountRef.current = 0;
            if (!activeRoomSession) setAnswerPopup(null);
            return;
        }

        if (myQuestions.length > prevMyHistoryCountRef.current) {
            const latest = myQuestions[myQuestions.length - 1];
            const rawAnswer = latest?.answer ?? latest?.Answer ?? '';
            const isTrue = String(rawAnswer).toLowerCase() === 'true';
            const opponentLabel = role === 'creator'
                ? (roomState?.joinerName || 'Opponent')
                : (roomState?.creatorName || 'Opponent');

            setAnswerPopup({
                id: Date.now(),
                question: latest?.question ?? latest?.Question ?? '',
                answerLabel: isTrue ? 'TRUE' : 'FALSE',
                isTrue,
                opponentName: opponentLabel,
            });
        }

        prevMyHistoryCountRef.current = myQuestions.length;
    }, [
        roomState?.questionHistory,
        roomState?.role,
        roomState?.creatorName,
        roomState?.joinerName,
        activeRoomSession,
    ]);

    useEffect(() => {
        if (!answerPopup) return;
        const timer = window.setTimeout(() => setAnswerPopup(null), POPUP_DURATION_MS);
        return () => window.clearTimeout(timer);
    }, [answerPopup]);

    const applyRoomState = (state) => {
        if (!state || typeof state !== 'object') return;
        roomStateVersion.current += 1;
        setRoomState(state);
        setGameError('');
        if (state.category) setSelectedCategory(state.category);
        if (Array.isArray(state.board)) setCards(normalizeCards(state.board));
    };

    const enterRoom = (membership) => {
        const session = { ...membership, playerName: currentUser };
        roomStateVersion.current += 1;
        prevMyHistoryCountRef.current = 0;
        lastSeenWrongGuessIdRef.current = null;
        pendingWrongGuessCardRef.current = null;
        localStorage.setItem(ROOM_SESSION_KEY, JSON.stringify(session));
        setRoomSession(session);
        setRoomState(null);
        setCopiedRoomCode(false);
        setSelectedCategory('');
        setCards([]);
        setSelectedTargetId(null);
        setWinningCard(null);
        setShowOpponentDeckModal(false);
        setAnswerPopup(null);
        setWrongGuessPopup(null);
        setGameError('');
    };

    const leaveRoom = () => {
        roomStateVersion.current += 1;
        prevMyHistoryCountRef.current = 0;
        lastSeenWrongGuessIdRef.current = null;
        pendingWrongGuessCardRef.current = null;
        localStorage.removeItem(ROOM_SESSION_KEY);
        setRoomSession(null);
        setRoomState(null);
        setCopiedRoomCode(false);
        setSelectedCategory('');
        setCards([]);
        setSelectedTargetId(null);
        setWinningCard(null);
        setQuestionInput('');
        setShowOpponentDeckModal(false);
        setAnswerPopup(null);
        setWrongGuessPopup(null);
        setGameError('');
    };

    const copyRoomCode = async () => {
        const roomCode = activeRoomSession?.roomCode;
        if (!roomCode) return;

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(roomCode);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = roomCode;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                const copied = document.execCommand('copy');
                textArea.remove();
                if (!copied) throw new Error('Copy is not supported');
            }

            setCopiedRoomCode(true);
            window.setTimeout(() => setCopiedRoomCode(false), 2000);
        } catch {
            setGameError('Could not copy the room code.');
        }
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
            setGameError(err?.message || 'Proposal failed.');
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
            setGameError(err?.message || 'Response failed.');
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
            setGameError(err?.message || 'Target selection failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendQuestion = async () => {
        const question = questionInput.trim();
        if (!question || !activeRoomSession) return;
        setIsSubmitting(true);
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
            setGameError(err?.message || 'Question submission failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAnswerQuestion = async (isTrue) => {
        if (!activeRoomSession) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/rooms/${encodeURIComponent(activeRoomSession.roomCode)}/answers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: activeRoomSession.playerId, isTrue }),
            });
            if (!res.ok) throw new Error(await res.text());
            applyRoomState(await res.json());
        } catch (err) {
            setGameError(err?.message || 'Answer submission failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGuessSubmit = async (selectedCard) => {
        if (!activeRoomSession || !selectedCard) return;
        const role = roomState?.role || activeRoomSession?.role;
        const turnRole = roomState?.currentTurnRole || 'creator';

        if (roomState?.status !== 'Playing' || turnRole !== role || roomState?.pendingQuestion) {
            setGameError('You can only make a guess on your own turn when no question is pending.');
            setShowGuessModal(false);
            return;
        }

        setIsSubmitting(true);
        pendingWrongGuessCardRef.current = selectedCard;
        try {
            const res = await fetch(`/api/rooms/${encodeURIComponent(activeRoomSession.roomCode)}/guess`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: activeRoomSession.playerId, cardId: selectedCard.id }),
            });
            if (!res.ok) {
                pendingWrongGuessCardRef.current = null;
                throw new Error(await res.text());
            }
            const nextState = await res.json();
            applyRoomState(nextState);
            setShowGuessModal(false);

            if (nextState?.status === 'GameOver') {
                setWinningCard(selectedCard);
            }
            pendingWrongGuessCardRef.current = null;
        } catch (err) {
            setGameError(err?.message || 'Guess submission failed.');
        } finally {
            setIsSubmitting(false);
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
            setGameError(err?.message || 'Card flip failed.');
        }
    };

    const resetBoard = async () => {
        if (!activeRoomSession) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(
                `/api/rooms/${encodeURIComponent(activeRoomSession.roomCode)}/reset?playerId=${encodeURIComponent(activeRoomSession.playerId)}`,
                { method: 'POST' }
            );
            if (!res.ok) throw new Error(await res.text());
            applyRoomState(await res.json());
        } catch (err) {
            setGameError(err?.message || 'Could not reset the board.');
        } finally {
            setIsSubmitting(false);
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

    const safeCards = Array.isArray(cards) ? cards : [];
    const isGameOver = roomState?.status === 'GameOver';
    const isPlaying = roomState?.status === 'Playing';
    const hasSelectedTarget = Boolean(roomState?.hasSelectedTarget);
    const myRole = roomState?.role || activeRoomSession?.role;
    const currentTurnRole = roomState?.currentTurnRole || 'creator';
    const canMakeGuess =
        isPlaying &&
        !isGameOver &&
        currentTurnRole === myRole &&
        !roomState?.pendingQuestion;

    const opponentName = myRole === 'creator'
        ? (roomState?.joinerName || 'Opponent')
        : (roomState?.creatorName || 'Opponent');
    const totalCardsCount = roomState?.totalCardsCount ?? safeCards.length;
    const myOpenCount = myRole === 'creator'
        ? (roomState?.creatorOpenCardsCount ?? totalCardsCount)
        : (roomState?.joinerOpenCardsCount ?? totalCardsCount);
    const opponentOpenCount = myRole === 'creator'
        ? (roomState?.joinerOpenCardsCount ?? totalCardsCount)
        : (roomState?.creatorOpenCardsCount ?? totalCardsCount);

    const rawOpponentFlipIds = roomState?.opponentFlippedCardIds ?? roomState?.OpponentFlippedCardIds;
    const hasOpponentFlipIds = Array.isArray(rawOpponentFlipIds);
    const opponentFlippedSet = new Set((rawOpponentFlipIds || []).map(String));

    const peekCards = safeCards.map(c => ({
        ...c,
        isFlipped: hasOpponentFlipIds ? opponentFlippedSet.has(String(c.id)) : false,
    }));
    const peekEliminatedIds = peekCards.filter(c => c.isFlipped).map(c => c.id);
    const peekEliminatedCount = hasOpponentFlipIds
        ? peekEliminatedIds.length
        : Math.max(0, totalCardsCount - opponentOpenCount);

    const rawHistory = Array.isArray(roomState?.questionHistory) ? roomState.questionHistory : [];
    const myFilteredHistory = rawHistory.filter(
        q => (q?.askedByRole || q?.AskedByRole || q?.playerId || q?.PlayerId) === myRole
    );

    const didIWin = Boolean(roomState?.winnerRole && myRole && roomState.winnerRole === myRole);
    const winnerLabel = roomState?.winnerName
        || roomState?.WinnerName
        || (roomState?.winnerRole === 'creator'
            ? (roomState?.creatorName || 'Creator')
            : (roomState?.joinerName || 'Joiner'));
    const rawOpponentTarget =
        roomState?.opponentTargetCard
        ?? roomState?.OpponentTargetCard
        ?? (didIWin ? winningCard : null);
    const opponentChosenName = rawOpponentTarget?.name ?? rawOpponentTarget?.Name ?? '';
    const opponentChosenImage = rawOpponentTarget?.imageUrl ?? rawOpponentTarget?.ImageUrl ?? '';

    const rawMyTarget =
        roomState?.myTargetCard
        ?? roomState?.MyTargetCard
        ?? roomState?.opponentGuessTargetCard
        ?? roomState?.OpponentGuessTargetCard
        ?? null;
    const myChosenName = rawMyTarget?.name ?? rawMyTarget?.Name ?? '';
    const myChosenImage = rawMyTarget?.imageUrl ?? rawMyTarget?.ImageUrl ?? '';

    return (
        <div className="game-app">
            {wrongGuessPopup && (
                <div
                    key={wrongGuessPopup.id}
                    className={`answer-popup answer-popup--false wrong-guess-popup ${answerPopup ? 'wrong-guess-popup--stacked' : ''}`}
                    role="alertdialog"
                    aria-live="assertive"
                >
                    <div className="answer-popup__header">
                        <span className="answer-popup__tag">WRONG GUESS</span>
                        <button
                            type="button"
                            className="answer-popup__close"
                            onClick={() => setWrongGuessPopup(null)}
                            aria-label="Close wrong guess pop-up"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="wrong-guess-popup__body">
                        <div className="wrong-guess-popup__thumb-wrap">
                            {wrongGuessPopup.guessedImage ? (
                                <img
                                    src={wrongGuessPopup.guessedImage}
                                    alt={wrongGuessPopup.guessedName}
                                    className="wrong-guess-popup__thumb"
                                />
                            ) : (
                                <span className="answer-popup__verdict">WRONG</span>
                            )}
                        </div>

                        <div className="answer-popup__details">
                            <strong>{wrongGuessPopup.title}</strong>
                            <p>{wrongGuessPopup.subtitle}</p>
                        </div>
                    </div>

                    <div className="answer-popup__footer">
                        <button
                            type="button"
                            className="answer-popup__ack"
                            onClick={() => setWrongGuessPopup(null)}
                        >
                            Got it
                        </button>
                    </div>

                    <div className="answer-popup__progress-track" aria-hidden="true">
                        <div className="answer-popup__progress-bar wrong-guess-popup__progress-bar" />
                    </div>
                </div>
            )}

            {answerPopup && (
                <div
                    key={answerPopup.id}
                    className={`answer-popup ${answerPopup.isTrue ? 'answer-popup--true' : 'answer-popup--false'}`}
                    role="alertdialog"
                    aria-live="assertive"
                >
                    <div className="answer-popup__header">
                        <span className="answer-popup__tag">OPPONENT ANSWERED</span>
                        <button
                            type="button"
                            className="answer-popup__close"
                            onClick={() => setAnswerPopup(null)}
                            aria-label="Close answer pop-up"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="answer-popup__body">
                        <span className="answer-popup__verdict">
                            {answerPopup.answerLabel}
                        </span>
                        <div className="answer-popup__details">
                            <strong>{answerPopup.opponentName} replied:</strong>
                            <p>"{answerPopup.question}"</p>
                        </div>
                    </div>

                    <div className="answer-popup__footer">
                        <button
                            type="button"
                            className="answer-popup__ack"
                            onClick={() => setAnswerPopup(null)}
                        >
                            Got it
                        </button>
                    </div>

                    <div className="answer-popup__progress-track" aria-hidden="true">
                        <div className="answer-popup__progress-bar" />
                    </div>
                </div>
            )}

            <div className="game-nav-bar">
                <div className="nav-left-group">
                    {activeRoomSession && (
                        <>
                            {isPlaying && (
                                <button type="button" className="reset-board-btn" onClick={resetBoard} disabled={isSubmitting}>
                                    Reset Board
                                </button>
                            )}
                            <button type="button" className="reset-board-btn" onClick={leaveRoom}>
                                Leave Room
                            </button>
                        </>
                    )}
                </div>

                <div className="nav-right-group">
                    <span className="profile-badge">
                        {currentUser}
                    </span>
                    <button type="button" className="change-deck-btn" onClick={() => setCurrentUser(null)}>
                        Log Out
                    </button>
                </div>
            </div>

            {isPlaying ? (
                <div className="vs-scoreboard">
                    <div className={`vs-player-card ${currentTurnRole === 'creator' ? 'vs-player-card--active' : ''}`}>
                        <div className="vs-player-name">{roomState?.creatorName || 'Player 1'}</div>
                        <div className="vs-card-count">{roomState?.creatorOpenCardsCount ?? 0} / {roomState?.totalCardsCount ?? 0} cards</div>
                        {currentTurnRole === 'creator' && <div className="vs-turn-indicator">Active Turn</div>}
                    </div>

                    <div className="vs-divider">VS</div>

                    <div className={`vs-player-card ${currentTurnRole === 'joiner' ? 'vs-player-card--active' : ''}`}>
                        <div className="vs-player-name">{roomState?.joinerName || 'Player 2'}</div>
                        <div className="vs-card-count">{roomState?.joinerOpenCardsCount ?? 0} / {roomState?.totalCardsCount ?? 0} cards</div>
                        {currentTurnRole === 'joiner' && <div className="vs-turn-indicator">Active Turn</div>}
                    </div>
                </div>
            ) : (
                <header className="game-header"><h1 className="game-title">GUESS WHO?</h1></header>
            )}

            {gameError && <p className="game-error" role="alert">{gameError}</p>}

            {isGameOver ? (
                <section
                    className={`panel game-over-panel ${didIWin ? 'game-over-panel--victory' : 'game-over-panel--defeat'}`}
                    role="region"
                    aria-label="Game Over Summary"
                >
                    <div className="game-over-badge">
                        {didIWin ? 'YOU WIN' : 'YOU LOSE'}
                    </div>

                    <h2 className="game-over-title">
                        {didIWin ? 'Victory!' : 'Defeat — You Lost'}
                    </h2>

                    <p className="game-over-subtitle">
                        {didIWin
                            ? `You guessed ${opponentName}'s secret character correctly!`
                            : `${winnerLabel} guessed your secret character correctly.`}
                    </p>

                    <div className="game-over-reveals">
                        <div className={`game-over-reveal ${didIWin ? 'game-over-reveal--victory' : 'game-over-reveal--defeat'}`}>
                            <span className="game-over-reveal__label">
                                {opponentName}&apos;s Secret Character
                            </span>
                            <div className="game-over-reveal__card">
                                {opponentChosenImage && (
                                    <img
                                        src={opponentChosenImage}
                                        alt={opponentChosenName || `${opponentName}'s secret character`}
                                        className="game-over-reveal__img"
                                    />
                                )}
                                <span className="game-over-reveal__name">
                                    {opponentChosenName || 'Unknown'}
                                </span>
                            </div>
                        </div>

                        <div className={`game-over-reveal ${didIWin ? 'game-over-reveal--victory' : 'game-over-reveal--defeat'}`}>
                            <span className="game-over-reveal__label">
                                Your Chosen Character
                            </span>
                            <div className="game-over-reveal__card">
                                {myChosenImage && (
                                    <img
                                        src={myChosenImage}
                                        alt={myChosenName || 'Your chosen character'}
                                        className="game-over-reveal__img"
                                    />
                                )}
                                <span className="game-over-reveal__name">
                                    {myChosenName || 'Unknown'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="game-over-stats-pill">
                        <div className="game-over-stats-pill__item">
                            <span className="game-over-stats-pill__label">Questions</span>
                            <strong className="game-over-stats-pill__value">{myFilteredHistory.length}</strong>
                        </div>
                        <span className="game-over-stats-pill__divider" aria-hidden="true" />
                        <div className="game-over-stats-pill__item">
                            <span className="game-over-stats-pill__label">Open Cards</span>
                            <strong className="game-over-stats-pill__value">{myOpenCount} / {totalCardsCount}</strong>
                        </div>
                    </div>

                    <div className="game-over-actions">
                        <button
                            type="button"
                            className="primary-button"
                            onClick={leaveRoom}
                        >
                            Back to Lobby
                        </button>
                    </div>
                </section>
            ) : !activeRoomSession ? (
                <RoomLobby playerName={currentUser} onRoomReady={enterRoom} />
            ) : roomState?.status === 'WaitingForPlayer' ? (
                <section className="panel room-waiting">
                    <h2>Waiting for a second player</h2>
                    <p>
                        Share room code:
                        <strong className="room-waiting__code">{activeRoomSession.roomCode}</strong>
                    </p>
                    <button
                        type="button"
                        className="reset-board-btn room-waiting__copy"
                        onClick={copyRoomCode}
                    >
                        {copiedRoomCode ? 'Copied!' : 'Copy Code'}
                    </button>
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
                                {isSubmitting ? 'Confirming...' : 'Confirm & Start'}
                            </button>
                        )}
                    </section>
                    <CardGrid
                        cards={safeCards}
                        selectedCategory={selectedCategory}
                        selectionMode={!hasSelectedTarget}
                        selectedCardId={selectedTargetId}
                        onSelectCard={(id) => !hasSelectedTarget && setSelectedTargetId(id)}
                    />
                </>
            ) : (
                <>
                    <div className="game-action-bar">
                        <button
                            type="button"
                            disabled={!canMakeGuess || isSubmitting}
                            onClick={() => setShowGuessModal(true)}
                            title={canMakeGuess ? 'Make your final character guess' : 'You can only guess on your turn'}
                            className={`guess-btn ${canMakeGuess ? 'guess-btn--active' : 'guess-btn--locked'}`}
                        >
                            {canMakeGuess ? 'Make a Final Guess!' : 'Guess Locked (Not Your Turn)'}
                        </button>

                        <button
                            type="button"
                            className="peek-deck-btn"
                            onClick={() => setShowOpponentDeckModal(true)}
                        >
                            Peek {opponentName}&apos;s Deck ({opponentOpenCount}/{totalCardsCount})
                        </button>
                    </div>

                    {showOpponentDeckModal && (
                        <div
                            className="deck-peek-backdrop"
                            role="dialog"
                            aria-modal="true"
                            aria-label={`${opponentName}'s card deck peek`}
                            onClick={() => setShowOpponentDeckModal(false)}
                        >
                            <div className="deck-peek-modal" onClick={e => e.stopPropagation()}>
                                <div className="deck-peek-modal__header">
                                    <div>
                                        <span className="deck-peek-badge">READ-ONLY PEEK</span>
                                        <h2>{opponentName}&apos;s Deck</h2>
                                        <p>
                                            <strong>{opponentOpenCount}</strong> open &bull; <strong>{peekEliminatedCount}</strong> eliminated
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="deck-peek-close"
                                        onClick={() => setShowOpponentDeckModal(false)}
                                        aria-label="Close opponent deck peek"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="deck-peek-modal__body">
                                    <CardGrid
                                        cards={peekCards}
                                        eliminatedCards={peekEliminatedIds}
                                        canToggleCards={false}
                                        selectedCategory={selectedCategory}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {showGuessModal && canMakeGuess && (
                        <GuessModal
                            opponentCards={safeCards}
                            onGuessSubmit={handleGuessSubmit}
                            onClose={() => setShowGuessModal(false)}
                        />
                    )}

                    {currentTurnRole === myRole && !roomState?.pendingQuestion && (
                        <div className="panel-container">
                            <QuestionPanel
                                questionInput={questionInput}
                                pendingQuestion={roomState?.pendingQuestion}
                                pendingQuestionAskedByRole={roomState?.pendingQuestionAskedByRole}
                                myRole={myRole}
                                currentTurnRole={currentTurnRole}
                                onQuestionChange={setQuestionInput}
                                onSendQuestion={handleSendQuestion}
                                onAnswerQuestion={handleAnswerQuestion}
                                myTargetCard={roomState?.myTargetCard}
                            />
                        </div>
                    )}

                    {roomState?.pendingQuestion && roomState?.pendingQuestionAskedByRole !== myRole && (
                        <div className="panel-container">
                            <QuestionPanel
                                questionInput={questionInput}
                                pendingQuestion={roomState?.pendingQuestion}
                                pendingQuestionAskedByRole={roomState?.pendingQuestionAskedByRole}
                                myRole={myRole}
                                currentTurnRole={currentTurnRole}
                                onQuestionChange={setQuestionInput}
                                onSendQuestion={handleSendQuestion}
                                onAnswerQuestion={handleAnswerQuestion}
                                myTargetCard={roomState?.myTargetCard}
                            />
                        </div>
                    )}

                    {((currentTurnRole !== myRole && !roomState?.pendingQuestion) ||
                      (roomState?.pendingQuestion && roomState?.pendingQuestionAskedByRole === myRole)) && (
                        <section className="panel waiting-panel">
                            <h2>Opponent&apos;s Turn</h2>
                            <p>
                                {roomState?.pendingQuestion && roomState?.pendingQuestionAskedByRole === myRole
                                    ? `Waiting for opponent to answer: "${roomState.pendingQuestion}"`
                                    : `${opponentName} can ask a question or make a guess now.`}
                            </p>
                        </section>
                    )}

                    <QnaHistory qnaHistory={myFilteredHistory} />
                    <CardGrid
                        cards={safeCards}
                        eliminatedCards={safeCards.filter(c => c.isFlipped).map(c => c.id)}
                        onToggleCard={toggleFlip}
                        canToggleCards={true}
                        selectedCategory={selectedCategory}
                    />
                </>
            )}
        </div>
    );
}

export default function App() {
    return (
        <ErrorBoundary>
            <GuessWhoContent />
        </ErrorBoundary>
    );
}