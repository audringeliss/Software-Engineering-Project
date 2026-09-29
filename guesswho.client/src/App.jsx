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
    }

    const handleSendQuestion = () => {
        if (!questionInput.trim()) return;
        setPendingQuestion(questionInput);
        setQuestionInput('');
    }

    const handleAnswerQuestion = (isTrue) => {
        setQnaHistory(prev => [...prev, {
            question: pendingQuestion,
            answer: isTrue ? 'True' : 'False'
        }]);
        setPendingQuestion(null);
    }

    return (
        <div style={{
            padding: '30px',
            fontFamily: 'Segoe UI, sans-serif',
            backgroundColor: '#121212',
            color: '#ffffff',
            minHeight: '100vh',
            boxSizing: 'border-box'
        }}>
            <h1 style={{ marginBottom: '30px', textAlign: 'center' }}>Guess Who?</h1>

            <div style={{
                display: 'flex',
                gap: '20px',
                maxWidth: '1000px',
                margin: '0 auto 30px auto',
                alignItems: 'stretch'
            }}>
                
                <div style={{ flex: 1, padding: '20px', backgroundColor: '#1e1e24', borderRadius: '12px', border: '1px solid #333' }}>
                    <h2 style={{ marginTop: 0, color: '#4da6ff', fontSize: '20px' }}>1. Ask Question</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            placeholder="e.g. Does your person have glasses?"
                            value={questionInput}
                            onChange={(e) => setQuestionInput(e.target.value)}
                            disabled={pendingQuestion !== null}
                            style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#2a2a35', color: '#fff' }}
                        />
                        <button
                            onClick={handleSendQuestion}
                            disabled={pendingQuestion !== null || !questionInput.trim()}
                            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                            Send
                        </button>
                    </div>
                </div>

                
                <div style={{ flex: 1, padding: '20px', backgroundColor: '#1e1e24', borderRadius: '12px', border: '1px solid #333' }}>
                    <h2 style={{ marginTop: 0, color: '#ffb84d', fontSize: '20px' }}>2. Questions</h2>

                    {pendingQuestion ? (
                        <div>
                            <p style={{ margin: '0 0 15px 0', fontSize: '16px' }}><strong>Question received:</strong> "{pendingQuestion}"</p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => handleAnswerQuestion(true)}
                                    style={{ flex: 1, padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    True
                                </button>
                                <button
                                    onClick={() => handleAnswerQuestion(false)}
                                    style={{ flex: 1, padding: '10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    False
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p style={{ color: '#777', fontStyle: 'italic' }}>Waiting for a question...</p>
                    )}
                </div>
            </div>

            {qnaHistory.length > 0 && (
                <div style={{ maxWidth: '1000px', margin: '0 auto 30px auto', padding: '15px', backgroundColor: '#1e1e24', borderRadius: '12px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#ccc' }}>Question History:</h3>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#aaa', fontSize: '14px' }}>
                        {qnaHistory.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: '5px' }}>
                                <strong>Q:</strong> {item.question} &nbsp;&mdash;&nbsp; <strong>A:</strong> <span style={{ color: item.answer === 'True' ? '#4CAF50' : '#f44336' }}>{item.answer}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
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
                                cursor: 'pointer',
                                border: '2px solid #007bff',
                                borderRadius: '12px',
                                padding: '20px',
                                backgroundColor: isFlipped ? '#222' : '#1e1e24',
                                opacity: isFlipped ? 0.4 : 1,
                                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                                textAlign: 'left',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {isFlipped ? (
                                <h2 style={{ textAlign: 'center', color: '#555', marginTop: '20px' }}>Eliminated</h2>
                            ) : (
                                <>
                                    <h2 style={{ marginTop: 0, color: '#4da6ff' }}>{name}</h2>
                                    <p style={{ margin: '5px 0 0 0', fontSize: '14px', fontWeight: 'bold' }}>Attributes:</p>
                                    <ul style={{ paddingLeft: '20px', margin: '5px 0 0 0', fontSize: '13px', color: '#bbb' }}>
                                        {Array.isArray(card.attributes || card.Attributes) && (card.attributes || card.Attributes).map((attr, i) => (
                                            <li key={i}>{String(attr)}</li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default App;