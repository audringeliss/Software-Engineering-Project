function QnaHistory({ qnaHistory }) {
    if (qnaHistory.length === 0) return null;

    return (
        <section className="panel qna-history">
            <div className="panel-heading">
                <span className="panel-number">04</span>
                <div>
                    <h2>Question history</h2>
                </div>
            </div>
            <ul className="history-list">
                {qnaHistory.map((item, index) => (
                    <li key={index} className="history-item">
                        <span className="history-question">Q: {item.question}</span>
                        <span className={`history-answer history-answer--${item.answer.toLowerCase()}`}>
                            A: {item.answer}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}

export default QnaHistory;
