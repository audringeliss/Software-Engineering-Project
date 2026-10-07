function QuestionPanel({
    questionInput,
    pendingQuestion,
    onQuestionChange,
    onSendQuestion,
    onAnswerQuestion
}) {
    return (
        <div className="question-panel">
            <section className="panel question-panel__ask">
                <div className="panel-heading">
                    <span className="panel-number">02</span>
                    <div>
                        <h2>Ask a question</h2>
                        <p>Type a yes-or-no question about the cards.</p>
                    </div>
                </div>
                <div className="question-input-group">
                    <input
                        type="text"
                        placeholder="e.g. Does your person have glasses?"
                        value={questionInput}
                        onChange={(event) => onQuestionChange(event.target.value)}
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
                        className="primary-button"
                        onClick={onSendQuestion}
                        disabled={pendingQuestion !== null || !questionInput.trim()}
                    >
                        Send
                    </button>
                </div>
            </section>

            <section className="panel question-panel__answer">
                <div className="panel-heading">
                    <span className="panel-number">03</span>
                    <div>
                        <h2>Answer the question</h2>
                        <p>Select whether the answer is true or false.</p>
                    </div>
                </div>

                {pendingQuestion ? (
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
                    <p className="waiting-message">Waiting for a question...</p>
                )}
            </section>
        </div>
    );
}

export default QuestionPanel;
