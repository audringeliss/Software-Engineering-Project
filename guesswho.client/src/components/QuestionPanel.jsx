import React from 'react';

function QuestionPanel({
    questionInput,
    pendingQuestion,
    pendingQuestionAskedByRole,
    myRole,
    currentTurnRole,
    onQuestionChange,
    onSendQuestion,
    onAnswerQuestion,
    myTargetCard,
}) {
    const isMyTurnToAsk = myRole === currentTurnRole && !pendingQuestion;
    const isMyTurnToAnswer = pendingQuestion && pendingQuestionAskedByRole !== myRole;

    return (
        <div className="question-panel">
            {/* Ask Section (Shown when it's your turn to ask) */}
            <section className="panel question-panel__ask" style={{ opacity: isMyTurnToAsk ? 1 : 0.6 }}>
                <div className="panel-heading">
                    <div>
                        <h2>Ask a question</h2>
                        <p>{isMyTurnToAsk ? "It's your turn to ask!" : "Waiting for turn or pending answer..."}</p>
                    </div>
                </div>
                <div className="question-input-group">
                    <input
                        type="text"
                        placeholder="e.g. Does your character have glasses?"
                        value={questionInput}
                        onChange={(event) => onQuestionChange(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' && questionInput.trim() && isMyTurnToAsk) {
                                onSendQuestion();
                            }
                        }}
                        disabled={!isMyTurnToAsk}
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
                        className="primary-button"
                        onClick={onSendQuestion}
                        disabled={!isMyTurnToAsk || !questionInput.trim()}
                    >
                        Send
                    </button>
                </div>
            </section>

            {/* Answer Modal Overlay (Shown in front of everything when opponent asks a question) */}
            {isMyTurnToAnswer && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(5, 7, 12, 0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    backdropFilter: 'blur(6px)'
                }}>
                    <div className="panel question-panel__answer modal-content" style={{
                        width: '100%',
                        maxWidth: '480px',
                        backgroundColor: '#1b2132',
                        border: '1px solid #333d52',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
                        padding: '30px',
                        borderRadius: '16px'
                    }}>
                        <div className="panel-heading" style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div>
                                <h2>Answer the question</h2>
                                <p>Your opponent is waiting for your answer.</p>
                            </div>
                        </div>

                        <div className="answer-section">
                            {/* Target Card Reminder Preview - Centered & Larger */}
                            {myTargetCard && (
                                <div className="target-reminder-banner" style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    marginBottom: '20px',
                                    border: '1px solid rgba(255, 255, 255, 0.85)'
                                }}>
                                    <img
                                        src={myTargetCard.imageUrl}
                                        alt={myTargetCard.name}
                                        style={{ 
                                            width: '190px', 
                                            height: '190px', 
                                            borderRadius: '10px', 
                                            objectFit: 'cover', 
                                            marginBottom: '10px',
                                            boxShadow: '0 8px 16px rgba(0,0,0,0.4)'
                                        }}
                                    />
                                    <div>
                                        <span style={{ fontSize: '11px', opacity: 0.6, display: 'block', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Your Secret Target</span>
                                        <strong style={{ fontSize: '18px', color: '#fff' }}>{myTargetCard.name}</strong>
                                    </div>
                                </div>
                            )}

                            <div className="pending-question" style={{ marginBottom: '25px', textAlign: 'center' }}>
                                <span style={{ display: 'block', fontSize: '12px', color: '#38bdf8', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '600' }}>Question Received</span>
                                <strong style={{ fontSize: '20px', color: '#fff' }}>“{pendingQuestion}”</strong>
                            </div>

                            <div className="answer-buttons" style={{ display: 'flex', gap: '12px' }}>
                                <button className="answer-button answer-button--true" onClick={() => onAnswerQuestion(true)} style={{ flex: 1, padding: '14px', fontSize: '16px', fontWeight: '600' }}>
                                    True
                                </button>
                                <button className="answer-button answer-button--false" onClick={() => onAnswerQuestion(false)} style={{ flex: 1, padding: '14px', fontSize: '16px', fontWeight: '600' }}>
                                    False
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default QuestionPanel;