import React from 'react';

function QnaHistory({ qnaHistory }) {
    if (!qnaHistory || qnaHistory.length === 0) {
        return null;
    }

    const itemCount = Math.min(qnaHistory.length, 5);

    return (
        <div className="qna-history-panel" style={{
            margin: '24px 0',
            padding: '24px',
            backgroundColor: '#141824',
            borderRadius: '16px',
            border: '1px solid #333d52',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
        }}>
            {/* Header section with Title and Color Legend */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#fff', letterSpacing: '0.5px' }}>
                    Question History
                </h3>

                {/* Color Legend */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: 'rgba(34, 197, 94, 0.6)',
                            borderRadius: '3px',
                            border: '1px solid rgba(34, 197, 94, 0.8)'
                        }}></span>
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>True</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: 'rgba(239, 68, 68, 0.6)',
                            borderRadius: '3px',
                            border: '1px solid rgba(239, 68, 68, 0.8)'
                        }}></span>
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>False</span>
                    </div>
                </div>
            </div>

            {/* Proportional Grid Container */}
            <div className="qna-history-grid" style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${itemCount}, 1fr)`,
                gap: '12px'
            }}>
                {qnaHistory.map((item, index) => {
                    const questionText = item.question || item.Question;
                    const answerText = item.answer || item.Answer;
                    const isTrue = answerText?.toLowerCase() === 'true';

                    const cardBg = isTrue ? 'rgba(22, 163, 74, 0.25)' : 'rgba(220, 38, 38, 0.25)';
                    const cardBorder = isTrue ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)';

                    return (
                        <div key={index} className="qna-history-card" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            padding: '12px 14px',
                            backgroundColor: cardBg,
                            borderRadius: '10px',
                            border: `1px solid ${cardBorder}`,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                        }}>
                            <p style={{
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: '500',
                                margin: 0,
                                wordBreak: 'break-word',
                                lineHeight: '1.4'
                            }}>
                                {questionText}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default QnaHistory;