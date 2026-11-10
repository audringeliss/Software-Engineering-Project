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
}) {
    const isMyTurnToAsk = myRole === currentTurnRole && !pendingQuestion;
    const isMyTurnToAnswer = pendingQuestion && pendingQuestionAskedByRole !== myRole;

    return (
        <div className="question-panel">
            {/* Ask Section */}
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

            {/* Answer Section */}
            <section className="panel question-panel__answer" style={{ opacity: isMyTurnToAnswer ? 1 : 0.6 }}>
                <div className="panel-heading">
                    <div>
                        <h2>Answer the question</h2>
                        <p>Answer your opponent's question accurately.</p>
                    </div>
                </div>

                {isMyTurnToAnswer ? (
                    <div className="answer-section">
                        <p className="pending-question">
                            <span>Question received</span>
                            <strong>“{pendingQuestion}”</strong>
                        </p>
                        <div className="answer-buttons">
                            <button className="answer-button answer-button--true" onClick={() => onAnswerQuestion(true)}>
                                True
                            </button>
                            <button className="answer-button answer-button--false" onClick={() => onAnswerQuestion(false)}>
                                False
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="waiting-message">
                        {pendingQuestion ? "Waiting for opponent to answer..." : "No pending questions."}
                    </p>
                )}
            </section>
        </div>
    );
}

export default QuestionPanel;