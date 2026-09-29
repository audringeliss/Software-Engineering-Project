import { useEffect, useState } from 'react';

function App() {
    const [cards, setCards] = useState([]);
    const [eliminatedCards, setEliminatedCards] = useState([]);

    const [questionInput, setQuestionInput] = useState('');
    const [pendingQuestion, setPendingQuestion] = useState(null);
    const [qnaHistory, setQnaHistory] = useState([]);

    useEffect(() => {
        fetch('/api/cards')
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCards(data);
                }
            })
            .catch(error => console.error('Tinklo klaida:', error));
    }, []);

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
        <div style={{
            padding: '40px 20px',
            fontFamily: "'Segoe UI', Roboto, sans-serif",
            background: 'radial-gradient(circle at 50% 20%, #1e2638 0%, #0f121d 100%)',
            color: '#ffffff',
            minHeight: '100vh',
            boxSizing: 'border-box'
        }}>
            {/* 1. Prettier Game Title (Fixed Clipping) */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{
                    display: 'inline-block',
                    margin: '0',
                    padding: '8px 16px', /* Added padding to prevent top/bottom clipping */
                    fontSize: '44px',
                    fontWeight: '800',
                    lineHeight: '1.3', /* Generous line-height so letters are fully visible */
                    letterSpacing: '3px',
                    background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 50%, #00f2fe 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 6px 12px rgba(0, 210, 255, 0.25))'
                }}>
                    GUESS WHO?
                </h1>
            </div>

            {/* Questions Section */}
            <div style={{
                display: 'flex',
                gap: '20px',
                maxWidth: '1000px',
                margin: '0 auto 30px auto',
                alignItems: 'stretch',
                flexWrap: 'wrap'
            }}>
                {/* Ask Question Panel */}
                <div style={{
                    flex: 1,
                    minWidth: '280px',
                    padding: '20px',
                    backgroundColor: 'rgba(30, 30, 42, 0.85)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                }}>
                    <h2 style={{ marginTop: 0, color: '#00d2ff', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        1. Ask Question
                    </h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            placeholder="e.g. Does your person have glasses?"
                            value={questionInput}
                            onChange={(e) => setQuestionInput(e.target.value)}
                            disabled={pendingQuestion !== null}
                            style={{
                                flex: 1,
                                padding: '12px 14px',
                                borderRadius: '8px',
                                border: '1px solid #333d52',
                                backgroundColor: '#141824',
                                color: '#fff',
                                outline: 'none'
                            }}
                        />
                        <button
                            onClick={handleSendQuestion}
                            disabled={pendingQuestion !== null || !questionInput.trim()}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: pendingQuestion !== null || !questionInput.trim() ? '#3a4454' : '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: pendingQuestion !== null || !questionInput.trim() ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold'
                            }}>
                            Send
                        </button>
                    </div>
                </div>

                {/* Answer Question Panel */}
                <div style={{
                    flex: 1,
                    minWidth: '280px',
                    padding: '20px',
                    backgroundColor: 'rgba(30, 30, 42, 0.85)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                }}>
                    <h2 style={{ marginTop: 0, color: '#ffb84d', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        2. Answer Question
                    </h2>

                    {pendingQuestion ? (
                        <div>
                            <p style={{ margin: '0 0 15px 0', fontSize: '15px' }}>
                                <strong style={{ color: '#aaa' }}>Question received:</strong> "{pendingQuestion}"
                            </p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => handleAnswerQuestion(true)}
                                    style={{ flex: 1, padding: '10px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    True
                                </button>
                                <button
                                    onClick={() => handleAnswerQuestion(false)}
                                    style={{ flex: 1, padding: '10px', backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    False
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p style={{ color: '#666', fontStyle: 'italic', margin: '10px 0 0 0' }}>Waiting for a question...</p>
                    )}
                </div>
            </div>

            {/* Q&A History */}
            {qnaHistory.length > 0 && (
                <div style={{
                    maxWidth: '1000px',
                    margin: '0 auto 30px auto',
                    padding: '18px 22px',
                    backgroundColor: 'rgba(30, 30, 42, 0.85)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#888', textTransform: 'uppercase' }}>Question History:</h3>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#ccc', fontSize: '14px' }}>
                        {qnaHistory.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: '6px' }}>
                                <strong>Q:</strong> {item.question} &nbsp;&mdash;&nbsp; <strong>A:</strong> <span style={{ color: item.answer === 'True' ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>{item.answer}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Cards Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                gap: '20px',
                maxWidth: '1000px',
                margin: '0 auto'
            }}>
                {cards.map((card, index) => {
                    const id = card.id || card.Id || index;
                    const name = card.name || card.Name || 'Unknown';
                    const isFlipped = eliminatedCards.includes(id);

                    return (
                        <div
                            key={id}
                            onClick={() => toggleFlip(id)}
                            style={{
                                perspective: '1000px',
                                minHeight: '230px',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{
                                position: 'relative',
                                width: '100%',
                                height: '100%',
                                transition: 'transform 0.6s ease',
                                transformStyle: 'preserve-3d',
                                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                            }}>
                                {/* Front of Card */}
                                <div style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    backgroundColor: '#1e1e2a',
                                    border: '2px solid #2a3859',
                                    borderRadius: '14px',
                                    padding: '18px 16px',
                                    boxSizing: 'border-box',
                                    boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    {/* Character Name with clear padding and line height */}
                                    <h2 style={{
                                        margin: '0 0 10px 0',
                                        padding: '2px 0',
                                        color: '#4da6ff',
                                        fontSize: '20px',
                                        lineHeight: '1.3',
                                        textAlign: 'center',
                                        wordBreak: 'break-word'
                                    }}>
                                        {name}
                                    </h2>

                                    <p style={{ margin: '5px 0 0 0', fontSize: '12px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Attributes:
                                    </p>
                                    <ul style={{ paddingLeft: '18px', margin: '5px 0 0 0', fontSize: '13px', color: '#ccc', overflowY: 'auto', flex: 1 }}>
                                        {Array.isArray(card.attributes || card.Attributes) && (card.attributes || card.Attributes).map((attr, i) => (
                                            <li key={i} style={{ marginBottom: '3px' }}>{String(attr)}</li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Back of Card (Eliminated) */}
                                <div style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    backgroundColor: '#14141c',
                                    border: '2px solid #3d2429',
                                    borderRadius: '14px',
                                    padding: '18px 16px',
                                    boxSizing: 'border-box',
                                    transform: 'rotateY(180deg)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 6px 16px rgba(0,0,0,0.4)'
                                }}>
                                    <span style={{ fontSize: '32px', marginBottom: '8px' }}>🚫</span>
                                    <h3 style={{ margin: 0, color: '#ff5252', fontSize: '15px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Eliminated</h3>
                                    <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#666' }}>Click to flip back</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default App;